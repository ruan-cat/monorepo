// 学习一下如何使用 https://github.com/sindresorhus/execa/blob/main/readme.md
import fs from "node:fs";
import { execa } from "execa";
import { concat, isEmpty, isUndefined } from "lodash-es";
import { consola } from "consola";
import { isConditionsEvery, isConditionsSome } from "@ruan-cat/utils";

import {
	initVercelConfig,
	config,
	getConfig,
	type Config,
	type Base,
	type DeployTarget,
	type WithUserCommands,
} from "./config";
import { generateSimpleAsyncTask } from "./utils/simple-promise-tools";

import {
	definePromiseTasks,
	executePromiseTasks,
	type BaseTask,
	type ParallelTasks,
	type QueueTasks,
	type Task,
} from "./utils/define-promise-tasks";

/**
 * vercel 的空配置
 * @description
 * 设计理由
 *
 * 用于驱动vercel构建简单的目录结构，不需要额外的配置
 *
 * 该配置会被写入到 `vercel.null.def.json` 文件中
 *
 * @see https://github.com/amondnet/vercel-action#method-1---via-vercel-interface
 */
export const vercelNullConfig = <const>{
	framework: null,
	buildCommand: null,
	installCommand: null,
	outputDirectory: null,
	devCommand: null,
	public: false,
	git: {
		deploymentEnabled: {
			main: false,
		},
	},
};

/**
 * 空配置文件的路径
 * @description
 * 生成空配置文件。这样用户在其他项目内，就不需要自己提供vercel配置文件了。
 */
const vercelNullConfigPath = <const>"./vercel.null.def.json";

/** vercel文件api指定要求的文件目录 */
const vercelOutputStatic = <const>".vercel/output/static";

/** 初始化vercel的空配置文件 */
async function generateVercelNullConfig() {
	fs.writeFileSync(vercelNullConfigPath, JSON.stringify(vercelNullConfig, null, 2));
}

function isDeployTargetsBase(target: DeployTarget): target is Base {
	return target.type === "static";
}

function isDeployTargetsWithUserCommands(target: DeployTarget): target is WithUserCommands {
	return target.type === "userCommands";
}

/** 获得 isCopyDist 配置 */
function getIsCopyDist(target: WithUserCommands) {
	return target?.isCopyDist ?? true;
}

/** 是否需要移动文件？ */
function isNeedCopyDist(target: DeployTarget) {
	if (isDeployTargetsWithUserCommands(target)) {
		const isCopyDist = getIsCopyDist(target);

		/**
		 * 每个条件都满足时 就需要移动文件
		 * 默认总是认为要移动文件
		 */
		return isConditionsEvery([
			// 如果被用户显性设置为false，不需要移动，那么就直接退出 不移动文件
			() => isCopyDist,

			// 只要用户提供了非空输出目录 就认为需要移动文件
			// 输出目录是必填项 不做判断
			// () => !isEmpty(target.outputDirectory),

			// 只要用户提供了非空命令 就认为用户提供了有意义的build构建命令 就默认移动文件
			// 用户不填写命令时 也可能需要移动文件 故这里不做判断
			// () => !isEmpty(target.userCommands),
		]);
	} else {
		// 不是带有用户命令的部署目标 那么就不需要移动文件
		return false;
	}
}

function getYesCommandArgument() {
	return <const>["--yes"];
}

function getProdCommandArgument() {
	return <const>["--prod"];
}

function getPrebuiltCommandArgument() {
	return <const>["--prebuilt"];
}

/** 以命令参数数组的形式，获得项目名称 */
function getVercelProjetNameCommandArgument() {
	return <const>[`--project=${config.vercelProjetName}`];
}

/** 以命令参数数组的形式，获得项目token */
function getVercelTokenCommandArgument() {
	return <const>[`--token=${config.vercelToken}`];
}

/** 以命令参数数组的形式，获得项目vercel的本地配置 */
function getVercelLocalConfigCommandArgument() {
	return <const>[`--local-config=${vercelNullConfigPath}`];
}

/** 以命令参数数组的形式，获得工作目录 */
function getTargetCWDCommandArgument(deployTarget: DeployTarget) {
	return <const>[`--cwd=${deployTarget.targetCWD}`];
}

/**
 * 生成简单的 execa 函数
 * @description
 * 对 execa 做简单的包装
 */
function generateExeca(execaSimpleParams: { command: string; parameters: string[] }) {
	const { command, parameters } = execaSimpleParams;
	return generateSimpleAsyncTask(() => execa(command, parameters, { shell: true }));
}

