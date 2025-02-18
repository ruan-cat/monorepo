/**
 * 一些node环境下的工具函数
 */

import { normalize } from "node:path";
import { spawnSync } from "node:child_process";

import { generateSimpleAsyncTask } from "@ruan-cat/utils";
import gradient from "gradient-string";
import consola from "consola";
// import { normalizePath } from "vite";

/**
 * 路径转换工具
 */
export function pathChange(path: string) {
	return path.replace(/\\/g, "/");
	// FIXME: 无法有效地实现解析路径 测试用例不通过
	// return normalize(path);
	// FIXME: tsup打包时，无法处理好vite的依赖 会导致打包失败 不知道怎么单独使用并打包该函数
	// return normalizePath(path);
}

export interface SpawnSyncSimpleParams {
	command: string;
	parameters: string[];
	/**
	 * 是否流式输出内容
	 * @description 默认输出的命令数据全部以流式的方式输出
	 * @default true
	 */
	isFlow?: boolean;

	/**
	 * 是否显示命令？
	 * @description
	 * 是否打印目前正在执行的命令？
	 * @default true
	 */
	isShowCommand?: boolean;
}

/**
 * 生成简单的执行命令函数
 * @description
 * 对 spawnSync 做简单的包装
 *
 * 之前封装的是 execa 函数
 * @version 2
 */
export function generateSpawnSync(spawnSyncSimpleParams: SpawnSyncSimpleParams) {
	const { command, parameters, isFlow = true, isShowCommand = true } = spawnSyncSimpleParams;

	if (isShowCommand) {
		const coloredCommand = gradient(["rgb(0, 153, 247)", "rgb(241, 23, 18)"])(`${command} ${parameters.join(" ")}`);
		consola.info(` 当前运行的命令为： ${coloredCommand} \n`);
	}

	return generateSimpleAsyncTask(() => {
		const result = spawnSync(command, parameters, {
			/**
			 * 是否流式输出？
			 * 是流式输出就是继承父进程的流式输出
			 * 否则就使用默认值
			 * @see https://nodejs.org/api/child_process.html#optionsstdio
			 */
			stdio: isFlow ? "inherit" : "pipe",
			shell: true,
		});

		// 如果不是流式输出 就直接返回返回值即可
		if (!isFlow) {
			return result;
		}

		if (result.error) {
			throw result.error;
		}

		return result;
	});
}
