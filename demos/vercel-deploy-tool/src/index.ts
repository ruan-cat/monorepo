// 学习一下如何使用 https://github.com/sindresorhus/execa/blob/main/readme.md
import fs from "fs";
import { execa } from "execa";
import { config as dotenvConfig } from "@dotenvx/dotenvx";
import { merge, concat, isNil } from "lodash-es";
import { consola } from "consola";

import { generateSimpleAsyncTask, runPromiseByQueue } from "./utils/simple-promise-tools";

/**
 * @description
 * 从 drizzle-kit 学的
 */
type Verify<T, U extends T> = U;

const deployTargetTypes = <const>["static", "userCommands"];

type DeployTargetType = (typeof deployTargetTypes)[number];

/** 配置基类 */
export type Base = {
	/** 部署目标分类 */
	type: DeployTargetType;

	/** 目标的工作目录 */
	targetCWD: string;

	/** 生产环境的访问url */
	url: string[];
};

/**
 * 带有 `pnpm -C` 筛选前缀的用户命令
 * @example pnpm -C=./packages/docs-01-star build:docs
 */
// type UserCommandsWithPnpmPath<T extends string> = `pnpm -C=${T} ${string}`;
type UserCommandsWithPnpmPath<T extends WithUserCommands["targetCWD"]> = `pnpm -C=${T} ${string}`;

/** 带有用户命令的配置 */

export interface WithUserCommands extends Base {
	type: Verify<DeployTargetType, "userCommands">;

	/**
	 * 用户命令
	 * @description
	 * 实际部署的构建命令 通常是真实参与部署的命令
	 *
	 * FIXME: 在具体的execa中，无法使用pnpm的筛选命令。只能指定其工作目录。
	 * TODO: 实现对 targetCWD 的读取，并实现类型声明。
	 *
	 * pnpm -F @ruan-cat-vercel-monorepo-test/docs-01-star build:docs
	 *
	 * @example pnpm -C=./packages/docs-01-star build:docs
	 * @example pnpm -C=./packages/monorepo-5 build:docs
	 *
	 */
	// userCommands: Array<UserCommandsWithPnpmPath<WithUserCommands["outputDirectory"]> | string>;
	userCommands: UserCommandsWithPnpmPath<WithUserCommands["targetCWD"]>[];

	/**
	 * 部署输出路径
	 * @description
	 * 这里要填写满足 cpx 库能够识别glob语法的路径
	 * @example docs/.vitepress/dist/**\/*
	 * @example src/.vuepress/dist/**\/*
	 */
	outputDirectory: string;
}

/** 部署目标的具体项目配置 */
export type DeployTarget = Base | WithUserCommands;

/** 项目配置 */
export interface Config {
	/** 项目名称 */
	vercelProjetName: string;

	/** 用户token */
	vercelToken: string;
	/** 用户组织id */
	vercelOrgId: string;
	/** 用户项目id */
	vercelProjectId: string;

	/**
	 * 部署目标
	 * @description
	 * 考虑到可能要部署一揽子的项目，所以这里使用数组
	 *
	 * 考虑monorepo的情况
	 */
	deployTargets: DeployTarget[];
}

/** 项目配置 */
export interface Config {
	/** 项目名称 */
	vercelProjetName: string;

	/** 用户token */
	vercelToken: string;
	/** 用户组织id */
	vercelOrgId: string;
	/** 用户项目id */
	vercelProjectId: string;

	/**
	 * 部署目标
	 * @description
	 * 考虑到可能要部署一揽子的项目，所以这里使用数组
	 *
	 * 考虑monorepo的情况
	 */
	deployTargets: DeployTarget[];
}

// 拓展返回值
declare module "@dotenvx/dotenvx" {
	interface DotenvParseOutput {
		[name: string]: string;
		/**
		 * token
		 * @description
		 * 默认名称为 `VERCEL_TOKEN`
		 */
		VERCEL_TOKEN: string;
		/**
		 * 组织id
		 * @description
		 * 默认名称为 `VERCEL_ORG_ID`
		 */
		VERCEL_ORG_ID: string;
		/**
		 * 项目id
		 * @description
		 * 默认名称为 `VERCEL_PROJECT_ID`
		 */
		VERCEL_PROJECT_ID: string;
	}
}