/**
 * 生成link任务
 * @description
 * 旨在于封装类似于这样的命令：
 *
 * vc link --yes --cwd=${{env.p1}} --project=${{env.pjn}} -t ${{env.vct}}
 */
function generateLinkTask(deployTarget: DeployTarget) {
	return generateExeca({
		command: "vc link",
		parameters: concat(
			getYesCommandArgument(),
			getTargetCWDCommandArgument(deployTarget),
			getVercelProjetNameCommandArgument(),
			getVercelTokenCommandArgument(),
		),
	});
}

/**
 * 生成build任务
 * @description
 * 旨在于封装类似于这样的命令：
 *
 * vc build --yes --prod --cwd=${{env.p1}} -A ./vercel.null.json -t ${{env.vct}}
 */
function generateBuildTask(deployTarget: DeployTarget) {
	return generateExeca({
		command: "vc build",
		parameters: concat(
			getYesCommandArgument(),
			getProdCommandArgument(),
			getTargetCWDCommandArgument(deployTarget),
			getVercelLocalConfigCommandArgument(),
			getVercelTokenCommandArgument(),
		),
	});
}

/**
 * 针对单个部署目标，生成一系列移动目录的任务
 * @description
 * 旨在于封装类似于这样的命令：
 *
 * ```bash
 * # 删除目录
 * rimraf .vercel/output/static
 *
 * # 新建目录
 * mkdirp .vercel/output/static
 *
 * # 复制目录到目标
 * cpx \"docs/.vitepress/dist/**\/*\" .vercel/output/static
 *
 * # 输出目录
 * shx ls -R .vercel/output/static
 * ```
 */
function generateCopyDistTasks(deployTarget: WithUserCommands) {
	function delDirectoryCmd() {
		return <const>`rimraf ${vercelOutputStatic}`;
	}

	function createDirectoryCmd() {
		return <const>`mkdirp ${vercelOutputStatic}`;
	}

	function copyDirectoryFileCmd() {
		return <const>`cpx "${deployTarget.outputDirectory}" ${vercelOutputStatic}`;
	}

	function printDirectoryFileCmd() {
		return <const>`shx ls -R ${vercelOutputStatic}`;
	}

	function cmdPrefix() {
		return <const>`pnpm -C=${deployTarget.targetCWD}`;
	}

	function cmdTemple<T extends (...args: any) => string, R extends ReturnType<T>>(
		cmdFunc: T,
	): `${ReturnType<typeof cmdPrefix>} ${R}` {
		return `${cmdPrefix()} ${<R>cmdFunc()}`;
	}

	const delCmd = cmdTemple(delDirectoryCmd);
	const createCmd = cmdTemple(createDirectoryCmd);
	const copyFileCmd = cmdTemple(copyDirectoryFileCmd);
	const printFileCmd = cmdTemple(printDirectoryFileCmd);

	const copyDistTasks = (<const>[delCmd, createCmd, copyFileCmd, printFileCmd]).map((command) => {
		return generateSimpleAsyncTask(async function () {
			const commandFunction = generateExeca({
				command,
				parameters: [],
			});
			const { code, stdout } = await commandFunction();
			consola.info(` 执行了命令： `, code);
			consola.box(stdout);
		});
	});

	return copyDistTasks;
}

/**
 * 生成alias任务
 * @description
 * 旨在于封装类似于这样的命令：
 *
 * vc alias set "$url1" ${{env.p1-url}} -t ${{env.vct}}
 */
function generateAliasTask(vercelUrl: string, userUrl: string) {
	return generateExeca({
		command: `vc alias set ${vercelUrl} ${userUrl}`,
		parameters: concat(getVercelTokenCommandArgument()),
	});
}

/**
 * 生成Deploy任务
 * @description
 * 旨在于封装类似于这样的命令：
 *
 * vc deploy --yes --prebuilt --prod --cwd=${{env.p1}} -t ${{env.vct}}
 */
function generateDeployTask(deployTarget: DeployTarget) {
	return generateExeca({
		command: "vc deploy",
		parameters: concat(
			getYesCommandArgument(),
			getPrebuiltCommandArgument(),
			getProdCommandArgument(),
			getTargetCWDCommandArgument(deployTarget),
			getVercelTokenCommandArgument(),
		),
	});
}

/**
 * 生成 afterBuildTasks 阶段的任务配置
 * @description
 * 这里返回的是具体的 Task 任务配置 不是异步函数
 */
