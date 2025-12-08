import { loadConfig as c12LoadConfig } from "c12";
import { consola } from "consola";
import { isUndefined } from "lodash-es";
import { config as dotenvxConfig } from "@dotenvx/dotenvx";
import { printFormat } from "@ruan-cat/utils";
import type { VercelDeployConfig } from "./schema";

/** 配置文件的文件名称 */
export const CONFIG_NAME = "vercel-deploy-tool";

/** 默认配置 */
const DEFAULT_CONFIG: VercelDeployConfig = {
	vercelProjectName: "",
	vercelToken: "",
	vercelOrgId: "",
	vercelProjectId: "",
	deployTargets: [],
};

/**
 * 异步加载配置（工厂函数模式）
 * @description
 * 从约定俗成的配置处，获得用户配置文件。不会在模块导入时自动执行，避免 top-level await 引起的执行时警告。
 *
 * 环境变量优先级：
 * 1) 命令行传入的 env-path（通过 VERCEL_DEPLOY_TOOL_ENV_PATH 或 deploy 命令参数注入）
 * 2) Node 进程已有的 process.env
 * 3) c12 默认加载的 .env* 文件
 *
 * @example
 * ```ts
 * const config = await loadConfig();
 * ```
 */
export async function loadConfig(): Promise<VercelDeployConfig> {
	consola.start("开始读取配置文件 vercel-deploy-tool.config.* ...");

	// 兼容 CLI 的 --env-path，允许指定自定义 dotenv 文件
	const envPath = process.env.VERCEL_DEPLOY_TOOL_ENV_PATH;
	if (envPath) {
		dotenvxConfig({ path: envPath });
		consola.info(`已从 VERCEL_DEPLOY_TOOL_ENV_PATH 加载 dotenv: ${envPath}`);
	}

	let config: VercelDeployConfig | undefined;

	const loaded = await c12LoadConfig<VercelDeployConfig>({
		cwd: process.cwd(),
		name: CONFIG_NAME,
		dotenv: true,
		defaults: DEFAULT_CONFIG,
	});

	config = loaded.config;

	// 环境变量覆盖
	const vercelOrgId = process.env.VERCEL_ORG_ID;
	const vercelProjectId = process.env.VERCEL_PROJECT_ID;
	const vercelToken = process.env.VERCEL_TOKEN;

	if (!isUndefined(vercelOrgId)) {
		config.vercelOrgId = vercelOrgId;
	}
	if (!isUndefined(vercelProjectId)) {
		config.vercelProjectId = vercelProjectId;
	}
	if (!isUndefined(vercelToken)) {
		config.vercelToken = vercelToken;
	}

	consola.success("配置加载完成");
	consola.box(printFormat(config));

	return config;
}

let cachedConfigPromise: Promise<VercelDeployConfig> | null = null;

/**
 * 导出配置获取函数（带缓存）
 * @description
 * 首次调用会触发加载，后续复用结果。避免 top-level await。
 *
 * @example
 * ```ts
 * import { getConfig } from "@ruan-cat/vercel-deploy-tool";
 * const config = await getConfig();
 * ```
 */
export async function getConfig(): Promise<VercelDeployConfig> {
	if (!cachedConfigPromise) {
		cachedConfigPromise = loadConfig();
	}
	return cachedConfigPromise;
}