/** 当前的环境变量 */
const currentDotenvConfig = dotenvConfig({
	// 具体识别的路径，会自动识别根目录下面的env文件，故这里不作处理
	//  path: "../../../.env"
}).parsed;

consola.info(" 查看来自 @dotenvx/dotenvx 获取的环境变量： ", currentDotenvConfig);

/** 项目内的vercel配置 */
const config: Config = {
	vercelProjetName: "vercel-monorepo-test-1-zn20",
	vercelToken: "",
	vercelOrgId: "",
	vercelProjectId: "",

	deployTargets: [
		{
			type: "userCommands",
			targetCWD: "./packages/docs-01-star",
			url: ["docs-01-star.ruancat6312.top"],
			outputDirectory: "docs/.vitepress/dist/**/*",
			userCommands: ["pnpm -C=./packages/docs-01-star build:docs"],
		},

		{
			type: "userCommands",
			targetCWD: "./packages/monorepo-5",
			outputDirectory: "src/.vuepress/dist/**/*",
			url: ["monorepo-5.ruancat6312.top", "monorepo5.ruan-cat.com"],
			userCommands: ["pnpm -C=./packages/monorepo-5 build:docs"],
		},

		{
			type: "static",
			targetCWD: "./demos/gh.HFIProgramming.mikutap",
			url: ["mikutap.ruancat6312.top"],
			// 测试类型约束是否到位。
			// userCommands: ["echo 'mikutap1'", "echo 'mikutap2'", "echo 'mikutap3'"],
		},
	],
};

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
const vercelNullConfig = <const>{
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

/**
 * 初始化配置
 * @description
 * 初始化环境变量
 */
function initVercelConfig() {
	const vercelOrgId = currentDotenvConfig!.VERCEL_ORG_ID ?? process.env.VERCEL_ORG_ID;
	const vercelProjectId = currentDotenvConfig!.VERCEL_PROJECT_ID ?? process.env.VERCEL_PROJECT_ID;
	const vercelToken = currentDotenvConfig!.VERCEL_TOKEN ?? process.env.VERCEL_TOKEN;

	const res: Config = merge(config, {
		vercelOrgId,
		vercelProjectId,
		vercelToken,
	} satisfies Partial<Config>);

	consola.success(" 完成初始化本地的配置 ", res);

	return res;
}

function isDeployTargetsBase(target: DeployTarget): target is Base {
	return target.type === "static";
}

function isDeployTargetsWithUserCommands(target: DeployTarget): target is WithUserCommands {
	return target.type === "userCommands";
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

// 不再使用 未来看情况删除了。
// /** 创建简单的异步任务 */
// function generateSimpleAsyncTask<T extends (...args: any) => any>(func: T) {
// 	return function () {
// 		return new Promise<ReturnType<T>>((resolve, reject) => {
// 			resolve(func());
// 		});
// 	};
// }

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
		return generateExeca({
			command,
			parameters: [],
		});
	});

	return copyDistTasks;
}

