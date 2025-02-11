/**
 * 一些node环境下的工具函数
 */

import { normalize } from "node:path";
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
