/**
 * @description
 * 从 drizzle-kit 学的类型验证技巧
 */
type Verify<T, U extends T> = U;

/** 部署目标类型 */
export type DeployTargetType = "static" | "userCommands";

/** 基础配置 */
export interface DeployTargetBase {
	/** 部署目标分类 */
	type: DeployTargetType;

	/** 目标的工作目录 */
	targetCWD: `./${string}`;

	/** 生产环境的访问url */
	url: string[];

	/**
	 * 是否需要vercel的build命令？
	 * @description
	 * 某些情况下用户已经能够准备好vercel的目录结构，不需要依赖于 `vercel build` 命令完成目录构建
	 *
	 * 故设计此配置允许用户直接跳过 `vercel build` 命令
	 * @default true
	 */
	isNeedVercelBuild?: boolean;
}

/**
 * 带有用户命令的配置
 */
export interface DeployTargetWithUserCommands extends DeployTargetBase {
	type: Verify<DeployTargetType, "userCommands">;

	/**
	 * 用户命令
	 * @description
	 * 实际部署的构建命令，通常是真实参与部署的命令
	 *
	 * @example ["pnpm -C=./packages/docs-01-star build:docs"]
	 * @example ["pnpm -C=./packages/monorepo-5 build:docs"]
	 */
	userCommands: string[];

	/**
	 * 部署输出路径
	 *
	 * @version 2
	 * @description
	 * 填写打包目录的路径即可。不包含glob语法。
	 * @example "docs/.vitepress/dist"
	 * @example "src/.vuepress/dist"
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
export type DeployTarget = DeployTargetBase | DeployTargetWithUserCommands;

/** Vercel部署工具的配置 */
export interface VercelDeployConfig {
	/** 项目名称 */
	vercelProjectName: string;

	/** 用户token */
	vercelToken: string;

	/** 用户组织id */
	vercelOrgId: string;

	/** 用户项目id */
	vercelProjectId: string;

	/**
	 * 用户提供的 vercel.json 配置文件
	 * @description
	 * 有时候用户需要提供自己的一套配置文件
	 *
	 * 这里提供配置路径
	 */
	vercelJsonPath?: string;

	/** 在build命令阶段后执行的用户命令 */
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
