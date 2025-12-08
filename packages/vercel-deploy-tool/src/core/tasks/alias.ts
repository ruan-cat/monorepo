import { spawnSync } from "node:child_process";
import { concat } from "lodash-es";
import { consola } from "consola";
import type { VercelDeployConfig } from "../../config/schema";
import { createVercelSpawnOptions, getVercelTokenArg, getVercelScopeArg } from "../vercel";

/**
 * 创建 Alias 任务
 * @description
 * 旨在于封装类似于这样的命令：
 *
 * vc alias set deployment-url.vercel.app custom-domain.com -t TOKEN --scope ORG_ID
 *
 * @see https://vercel.community/t/deployment-via-gitlab-ci-to-dev-domain/523/3
 */
export function createAliasTask(config: VercelDeployConfig, vercelUrl: string, userUrl: string) {
	return {
		name: `Alias: ${userUrl}`,
		fn: async () => {
			const args = concat(["alias", "set", vercelUrl, userUrl], getVercelTokenArg(config), getVercelScopeArg(config));

			consola.start(`开始别名任务: ${userUrl}`);

			const result = spawnSync("vercel", args, createVercelSpawnOptions());

			if (result.error) {
				consola.error(`别名任务失败: ${userUrl}`);
				throw result.error;
			}

			consola.success(`完成别名任务，可用的别名地址为:`);
			consola.box(`https://${userUrl}`);

			return result.stdout;
		},
	};
}
