import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** 路径拼接工具 */
export function pathResolve(dir: string) {
	const resPath = resolve(__dirname, ".", dir);
	// console.log(" in tool pathResolve => ", resPath);
	return resPath;
}

/** 路径拼接工具 */
export function joinPath(dir: string) {
	const resPath = resolve(__dirname, ".", dir);
	// console.log(" in tool pathResolve => ", resPath);
	return resPath;
}
