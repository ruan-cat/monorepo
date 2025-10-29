import { type UserConfig, type DefaultTheme } from "vitepress";
import fs from "node:fs";
import path from "node:path";
import consola from "consola";
import { isUndefined, merge } from "lodash-es";
import matter from "gray-matter";

import { pageOrderConfig } from "./page-order-config";

/** 提示词索引文件的相对路径 */
const PROMPTS_INDEX_MD_PATH = "prompts/index.md" as const;

/**
 * 从命令行参数中获取 VitePress 项目根目录
 * @description
 * 解析命令行参数，查找 vitepress dev/build 命令后的第一个路径参数
 * @private 目前仅设计为内部使用
 */
function getProjectRootFromArgs(): string | null {
	const args = process.argv;

	// 查找 vitepress 命令的索引
	const vitepressIndex = args.findIndex((arg) => arg.includes("vitepress"));

	if (vitepressIndex === -1) {
		return null;
	}

	// 查找 dev 或 build 命令后的第一个非选项参数（不以 - 或 -- 开头）
	for (let i = vitepressIndex + 1; i < args.length; i++) {
		const arg = args[i];

		// 跳过命令本身（dev, build等）和选项参数
		if (arg === "dev" || arg === "build" || arg === "serve" || arg === "preview") {
			continue;
		}

		// 跳过选项和选项值
		if (arg.startsWith("-")) {
			// 如果是 --port 这样的选项，也跳过下一个值
			if (arg.startsWith("--") && !arg.includes("=")) {
				i++; // 跳过选项值
			}
			continue;
		}

		// 找到路径参数，解析为绝对路径
		return path.resolve(process.cwd(), arg);
	}

	return null;
}

/**
 * 获得 vitepress 项目的 `项目根目录 (project root)`
 * @description
 * 检查出当前运行vitepress build 命令时，所使用的项目根目录，并对外返回该目录。
 * @see https://vitepress.dev/zh/guide/routing#root-and-source-directory
 * @private 目前仅设计为内部使用
 */
function getVitepressProjectRoot(): string {
	// 首先尝试从命令行参数获取
	const projectRootFromArgs = getProjectRootFromArgs();
	if (projectRootFromArgs) {
		const vitepressDir = path.join(projectRootFromArgs, ".vitepress");
		if (fs.existsSync(vitepressDir)) {
			consola.log("从命令行参数获取到 VitePress 项目根目录：", projectRootFromArgs);
			return projectRootFromArgs;
		}
	}

	// 如果命令行参数没有提供或无效，尝试向上查找 .vitepress 目录
	let currentDir = process.cwd();
	const root = path.parse(currentDir).root;

	while (currentDir !== root) {
		const vitepressDir = path.join(currentDir, ".vitepress");
		if (fs.existsSync(vitepressDir)) {
			consola.log("通过向上查找获取到 VitePress 项目根目录：", currentDir);
			return currentDir;
		}
		currentDir = path.dirname(currentDir);
	}

	// 检查根目录本身
	const vitepressDir = path.join(root, ".vitepress");
	if (fs.existsSync(vitepressDir)) {
		consola.log("在文件系统根目录找到 VitePress 项目根目录：", root);
		return root;
	}

	// 如果找不到 .vitepress 目录，回退到当前工作目录
	const fallbackDir = process.cwd();
	consola.warn("未找到 .vitepress 目录，回退到当前工作目录：", fallbackDir);
	return fallbackDir;
}

/**
 * 获取vitepress项目的源目录
 * @description
 * 获取vitepress项目的源目录 并对外返回该目录。
 *
 * 源目录的计算规则：
 * 1. 如果配置中指定了 srcDir，则源目录 = 项目根目录 + srcDir
 * 2. 如果没有指定 srcDir，则源目录 = 项目根目录
 *
 * @param userConfig - VitePress 用户配置对象
 * @see https://vitepress.dev/zh/guide/routing#source-directory
 * @private 目前仅设计为内部使用
 */
function getVitepressSourceDirectory(userConfig: UserConfig<DefaultTheme.Config>): string {
	// 获取项目根目录
	const projectRoot = getVitepressProjectRoot();

	// 读取配置中的 srcDir（如果有）
	const srcDir = (userConfig as any).srcDir as string | undefined;

	// 如果配置了 srcDir，将其与项目根目录拼接；否则返回项目根目录
	if (srcDir) {
		const sourceDirectory = path.resolve(projectRoot, srcDir);
		consola.log("从配置中获取到 srcDir:", srcDir);
		consola.log("VitePress 源目录为：", sourceDirectory);
		return sourceDirectory;
	}

	// 默认情况下，源目录等于项目根目录
	consola.log("配置中未指定 srcDir，源目录等于项目根目录：", projectRoot);
	return projectRoot;
}

/**
 * 检查当前运行的 `源目录` 是否存在 `prompts/index.md` 文件
 * @description
 * 检查当前运行的 `源目录` 是否存在 `prompts/index.md` 文件，并对外返回检查结果。
 * @private 目前仅设计为内部使用·
 */
function hasPromptsIndexMd(userConfig: UserConfig<DefaultTheme.Config>) {
	const sourceDir = getVitepressSourceDirectory(userConfig);
	const res = fs.existsSync(path.resolve(sourceDir, PROMPTS_INDEX_MD_PATH));
	if (!res) {
		consola.log("当前项目的vitepress源目录为：", sourceDir);
		consola.warn(`当前项目的vitepress源目录不存在 ${PROMPTS_INDEX_MD_PATH} 文件`);
	}
	return res;
}

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
