/**
 * @ruan-cat/utils CLI 入口
 *
 * @description
 * 本文件是 @ruan-cat/utils 包的统一 CLI 入口。
 * 通过 package.json 的 bin 字段暴露为 `ruan-cat-utils` 命令。
 *
 * 用法：
 *   npx ruan-cat-utils <command> [options]
 *
 * 支持的子命令：
 *   move-vercel-output-to-root  将子包的 .vercel/output 搬运到 monorepo 根目录
 */

import consola from "consola";
import {
	getMoveVercelOutputToRootHelpText,
	runMoveVercelOutputToRootCli,
} from "../node-esm/scripts/move-vercel-output-to-root/index";

const CLI_NAME = "ruan-cat-utils";

function printMainHelp() {
	const helpText = [
		`${CLI_NAME} - @ruan-cat/utils 命令行工具`,
		"",
		"用法：",
		`  ${CLI_NAME} <command> [options]`,
		"",
		"可用命令：",
		"  move-vercel-output-to-root  将子包的 .vercel/output 搬运到 monorepo 根目录",
		"",
		"全局选项：",
		"  -h, --help                  查看帮助信息",
		"  -v, --version               查看版本号",
		"",
		"示例：",
		`  ${CLI_NAME} move-vercel-output-to-root`,
		`  ${CLI_NAME} move-vercel-output-to-root --dry-run`,
		`  ${CLI_NAME} move-vercel-output-to-root --root-dir ../../..`,
	].join("\n");

	console.log(helpText);
}

function printVersion() {
	// 动态读取版本号会引入额外复杂度，这里直接输出包名提示用户查看
	console.log(`${CLI_NAME} (from @ruan-cat/utils)`);
	console.log("运行 'npm list @ruan-cat/utils' 查看当前安装的版本。");
}

function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	if (!command || command === "--help" || command === "-h") {
		printMainHelp();
		return;
	}

	if (command === "--version" || command === "-v") {
		printVersion();
		return;
	}

	switch (command) {
		case "move-vercel-output-to-root": {
			const subArgs = args.slice(1);
			try {
				runMoveVercelOutputToRootCli(subArgs);
			} catch (error) {
				consola.error(error instanceof Error ? error.message : String(error));
				process.exitCode = 1;
			}
			break;
		}

		default: {
			consola.error(`未知命令：${command}`);
			console.log("");
			printMainHelp();
			process.exitCode = 1;
		}
	}
}

main();
