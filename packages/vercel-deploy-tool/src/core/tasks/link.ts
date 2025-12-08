import { spawnSync } from "node:child_process";
import { concat } from "lodash-es";
import { consola } from "consola";
import type { VercelDeployConfig, DeployTarget } from "../../config/schema";
import { getVercelProjectNameArg, getVercelTokenArg, getTargetCWDArg } from "../vercel";

/**
 * 创建 Link 任务
 * @description
 * 旨在于封装类似于这样的命令：
 *
 * vc link --yes --cwd=./packages/docs --project=my-project -t TOKEN
 */
export function createLinkTask(config: VercelDeployConfig, target: DeployTarget) {
	return {
		name: `Link: ${target.targetCWD}`,
		fn: async () => {
			const args = concat(
				["link"],
				["--yes"],
				getTargetCWDArg(target),
				getVercelProjectNameArg(config),
				getVercelTokenArg(config),
			);

			consola.start(`开始 link 任务: ${target.targetCWD}`);

			const result = spawnSync("vercel", args, {
				encoding: "utf-8",
				stdio: "inherit",
			});

			if (result.error) {
				consola.error(`link 任务失败: ${target.targetCWD}`);
				throw result.error;
			}

			consola.success(`完成 link 任务: ${target.targetCWD}`);
			return result.stdout;
		},
	};
}