function generateAfterBuildTasksConfig(config: Config): Task {
	const afterBuildTasks = config.afterBuildTasks;

	if (isConditionsSome([() => isUndefined(afterBuildTasks), () => isEmpty(afterBuildTasks)])) {
		return {
			type: "single",
			tasks: generateSimpleAsyncTask(() => consola.warn(` 当前没有有意义的 afterBuildTasks 任务配置 `)),
		};
	} else {
		return {
			type: "queue",
			tasks: afterBuildTasks!.map((command) => {
				return generateSimpleAsyncTask(async () => {
					const userCommand = generateExeca({
						command,
						parameters: [],
					});
					consola.start(` 开始用户 afterBuildTasks 命令任务 `);
					const { code, stdout } = await userCommand();
					consola.success(` 完成用户 afterBuildTasks 命令任务 ${code} `);
					consola.box(stdout);
				});
			}),
		};
	}
}

/**
 * 使用异步函数定义工具的方式
 * @version 2
 */
async function main() {
	await generateVercelNullConfig();

	const config = getConfig();
	const { deployTargets } = config;

	const promiseTasks = definePromiseTasks({
		type: "queue",

		tasks: [
			// 全部的link链接任务
			{
				type: "parallel",
				tasks: deployTargets.map((deployTarget) => {
					return generateSimpleAsyncTask(async () => {
						const link = generateLinkTask(deployTarget);
						consola.start(` 开始link任务 `);
						await link();
						consola.success(` 完成link任务 `);
					});
				}),
			},

			// 全部的build构建任务
			{
				type: "parallel",
				tasks: deployTargets.map((deployTarget) => {
					return generateSimpleAsyncTask(async () => {
						const build = generateBuildTask(deployTarget);
						consola.start(` 开始build任务 `);
						const { code, stdout } = await build();
						consola.success(` 完成build任务 `);
						consola.info(` 完成命令 ${code} `);
						consola.box(stdout);
					});
				}),
			},

			// afterBuildTasks 在build命令阶段后 执行的用户命令
			generateAfterBuildTasksConfig(config),

			// 全部的用户命令任务
			{
				type: "parallel",
				tasks: deployTargets.map((deployTarget) => {
					return {
						type: "queue",
						tasks: [
							// 用户命令任务
							// 如果没有用户命令
							!isDeployTargetsWithUserCommands(deployTarget)
								? generateSimpleAsyncTask(() => {
										consola.warn(" 当前目标不属于需要执行一系列用户自定义命令。 ");
									})
								: // 否则有用户命令
									{
										type: "queue",
										tasks: deployTarget.userCommands.map((command) => {
											return generateSimpleAsyncTask(async () => {
												const userCommand = generateExeca({
													command,
													parameters: [],
												});
												consola.start(` 开始用户命令任务 `);
												const { code, stdout } = await userCommand();
												consola.success(` 完成用户命令任务 ${code} `);
												consola.box(stdout);
											});
										}),
									},

							// 复制移动文件任务
							// 是否需要移动文件？
							isNeedCopyDist(deployTarget) &&
							// 这一行判断其实是冗余的 仅用于满足下面的类型检查
							isDeployTargetsWithUserCommands(deployTarget)
								? {
										type: "queue",
										tasks: generateCopyDistTasks(deployTarget),
									}
								: generateSimpleAsyncTask(() => {
										consola.warn(" 不需要移动文件 ");
									}),
						],
					};
				}),
			},

			// 全部的部署任务
			{
				type: "parallel",
				tasks: deployTargets.map((deployTarget) => {
					return {
						type: "queue",
						// 串行执行部署任务和别名任务
						tasks: [
							// 部署任务
							generateSimpleAsyncTask(async () => {
								const deploy = generateDeployTask(deployTarget);
								consola.start(` 开始部署任务 `);
								const { stdout: vercelUrl } = await deploy();
								consola.success(` 完成部署任务 检查生成的url为 \n `);
								consola.box(vercelUrl);
								return vercelUrl;
							}),

							// 并发的别名任务
							{
								type: "parallel",
								tasks: deployTarget.url.map((userUrl) => {
									return generateSimpleAsyncTask(async (vercelUrl: string) => {
										const alias = generateAliasTask(vercelUrl, userUrl);
										consola.start(` 开始别名任务 `);
										const { stdout, command } = await alias();
										consola.success(` 执行了： ${command} `);
										consola.success(` 完成别名任务 可用的别名地址为 \n`);
										consola.box(`https://${userUrl}`);
									});
								}),
							},
						],
					};
				}),
			},
		],
	});

	await executePromiseTasks(promiseTasks);
}

main();
