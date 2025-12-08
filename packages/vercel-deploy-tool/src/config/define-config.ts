import type { VercelDeployConfig } from "./schema";

/**
 * 定义配置的辅助函数
 * @description
 * 提供类型提示和智能补全
 *
 * @example
 * ```ts
 * import { defineConfig } from "@ruan-cat/vercel-deploy-tool";
 *
 * export default defineConfig({
 *   vercelProjectName: "my-project",
 *   // ...
 * });
 * ```
 */
export function defineConfig(config: VercelDeployConfig): VercelDeployConfig {
	return config;
}