/** 生成用户命令任务 */
function generateUserCommandTasks(deployTarget: DeployTarget) {
	/**
	 * 单个部署目标的全部串行任务
	 * @description
	 * 一个部署目标可能有多个用户命令。这些命令需要串行执行，而不是并行执行的。
	 */
	async function singleDeployTargetSerialTask() {
		// FIXME: 另外一个类型守卫写法，无法实现有意义的泛型约束 被推断为nerver了。

		if (!isDeployTargetsWithUserCommands(deployTarget)) {
			consola.warn(" 当前目标不属于需要执行一系列用户自定义命令。 ");
			return;
		}

		/** 用户命令 */
		const userCommands = deployTarget.userCommands.map((command) => {
			return generateExeca({
				command,
				parameters: [],
			});
		});

		/** 全部复制移动文件的命令 */
		const copyDistTasks = generateCopyDistTasks(deployTarget);

		/** 对于单个部署目标的全部要执行的命令 */
		const allTasksForSingleDeployTarget = concat(userCommands, copyDistTasks);

		for await (const task of allTasksForSingleDeployTarget) {
			const { stdout, command } = await task();
			consola.info(` 在目录为 ${deployTarget.targetCWD} 的任务中，子任务 ${command} 的运行结果为： \n  `, stdout);
		}
	}

	return generateSimpleAsyncTask(singleDeployTargetSerialTask);
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
 * 生成部署阶段的任务
 * @description
 * 部署阶段分为前后两个步骤
 *
 * 1. 将文件上传到vercel内
 * 2. 将返回的url设置别名
 */
function generateDeployStepTask(deployTarget: DeployTarget) {
	async function main() {
		const deploy = generateDeployTask(deployTarget);

		const { stdout: vercelUrl } = await deploy();
		consola.success(` 完成部署任务 检查生成的url为： \n`, vercelUrl);

		const aliasTasks = deployTarget.url.map((userUrl) => {
			return generateAliasTask(vercelUrl, userUrl);
		});

		(await Promise.all(aliasTasks.map((item) => item()))).forEach(({ stdout, command }) => {
			consola.log(` 命令 ${command} 的结果为： \n`, stdout);
		});
	}

	return generateSimpleAsyncTask(main);
}

type GenerateExeca = ReturnType<typeof generateExeca>;

type GenerateExecaReturn = ReturnType<GenerateExeca>;

/** 任务函数类型 */
type TaskFunction<T extends unknown | GenerateExecaReturn = unknown> = () => Promise<T>;

const steps = <const>["linkStep", "buildStep", "userCommandStep", "deployStep"];
type Step = (typeof steps)[number];

type AllStep = Record<Step, TaskFunction[]>;

/**
 * 生成各个主要阶段异步任务对象
 * @description
 * 识别配置提供的全部部署对象 根据各个大阶段生成并行任务
 *
 * 将多个子任务组合成一个大任务 用同一个类型的任务 整合成一个任务
 *
 * 比如link、build、deploy，全部整合到一个任务中
 *
 * 按照大阶段并行的方式执行
 */
function generateMainStepTasks(deployTargets: DeployTarget[]) {
	const allStep: AllStep = {
		linkStep: [],
		buildStep: [],
		userCommandStep: [],
		deployStep: [],
	};

	deployTargets.forEach((deployTarget, indx, arr) => {
		allStep.linkStep.push(generateLinkTask(deployTarget));
		allStep.buildStep.push(generateBuildTask(deployTarget));
		allStep.userCommandStep.push(generateUserCommandTasks(deployTarget));
		allStep.deployStep.push(generateDeployStepTask(deployTarget));
	});

	return allStep;
}

/**
 * 执行命令
 * @description
 * 默认并发地执行一个阶段的全部并列的命令
 */
async function doTasks(params: {
	taskFunctions: TaskFunction[];
	pre?: (...args: any) => any;
	post?: (...args: any) => any;
}) {
	params?.pre?.();

	(await Promise.all(params.taskFunctions.map((item) => item()))).forEach((item) => {
		if (isNil(item)) {
			return;
		}

		const { stdout = null, command = null } = <Awaited<GenerateExecaReturn>>item;
		if (isNil(stdout) || isNil(command)) {
			return;
		}
		consola.info(` 命令 ${command} 的结果为 \n`, stdout);
	});

	params?.post?.();
}

/** 执行link链接任务 */
async function doLinkTasks(allStep: AllStep) {
	await doTasks({
		taskFunctions: allStep.linkStep,
		pre: () => consola.start(" 开始link任务 "),
		post: () => consola.success(" 完成link任务 "),
	});
}

/** 执行build构建目录任务 */
async function doBuildTasks(allStep: AllStep) {
	await doTasks({
		taskFunctions: allStep.buildStep,
		pre: () => consola.start(" 开始build任务 "),
		post: () => consola.success(" 完成build任务 "),
	});
}

/** 执行用户命令任务 */
async function doUserCommandTasks(allStep: AllStep) {
	await doTasks({
		taskFunctions: allStep.userCommandStep,
		pre: () => consola.start(" 开始用户命令任务 "),
		post: () => consola.success(" 完成用户命令任务 "),
	});
}

/** 执行部署任务 */
async function doDeployTasks(allStep: AllStep) {
	await doTasks({
		taskFunctions: allStep.deployStep,
		pre: () => consola.start(" 开始部署任务 "),
		post: () => consola.success(" 完成部署任务 "),
	});
}

async function main() {
	await generateVercelNullConfig();
	const { deployTargets } = initVercelConfig();
	const allStep = generateMainStepTasks(deployTargets);

	await doLinkTasks(allStep);
	await doBuildTasks(allStep);
	await doUserCommandTasks(allStep);
	await doDeployTasks(allStep);
}

main();
