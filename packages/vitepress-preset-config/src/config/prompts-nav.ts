import { type UserConfig, type DefaultTheme } from "vitepress";
import fs from "node:fs";
import path from "node:path";
import consola from "consola";
import { isUndefined, merge } from "lodash-es";
import matter from "gray-matter";

import { pageOrderConfig } from "./page-order-config";
import { getVitepressSourceDirectory, hasPromptsIndexMd, PROMPTS_INDEX_MD_PATH } from "../utils/vitepress-project.ts";

/**
 * 将YAML数据写入到提示词索引文件内
 * @description
 * - 读取 markdown 文件
 * - 检查是否已经包含了预先准备好的 yaml 信息
 * - 如果有 yaml 信息，就用提供的数据做数据拓展（使用 lodash merge）
 * - 如果没有 yaml 信息，就写入顶部 yaml 信息
 *
 * @param userConfig - VitePress 用户配置对象
 * @param data - 要写入或合并的 YAML 数据
 * @private 目前仅设计为内部使用
 */
function writeYaml2PromptsIndexMd(userConfig: UserConfig<DefaultTheme.Config>, data?: Record<string, any>) {
	// 获取要写入的数据
	const newData = data ?? pageOrderConfig.prompts;

	// 获取文件路径
	const sourceDir = getVitepressSourceDirectory(userConfig);
	const mdPath = path.resolve(sourceDir, PROMPTS_INDEX_MD_PATH);

	try {
		// 读取 markdown 文件
		let fileContent = "";
		let existingData: Record<string, any> = {};

		if (fs.existsSync(mdPath)) {
			fileContent = fs.readFileSync(mdPath, "utf-8");

			// 使用 gray-matter 解析文件
			const parsed = matter(fileContent);

			// 如果有 frontmatter，获取已有数据
			if (parsed.data && Object.keys(parsed.data).length > 0) {
				existingData = parsed.data;
				consola.log("检测到已有 YAML frontmatter，将进行数据合并");
			} else {
				consola.log("文件存在但没有 YAML frontmatter，将写入新的 frontmatter");
			}

			// 使用 lodash merge 合并数据
			// merge 会深度合并对象，新数据会覆盖旧数据
			const mergedData = merge({}, existingData, newData);

			// 使用 gray-matter 的 stringify 方法生成新的文件内容
			const newContent = matter.stringify(parsed.content, mergedData);

			// 写入文件
			fs.writeFileSync(mdPath, newContent, "utf-8");
			consola.success(`已将YAML数据写入到 ${mdPath}`);
		} else {
			// 文件不存在，创建新文件
			consola.warn(`文件 ${mdPath} 不存在，将创建新文件`);

			// 确保目录存在
			const dir = path.dirname(mdPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			// 创建带有 frontmatter 的空文件
			const newContent = matter.stringify("", newData);
			fs.writeFileSync(mdPath, newContent, "utf-8");
			consola.success(`已创建文件并写入YAML数据到 ${mdPath}`);
		}
	} catch (error) {
		consola.error(`写入 YAML 数据到 ${mdPath} 时发生错误:`, error);
		throw error;
	}
}

/**
 * 处理提示词文件
 * @description
 * - 检查当前文档的运行目录内 是否包含有约定格式的提示词文档。
 * - 如果存在 就给目标文件增加一个顶部yaml信息，做排序使用。
 * - 并且文档的顶部导航栏内，增加一个固定的提示词入口。
 */
export function handlePrompts(userConfig: UserConfig<DefaultTheme.Config>) {
	if (!hasPromptsIndexMd(userConfig)) {
		consola.warn(` 未找到提示词索引文件，不添加提示词导航栏。 `);
		return;
	}

	// 给提示词索引文件 写入排序值
	writeYaml2PromptsIndexMd(userConfig);

	const nav = userConfig?.themeConfig?.nav;

	if (isUndefined(nav)) {
		consola.error(` 当前的用户配置为： `, userConfig);
		throw new Error(` nav 默认提供的导航栏配置为空。不符合默认配置，请检查。 `);
	}

	nav.push({ text: "提示词", link: `/${PROMPTS_INDEX_MD_PATH}` });
}
