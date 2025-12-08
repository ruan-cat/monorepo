import fs from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { concat } from "lodash-es";
import { consola } from "consola";
import type { VercelDeployConfig, DeployTarget } from "../../config/schema";
import { createVercelSpawnOptions, getVercelTokenArg, getTargetCWDArg } from "../vercel";

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
			const targetPath = resolve(target.targetCWD);

			if (!fs.existsSync(targetPath)) {
				const err = new Error(`目标目录不存在，请先构建: ${target.targetCWD}`);
				consola.error(err.message);
				throw err;
			}

			const args = concat(
				["deploy"],
				["--yes"],
				["--prebuilt"],
				["--prod"],
				getTargetCWDArg(target),
				getVercelTokenArg(config),
			);

			consola.start(`开始部署任务: ${target.targetCWD}`);

			const result = spawnSync("vercel", args, createVercelSpawnOptions("pipe"));

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
