import path from "node:path";
import fs from "node:fs";
import consola from "consola";
import matter from "gray-matter";

import { copyChangelogMd, hasChangelogMd } from "../utils/copy-changelog";
import { pageOrderConfig } from "./page-order-config";

export interface AddChangelog2docOptions<T extends Record<string, any> = Record<string, any>> {
	/** 目标文件夹 */
	target: string;

	/** 被插入到md头部的数据 */
	data?: T;
}

/** 将变更日志添加到指定的文档目录内 并提供参数 */
export function addChangelog2doc<T extends Record<string, any>>(options: AddChangelog2docOptions<T>) {
	const { data = pageOrderConfig.changelog, target } = options;

	if (!hasChangelogMd()) {
		return;
	}

	copyChangelogMd(target);

	const mdPath = path.resolve(process.cwd(), target, "CHANGELOG.md");

	try {
		if (fs.existsSync(mdPath)) {
			// 读取 markdown 文件
			const fileContent = fs.readFileSync(mdPath, "utf-8");

			// 使用 gray-matter 解析文件
			const parsed = matter(fileContent);

			// 使用 gray-matter 的 stringify 方法生成新的文件内容
			// 直接使用提供的 data，覆盖原有的 frontmatter
			const newContent = matter.stringify(parsed.content, data);

			// 写入文件
			fs.writeFileSync(mdPath, newContent, "utf-8");
			consola.success(`已将YAML数据写入到 ${mdPath}`);
		} else {
			consola.warn(`文件 ${mdPath} 不存在，无法写入 YAML frontmatter`);
		}
	} catch (error) {
		consola.error(`写入 YAML 数据到 ${mdPath} 时发生错误:`, error);
		throw error;
	}
}
