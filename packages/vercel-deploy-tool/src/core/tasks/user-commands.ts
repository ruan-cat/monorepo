import { spawnSync } from "node:child_process";
import { consola } from "consola";
import type { DeployTargetWithUserCommands } from "../../config/schema";

/**
 * 创建用户命令任务列表
 * @description
 * 执行用户自定义的命令列表
 */
export function createUserCommandTasks(target: DeployTargetWithUserCommands) {
	return target.userCommands.map((command) => ({
		name: `UserCommand: ${command}`,
		fn: async () => {
			consola.start(`开始用户命令任务: ${command}`);

			const result = spawnSync(command, [], {
				encoding: "utf-8",
				stdio: "inherit",
				shell: true,
			});

			if (result.error) {
				consola.error(`用户命令任务失败: ${command}`);
				throw result.error;
			}

			consola.success(`完成用户命令任务: ${command}`);
			return result.stdout;
		},
	}));
}
