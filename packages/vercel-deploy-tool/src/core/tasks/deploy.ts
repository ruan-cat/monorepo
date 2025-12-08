import { spawnSync } from "node:child_process";
import { concat } from "lodash-es";
import { consola } from "consola";
import type { VercelDeployConfig, DeployTarget } from "../../config/schema";
import { getVercelTokenArg, getTargetCWDArg } from "../vercel";

/**
 * 创建 Deploy 任务
 * @description
 * 旨在于封装类似于这样的命令：
 *
 * vc deploy --yes --prebuilt --prod --cwd=./packages/docs -t TOKEN
 */
export function createDeployTask(config: VercelDeployConfig, target: DeployTarget) {
	return {
		name: `Deploy: ${target.targetCWD}`,
		fn: async () => {
			const args = concat(
				["deploy"],
				["--yes"],
				["--prebuilt"],
				["--prod"],
				getTargetCWDArg(target),
				getVercelTokenArg(config),
			);

			consola.start(`开始部署任务: ${target.targetCWD}`);

			const result = spawnSync("vercel", args, {
				encoding: "utf-8",
			});

			if (result.error) {
				consola.error(`部署失败了: ${target.targetCWD}`);
				consola.error(result.error);
				throw result.error;
			}

			const vercelUrl = result.stdout.toString().trim();
			consola.success(`完成部署任务，生成的url为:`);
			consola.box(vercelUrl);

			return vercelUrl;
		},
	};
}
