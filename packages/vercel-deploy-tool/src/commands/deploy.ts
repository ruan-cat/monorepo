import { Command } from "commander";
import { consola } from "consola";
import { config as dotenvxConfig } from "@dotenvx/dotenvx";
import { loadConfig } from "../config/loader";
import { executeDeploymentWorkflow } from "../core/tasks";

/**
 * 创建 deploy 命令
 * @description
 * 部署项目到 Vercel
 *
 * @example
 * ```bash
 * vercel-deploy-tool deploy
 * vdt deploy
 * ```
 */
export function createDeployCommand(): Command {
	const command = new Command("deploy");

	command
		.description("部署项目到 Vercel")
		.option("--env-path <path>", "指定 dotenv 文件路径，用于覆盖默认环境变量")
		.action(async (options) => {
			try {
				// 允许部署时显式指定 env 文件
				if (options?.envPath) {
					process.env.VERCEL_DEPLOY_TOOL_ENV_PATH = options.envPath;
					dotenvxConfig({ path: options.envPath });
					consola.info(`已从 --env-path 加载环境变量: ${options.envPath}`);
				}

				consola.start("开始加载配置...");

				const config = await loadConfig();

				consola.start("开始执行部署工作流...");

				await executeDeploymentWorkflow(config);

				consola.success("部署完成！");
			} catch (error) {
				consola.error("部署失败:");
				consola.error(error);
				process.exit(1);
			}
		});

	return command;
}
