import fs from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { concat } from "lodash-es";
import { consola } from "consola";
import type { VercelDeployConfig, DeployTarget } from "../../config/schema";
import { createVercelSpawnOptions, getVercelTokenArg, getVercelLocalConfigArg, getTargetCWDArg } from "../vercel";

/**
 * 创建 Build 任务
 * @description
 * 旨在于封装类似于这样的命令：
 *
 * vc build --yes --prod --cwd=./packages/docs -A ./vercel.null.json -t TOKEN
 */
export function createBuildTask(config: VercelDeployConfig, target: DeployTarget) {
	return {
		name: `Build: ${target.targetCWD}`,
		fn: async () => {
			const targetPath = resolve(target.targetCWD);

			if (!fs.existsSync(targetPath)) {
				const err = new Error(`目标目录不存在，请先构建: ${target.targetCWD}`);
				consola.error(err.message);
				throw err;
			}

			const args = concat(
				["build"],
				["--yes"],
				["--prod"],
				getTargetCWDArg(target),
				getVercelLocalConfigArg(),
				getVercelTokenArg(config),
			);

			consola.start(`开始 build 任务: ${target.targetCWD}`);

			const result = spawnSync("vercel", args, createVercelSpawnOptions());

			if (result.error) {
				consola.error(`build 任务失败: ${target.targetCWD}`);
				throw result.error;
			}

			consola.success(`完成 build 任务: ${target.targetCWD}`);
			return result.stdout;
		},
	};
}
