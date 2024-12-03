import { resolve } from "pathe";
import { loadConfig } from "c12";
import { config as dotenvConfig } from "@dotenvx/dotenvx";
import { consola } from "consola";
import { merge } from "lodash-es";
import { program } from "commander";

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
	targetCWD: `./${string}`;

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
	 * FIXME: 这个字段无法实现类型声明，缺失类型提示了。
	 * TODO: 实现对 targetCWD 的读取，并实现类型声明。
	 *
	 * pnpm -F @ruan-cat-vercel-monorepo-test/docs-01-star build:docs
	 *
	 * @example pnpm -C=./packages/docs-01-star build:docs
	 * @example pnpm -C=./packages/monorepo-5 build:docs
	 */
	userCommands: UserCommandsWithPnpmPath<WithUserCommands["targetCWD"]>[];

	/**
	 * 部署输出路径
	 *
	 * @version 1
	 * @description
	 * 这里要填写满足 cpx 库能够识别glob语法的路径
	 * @example docs/.vitepress/dist/**\/*
	 * @example src/.vuepress/dist/**\/*
	 *
	 * @version 2
	 * @description
	 * 填写打包目录的路径即可。不包含glob语法。
	 * @example docs/.vitepress/dist
	 */
	outputDirectory: string;

	/**
	 * 是否移动打包目录至特定的vercel部署目录？
	 * @description
	 * 执行完用户命令后，一般会执行文件移动命令，以便于部署
	 *
	 * 该配置用于控制是否执行文件移动命令
	 *
	 * @default true
	 */
	isCopyDist?: boolean;
}

/** 部署目标的具体项目配置 */
export type DeployTarget = Base | WithUserCommands;

/** vercel部署工具的配置 */
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
	 * 用户提供的 vercel.json 配置文件
	 * @description
	 * 有时候 用户需要提供自己的一套配置文件
	 *
	 * 这里提供配置路径
	 */
	vercelJsonPath?: string;

	/**
	 * 是否显示运行命令？
	 * @description
	 * 默认不显示运行命令。
	 */
	isShowCommand?: boolean;

	/** 在build命令阶段后 执行的用户命令 */
	afterBuildTasks?: string[];

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

program
	.name("vercel-deploy-tool")
	// 环境变量的地址
	.option("--env-path <path>", "环境变量的地址")
	.parse();
const options = program.opts();

consola.info(" 查看命令行提供的参数 ", options);

/** 初始化的当前的环境变量 */
function initCurrentDotenvConfig() {
	// 如果存在环境变量路径 就使用并读取
	const dotenvConfigParams = options?.envPath
		? {
				path: options?.envPath,
			}
		: {};

	const res = dotenvConfig(
		dotenvConfigParams,
		// 	{
		// 	// 具体识别的路径，会自动识别根目录下面的env文件，故这里不作处理
		// 	 path: "../../../.env"
		// }
	).parsed;

	consola.info(" 查看来自 @dotenvx/dotenvx 获取的环境变量： ");
	consola.box(res);

	return res;
}

/** 默认配置 */
const defConfig = <Config>{
	vercelProjetName: "",
	vercelToken: "",
	vercelOrgId: "",
	vercelProjectId: "",
	deployTargets: [],
};

/** 配置文件的文件名称 */
export const configFileName = <const>"vercel-deploy-tool";

/**
 * 加载用户配置
 * @description
 * 从约定俗成的配置处，获得用户配置文件
 */
async function loadUserConfig() {
	const { config } = await loadConfig<Config>({
		cwd: resolve("."),
		name: configFileName,
		dotenv: true,
		defaults: defConfig,
	});

	consola.success(" 完成加载用户配置 ");
	consola.box(config);

	return config;
}

/**
 * 初始化配置
 * @description
 * 初始化环境变量
 */
export async function initVercelConfig() {
	/** 当前的环境变量 */
	const currentDotenvConfig = initCurrentDotenvConfig();

	/** 用户配置 */
	const userConfig = await loadUserConfig();

	const vercelOrgId = currentDotenvConfig!.VERCEL_ORG_ID ?? process.env.VERCEL_ORG_ID;
	const vercelProjectId = currentDotenvConfig!.VERCEL_PROJECT_ID ?? process.env.VERCEL_PROJECT_ID;
	const vercelToken = currentDotenvConfig!.VERCEL_TOKEN ?? process.env.VERCEL_TOKEN;

	const res: Config = merge(userConfig, {
		vercelOrgId,
		vercelProjectId,
		vercelToken,
	} satisfies Partial<Config>);

	consola.success(" 完成初始化项目配置 ");
	// 显示效果没有那么好看
	consola.box(res);

	return res;
}

/** 项目内的vercel配置 */
export const config = await initVercelConfig();

/** 项目内的vercel配置 */
export function getConfig() {
	return config;
}
