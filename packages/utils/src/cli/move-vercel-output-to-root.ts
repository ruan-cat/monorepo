/**
 * move-vercel-output-to-root 快捷命令入口
 *
 * @description
 * 本文件是 `move-vercel-output-to-root` bin 命令的直接入口。
 * 安装 @ruan-cat/utils 后，可以直接通过 `npx move-vercel-output-to-root` 调用。
 */

import consola from "consola";
import { runMoveVercelOutputToRootCli } from "../node-esm/scripts/move-vercel-output-to-root/index";

try {
	runMoveVercelOutputToRootCli();
} catch (error) {
	consola.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
