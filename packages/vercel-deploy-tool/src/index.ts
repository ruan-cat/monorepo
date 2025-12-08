/**
 * @ruan-cat/vercel-deploy-tool
 * @description
 * Vercel 部署工具 - 支持 monorepo 的自动化部署
 *
 * @author ruan-cat
 * @license MIT
 */

// ==================== 配置系统 ====================

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
 *   vercelToken: process.env.VERCEL_TOKEN || "",
 *   // ...
 * });
 * ```
 */
export { defineConfig } from "./config/define-config";

/**
 * 加载配置
 * @description
 * 异步加载用户配置文件
 *
 * @example
 * ```ts
 * import { loadConfig } from "@ruan-cat/vercel-deploy-tool";
 *
 * const config = await loadConfig();
 * ```
 */
export { loadConfig, getConfig, config } from "./config/loader";

// ==================== 类型定义 ====================

/**
 * 导出所有类型定义
 */
export type {
	VercelDeployConfig,
	DeployTarget,
	DeployTargetBase,
	DeployTargetWithUserCommands,
	DeployTargetType,
} from "./types";

// ==================== 核心功能 ====================

/**
 * 执行部署工作流
 * @description
 * 编程式调用部署流程
 *
 * @example
 * ```ts
 * import { executeDeploymentWorkflow, loadConfig } from "@ruan-cat/vercel-deploy-tool";
 *
 * const config = await loadConfig();
 * await executeDeploymentWorkflow(config);
 * ```
 */
export { executeDeploymentWorkflow } from "./core/tasks";

// ==================== 工具函数 ====================

/**
 * Vercel 空配置
 */
export { VERCEL_NULL_CONFIG, VERCEL_NULL_CONFIG_PATH, VERCEL_OUTPUT_STATIC } from "./utils/vercel-null-config";

/**
 * 类型守卫
 */
export {
	isDeployTargetBase,
	isDeployTargetWithUserCommands,
	getIsCopyDist,
	isNeedVercelBuild,
} from "./utils/type-guards";

// ==================== CLI 命令工厂 ====================

/**
 * 命令工厂函数（供编程式调用）
 * @description
 * 可以在代码中创建和使用命令
 *
 * @example
 * ```ts
 * import { createDeployCommand } from "@ruan-cat/vercel-deploy-tool";
 *
 * const deployCmd = createDeployCommand();
 * // 使用 commander 的 API
 * ```
 */
export { createDeployCommand } from "./commands/deploy";
export { createInitCommand } from "./commands/init";
