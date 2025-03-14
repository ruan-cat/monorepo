import path from "node:path";

import { copyChangelogMd, hasChangelogMd } from "./copy-changelog.ts";
import { writeYaml2md } from "./yaml-to-md.ts";

export interface AddChangelog2docOptions<T = Record<string, any>> {
	/** 目标文件夹 */
	target: string;

	/** 被插入到md头部的数据 */
	data: T;
}

/** 将变更日志添加到指定的文档目录内 并提供参数 */
export function addChangelog2doc<T>(options: AddChangelog2docOptions<T>) {
	const { data, target } = options;

	if (!hasChangelogMd()) {
		return;
	}

	copyChangelogMd(target);

	const mdPath = path.resolve(process.cwd(), target, "CHANGELOG.md");
	writeYaml2md({
		mdPath,
		data,
	});
}
