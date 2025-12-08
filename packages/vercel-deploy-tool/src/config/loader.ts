import { loadConfig as c12LoadConfig } from "c12";
import { resolve } from "pathe";
import { consola } from "consola";
import { isUndefined } from "lodash-es";
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
 * 从约定俗成的配置处，获得用户配置文件
 *
 * @example
 * ```ts
 * const config = await loadConfig();
 * ```
 */
export async function loadConfig(): Promise<VercelDeployConfig> {
	const { config } = await c12LoadConfig<VercelDeployConfig>({
		cwd: resolve("."),
		name: CONFIG_NAME,
		dotenv: true,
		defaults: DEFAULT_CONFIG,
	});

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

/**
 * 默认导出：已初始化的配置实例（top-level await）
 * @description
 * 这是混合模式的一部分，提供默认的配置实例
 *
 * @example
 * ```ts
 * import { config } from "@ruan-cat/vercel-deploy-tool/config/loader";
 * console.log(config.vercelProjectName);
 * ```
 */
export const config = await loadConfig();

/**
 * 导出配置获取函数
 * @description
 * 获取已加载的配置实例
 *
 * @example
 * ```ts
 * import { getConfig } from "@ruan-cat/vercel-deploy-tool";
 * const config = getConfig();
 * ```
 */
export function getConfig(): VercelDeployConfig {
	return config;
}
