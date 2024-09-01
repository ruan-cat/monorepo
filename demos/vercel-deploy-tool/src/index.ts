// 学习一下如何使用 https://github.com/sindresorhus/execa/blob/main/readme.md
import fs from "fs";
import { type Result, execa } from "execa";
import { config as dotenvConfig } from "@dotenvx/dotenvx";
import { merge, concat } from "lodash-es";

export {};

// const pkgNames = <const>["pnpm", "turbopack", "vite", "vue", "koishi", "lodash", "axios"];
// 查询多个包的版本
// const response = await Promise.all(
// 	pkgNames.map((name) => {
// 		return execa`pnpm v ${name}`;
// 	}),
// );
// response.forEach((res) => {
// 	console.log(" res.stdout ", res.stdout);
// });

/** 部署目标的具体项目配置 */
export interface DeployTarget {
	/** 目标的工作目录 */
	targetCWD: string;
	/** 生产环境的访问url */
	url: string[];
	/**
	 * 用户命令
	 * @description
	 * 实际部署的构建命令 通常是真实参与部署的命令
	 */
	userCommands: string[];
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

console.log(" 查看来自 @dotenvx/dotenvx 获取的环境变量： ", currentDotenvConfig);

/** 项目内的vercel配置 */
const config: Config = {
	vercelProjetName: "vercel-monorepo-test-1-zn20",
	vercelToken: "",
	vercelOrgId: "",
	vercelProjectId: "",

	deployTargets: [
		{
			targetCWD: "./packages/docs-01-star",
			url: ["docs-01-star.ruancat6312.top"],
			userCommands: [
				// FIXME: 在具体的execa中，无法使用pnpm的筛选命令。只能指定其工作目录。
				// "pnpm -F @ruan-cat-vercel-monorepo-test/docs-01-star build:docs",
				// "pnpm -F @ruan-cat-vercel-monorepo-test/docs-01-star copy-dist",
				"pnpm -C=./packages/docs-01-star build:docs",
				"pnpm -C=./packages/docs-01-star copy-dist",
			],
		},

		{
			targetCWD: "./demos/gh.HFIProgramming.mikutap",
			url: ["mikutap.ruancat6312.top"],
			userCommands: [],
		},
	],
};
// TODO: 在内部完成一次文件的移除，新建，复制等操作
// ('rimraf .vercel/output/static && mkdirp .vercel/output/static && cpx "docs/.vitepress/dist/**/*" .vercel/output/static && shx ls -R .vercel/output/static');

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
const vercelNullConfigPath = "./vercel.null.def.json";

/** 初始化vercel的空配置文件 */
function generateVercelNullConfig() {
	fs.writeFileSync(vercelNullConfigPath, JSON.stringify(vercelNullConfig, null, 2));
}

/**
 * 初始化配置
 * @description
 * 初始化环境变量
 */
function initVercelConfig() {
	const { VERCEL_ORG_ID, VERCEL_PROJECT_ID, VERCEL_TOKEN } = currentDotenvConfig!;

	const res: Config = merge(config, {
		// vercelOrgId: process.env.VERCEL_ORG_ID,
		// vercelProjectId: process.env.VERCEL_PROJECT_ID,
		// vercelToken: process.env.VERCEL_TOKEN,
		vercelOrgId: VERCEL_ORG_ID,
		vercelProjectId: VERCEL_PROJECT_ID,
		vercelToken: VERCEL_TOKEN,
	} satisfies Partial<Config>);

	console.log(" 完成初始化本地的配置 ", res);

	return res;
}

function getYesCommandArgument() {
	return ["--yes"];
}

function getProdCommandArgument() {
	return ["--prod"];
}

function getPrebuiltCommandArgument() {
	return ["--prebuilt"];
}

/** 以命令参数数组的形式，获得项目名称 */
function getVercelProjetNameCommandArgument() {
	return [`--project=${config.vercelProjetName}`];
}

/** 以命令参数数组的形式，获得项目token */
function getVercelTokenCommandArgument() {
	return [`--token=${config.vercelToken}`];
}

/** 以命令参数数组的形式，获得工作目录 */
function getTargetCWDCommandArgument(deployTarget: DeployTarget) {
	return [`--cwd=${deployTarget.targetCWD}`];
}

/** 创建简单的异步任务 */
function generateSimpleAsyncTask<T>(func: T) {
	return Promise.resolve(func);
}

/** 生成link任务 */
function generateLinkTasks(deployTarget: DeployTarget) {
	const res = async function () {
		return await execa(
			"vc link",
			concat(
				getYesCommandArgument(),
				getTargetCWDCommandArgument(deployTarget),
				getVercelProjetNameCommandArgument(),
				getVercelTokenCommandArgument(),
			),
			{
				shell: true,
			},
		);
	};

	const res2 = new Promise<
		Result<{
			shell: true;
		}>
	>((resolve) => {
		resolve(
			execa(
				"vc link",
				concat(
					getYesCommandArgument(),
					getTargetCWDCommandArgument(deployTarget),
					getVercelProjetNameCommandArgument(),
					getVercelTokenCommandArgument(),
				),
				{
					shell: true,
				},
			),
		);
	});

	const res3 = Promise.resolve(
		execa(
			"vc link",
			concat(
				getYesCommandArgument(),
				getTargetCWDCommandArgument(deployTarget),
				getVercelProjetNameCommandArgument(),
				getVercelTokenCommandArgument(),
			),
			{
				shell: true,
			},
		),
	);

	// return res;
	// return res2;
	return generateSimpleAsyncTask(
		execa(
			"vc link",
			concat(
				getYesCommandArgument(),
				getTargetCWDCommandArgument(deployTarget),
				getVercelProjetNameCommandArgument(),
				getVercelTokenCommandArgument(),
			),
			{
				shell: true,
			},
		),
	);
}

/** 生成build任务 */
function generateBuildTasks(deployTarget: DeployTarget) {
	// const res = async function () {
	// 	return await execa(
	// 		"vc build",
	// 		concat(
	// 			getYesCommandArgument(),
	// 			getProdCommandArgument(),
	// 			getTargetCWDCommandArgument(deployTarget),
	// 			getVercelTokenCommandArgument(),
	// 		),
	// 		{
	// 			shell: true,
	// 		},
	// 	);
	// };
	// return res;

	return generateSimpleAsyncTask(
		execa(
			"vc build",
			concat(
				getYesCommandArgument(),
				getProdCommandArgument(),
				getTargetCWDCommandArgument(deployTarget),
				getVercelTokenCommandArgument(),
			),
			{
				shell: true,
			},
		),
	);
}

/** 生成用户命令任务 */
function generateUserCommandTasks(deployTarget: DeployTarget) {
	/**
	 * 单个部署目标的全部串行任务
	 * @description
	 * 一个部署目标可能有多个用户命令。这些命令需要串行执行，而不是并行执行的。
	 */
	const singleDeployTargetSerialTask = async function () {
		const allSingleDeployTargetUserCommandTasks = deployTarget.userCommands.map((userCommand) => {
			return generateSimpleAsyncTask(
				execa(`${userCommand}`, {
					shell: true,
				}),
			);
		});

		for await (const task of allSingleDeployTargetUserCommandTasks) {
			const singleDeployTargetUserCommandTaskResult = await task;
			console.log(" in singleDeployTargetUserCommandTaskResult ", singleDeployTargetUserCommandTaskResult.stdout);
		}
	};

	return generateSimpleAsyncTask(singleDeployTargetSerialTask);
}

// TODO: 待检查是否合适有效
/** 生成Deploy任务 */
function generateDeployTasks(deployTarget: DeployTarget) {
	const res = async function () {
		return await execa(
			"vc deploy",
			concat(
				getYesCommandArgument(),
				getProdCommandArgument(),
				getTargetCWDCommandArgument(deployTarget),
				getVercelTokenCommandArgument(),
			),
			{
				shell: true,
			},
		);
	};

	return res;
}

/** 任务函数类型 */
type TaskFunction = ReturnType<typeof generateLinkTasks>;

const allVercelLinkTasks: TaskFunction[] = [];
const allVercelBuildTasks: TaskFunction[] = [];
const allUserCommandTasks: Array<ReturnType<typeof generateUserCommandTasks>> = [];
const allVercelDeployTasks: TaskFunction[] = [];

/**
 * 生成异步任务
 * @description
 * 这里将多个子任务组合成一个大任务
 * 用同一个类型的任务 整合成一个任务
 *
 * 比如link、build、deploy，全部整合到一个任务中
 *
 * 按照大阶段并行的方式执行
 */
function generateAsyncTasks(deployTargets: DeployTarget[]) {
	deployTargets.forEach((deployTarget, indx, arr) => {
		const linkTask = generateLinkTasks(deployTarget);
		allVercelLinkTasks.push(linkTask);

		const buildTask = generateBuildTasks(deployTarget);
		allVercelBuildTasks.push(buildTask);

		const userCommandTask = generateUserCommandTasks(deployTarget);
		allUserCommandTasks.push(userCommandTask);

		const deployTask = generateDeployTasks(deployTarget);
		allVercelDeployTasks.push(deployTask);
	});
}

/** 执行link链接任务 */
async function doLinkTasks() {
	const res = await Promise.all(allVercelLinkTasks);
	res.forEach((item) => {
		console.log(" link任务结果： ", item.stdout);
	});
}

/** 执行build构建目录任务 */
async function doBuildTasks() {
	const res = await Promise.all(allVercelLinkTasks);
	res.forEach((item) => {
		console.log(" build任务结果： ", item.stdout);
	});
}

async function main() {
	generateVercelNullConfig();
	const { deployTargets } = initVercelConfig();
	generateAsyncTasks(deployTargets);

	await doLinkTasks();
	await doBuildTasks();
}

main();

// const linkRes =
// 	await execa`vc link --yes --cwd=${config.targetCWD} --project=${config.vercelProjetName} -t ${config.vercelToken}`;
// console.log(" ? linkRes  ", linkRes.stdout);

// const baseCommandArgument = ["--yes", "--prod", `--cwd=${config.targetCWD}`, `-t`, config.vercelToken];
// const nullConfigCommandArgument = [`-A=${vercelNullConfigPath}`];
// const buildStaticRes = await execa("vc build", concat(baseCommandArgument, nullConfigCommandArgument), {
// 	shell: true,
// });
// console.log(" ? buildStaticRes  ", buildStaticRes.stdout);

// TODO: 等待封装
// const buildCommands = config.buildCommand.map((buildCommand) => {
// 	return async function () {
// 		return await execa`${buildCommand}`;
// 	};
// });
// for await (const buildCommand of buildCommands) {
// 	const buildCommandStdout = await buildCommand();
// 	console.log(" in buildCommandStdout ", buildCommandStdout.stdout);
// }

// TODO: 实现 deploy 命令；
