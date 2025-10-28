import fs from "node:fs";
import path from "node:path";
import consola from "consola";

/** 检查当前运行的根目录 是否存在 CHANGELOG.md 文件 */
export function hasChangelogMd() {
	const res = fs.existsSync(path.resolve(process.cwd(), "CHANGELOG.md"));
	if (!res) {
		consola.log("当前项目根目录为：", process.cwd());
		consola.warn("当前项目根目录不存在 CHANGELOG.md 文件");
	}
	return res;
}

/**
 * 将 CHANGELOG.md 文件移动到指定要求的位置内
 * @description
 * 该函数相当于实现 `cpx CHANGELOG.md docs` 命令
 */
export function copyChangelogMd(/** 目标文件夹 */ target: string) {
	if (!hasChangelogMd()) {
		return;
	}

	const source = path.resolve(process.cwd(), "CHANGELOG.md");
	const destination = path.resolve(process.cwd(), target, "CHANGELOG.md");

	fs.copyFileSync(source, destination);
}
