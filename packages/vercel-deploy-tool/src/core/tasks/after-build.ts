import { spawnSync } from "node:child_process";
import { consola } from "consola";
import { isUndefined, isEmpty } from "lodash-es";
import type { VercelDeployConfig } from "../../config/schema";

/**
 * 创建 AfterBuild 任务列表
 * @description
 * 在 build 命令阶段后执行的用户命令
 */
export function createAfterBuildTasks(config: VercelDeployConfig) {
	const afterBuildTasks = config.afterBuildTasks;

	if (isUndefined(afterBuildTasks) || isEmpty(afterBuildTasks)) {
		return [
			{
				name: "AfterBuild: 无任务",
				fn: async (): Promise<string | undefined> => {
					consola.warn("当前没有有意义的 afterBuildTasks 任务配置");
					return undefined;
				},
			},
		];
	}

	return afterBuildTasks.map((command) => ({
		name: `AfterBuild: ${command}`,
		fn: async (): Promise<string | undefined> => {
			consola.start(`开始 afterBuild 任务: ${command}`);

			const result = spawnSync(command, [], {
				encoding: "utf-8",
				stdio: "inherit",
				shell: true,
			});

			if (result.error) {
				consola.error(`afterBuild 任务失败: ${command}`);
				throw result.error;
			}

			consola.success(`完成 afterBuild 任务: ${command}`);
			return result.stdout;
		},
	}));
}
