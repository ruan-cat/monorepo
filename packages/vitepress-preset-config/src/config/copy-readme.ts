import fs from "node:fs";
import path from "node:path";
import consola from "consola";

// 有疑惑 这个写法都不对么？ 这个写法对于 vitepress 文档构建来说 是会引发报错的
// import { isConditionsSome } from "@ruan-cat/utils/src/conditions.ts";
import { isConditionsSome } from "@ruan-cat/utils";

/** 大写字母的文件 */
const capitalReadmeMd = "README.md" as const;

/** 小写字母的文件 */
const lowerCaseReadmeMd = "readme.md" as const;

/** 检查当前运行的根目录 是否存在文件名大写的 `README.md` 文件 */
function hasCapitalReadmeMd() {
	const res = fs.existsSync(path.resolve(process.cwd(), capitalReadmeMd));
	if (!res) {
		consola.warn(`当前项目根目录不存在 ${capitalReadmeMd} 文件`);
	}
	return res;
}

/** 检查当前运行的根目录 是否存在文件名小写的 `readme.md` 文件 */
function hasLowerCaseReadmeMd() {
	const res = fs.existsSync(path.resolve(process.cwd(), lowerCaseReadmeMd));
	if (!res) {
		consola.log(`当前项目根目录不存在 ${lowerCaseReadmeMd} 文件`);
	}
	return res;
}

/** 检查当前运行的根目录 是否存在任意一个大小写命名的 README.md 文件 */
function hasReadmeMd() {
	const res = isConditionsSome([() => hasCapitalReadmeMd(), () => hasCapitalReadmeMd()]);
	return res;
}

/**
 * 将 README.md 文件移动到指定要求的位置内，并重命名为 index.md
 * @description
 * 该函数相当于实现 `cpx README.md docs` 命令
 */
export function copyReadmeMd(/** 目标文件夹 */ target: string) {
	if (!hasReadmeMd()) {
		return;
	}

	let readmeFileName: string = capitalReadmeMd;
	if (hasCapitalReadmeMd()) {
		readmeFileName = capitalReadmeMd;
	} else if (hasLowerCaseReadmeMd()) {
		readmeFileName = lowerCaseReadmeMd;
	}

	const source = path.resolve(process.cwd(), readmeFileName);
	const destination = path.resolve(process.cwd(), target, "index.md");

	fs.copyFileSync(source, destination);
}
