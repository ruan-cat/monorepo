import { Command } from "commander";
import { consola } from "consola";
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

	command.description("部署项目到 Vercel").action(async () => {
		try {
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
