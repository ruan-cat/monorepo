/**
 * 一些node环境下的工具函数
 */

import { normalize } from "node:path";
import { normalizePath } from "vite";

/**
 * 路径转换工具
 */
export function pathChange(path: string) {
	// return path.replace(/\\/g, "/");
	// return normalize(path);
	return normalizePath(path);
}
