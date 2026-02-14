/**
 * VitePress 项目工具函数
 * @description 提供 VitePress 项目相关的公共工具函数，用于获取项目根目录、源目录等
 */

import { type UserConfig, type DefaultTheme } from "vitepress";
import fs from "node:fs";
import path from "node:path";
import consola from "consola";

/** 提示词索引文件的相对路径 */
export const PROMPTS_INDEX_MD_PATH = "prompts/index.md" as const;

/** CHANGELOG.md 文件名 */
export const CHANGELOG_MD_FILENAME = "CHANGELOG.md" as const;

/**
 * 从命令行参数中获取 VitePress 项目根目录
 * @description
 * 解析命令行参数，查找 vitepress dev/build 命令后的第一个路径参数
 * 返回项目根目录（.vitepress 所在目录），而非源目录
 *
 * 支持的场景：
 * 1. vitepress dev - 使用当前目录
 * 2. vitepress dev docs - docs 是源目录，项目根目录在父目录
 * 3. vitepress dev src/docs - src/docs 是源目录，项目根目录需要向上查找
 */
export function getProjectRootFromArgs(): string | null {
	const args = process.argv;
	const vitepressIndex = args.findIndex((arg) => arg.includes("vitepress"));

	if (vitepressIndex === -1) {
		return null;
	}

	for (let i = vitepressIndex + 1; i < args.length; i++) {
		const arg = args[i];

		// 跳过命令关键字
		if (arg === "dev" || arg === "build" || arg === "serve" || arg === "preview") {
			continue;
		}

		// 跳过选项参数
		if (arg.startsWith("-")) {
			if (arg.startsWith("--") && !arg.includes("=")) {
				i++; // 跳过选项值
			}
			continue;
		}

		// 解析传入的路径（可能是源目录或项目根目录）
		let inputPath = path.resolve(process.cwd(), arg);

		// 向上查找直到找到 .vitepress 目录或到达根目录
		let currentDir = inputPath;
		const root = path.parse(currentDir).root;

		while (currentDir !== root) {
			if (fs.existsSync(path.join(currentDir, ".vitepress"))) {
				consola.log("从命令行参数获取到 VitePress 项目根目录：", currentDir);
				return currentDir;
			}
			currentDir = path.dirname(currentDir);
		}

		// 检查根目录本身
		if (fs.existsSync(path.join(root, ".vitepress"))) {
			consola.log("从命令行参数获取到 VitePress 项目根目录：", root);
			return root;
		}

		// 找不到，返回 null
		return null;
	}

	return null;
}

/**
 * 从指定目录向上查找 VitePress 项目根目录
 * @description 递归向上查找包含 .vitepress 目录的目录
 */
function findProjectRootFromDir(startDir: string): string | null {
	const root = path.parse(startDir).root;
	let currentDir = startDir;

	while (currentDir !== root) {
		const vitepressDir = path.join(currentDir, ".vitepress");
		if (fs.existsSync(vitepressDir)) {
			return currentDir;
		}
		currentDir = path.dirname(currentDir);
	}

	// 检查根目录本身
	const rootVitepressDir = path.join(root, ".vitepress");
	if (fs.existsSync(rootVitepressDir)) {
		return root;
	}

	return null;
}

/**
 * 获得 vitepress 项目的 `项目根目录 (project root)`
 * @description
 * 检查出当前运行 vitepress build 命令时，所使用的项目根目录，并对外返回该目录。
 * @see https://vitepress.dev/zh/guide/routing#root-and-source-directory
 */
export function getVitepressProjectRoot(): string {
	// 首先尝试从命令行参数提供的路径开始查找
	const projectRootFromArgs = getProjectRootFromArgs();
	if (projectRootFromArgs) {
		const foundRoot = findProjectRootFromDir(projectRootFromArgs);
		if (foundRoot) {
			consola.log("从命令行参数获取到 VitePress 项目根目录：", foundRoot);
			return foundRoot;
		}
	}

	// 如果命令行参数无效，使用当前工作目录查找
	const foundFromCwd = findProjectRootFromDir(process.cwd());
	if (foundFromCwd) {
		consola.log("通过当前工作目录获取到 VitePress 项目根目录：", foundFromCwd);
		return foundFromCwd;
	}

	// 如果找不到 .vitepress 目录，回退到命令行参数提供的路径（如果存在）
	if (projectRootFromArgs) {
		consola.warn("未找到 .vitepress 目录，回退到命令行参数路径：", projectRootFromArgs);
		return projectRootFromArgs;
	}

	// 最后回退到当前工作目录
	const fallbackDir = process.cwd();
	consola.warn("未找到 .vitepress 目录，回退到当前工作目录：", fallbackDir);
	return fallbackDir;
}

/**
 * 获取 vitepress 项目的源目录
 * @description
 * 获取 vitepress 项目的源目录并对外返回该目录。
 *
 * 源目录的计算规则：
 * 1. 如果配置中指定了 srcDir，则源目录 = 项目根目录 + srcDir
 * 2. 如果没有指定 srcDir，则源目录 = 项目根目录
 *
 * @param userConfig - VitePress 用户配置对象
 * @see https://vitepress.dev/zh/guide/routing#source-directory
 */
export function getVitepressSourceDirectory(userConfig: UserConfig<DefaultTheme.Config>): string {
	const projectRoot = getVitepressProjectRoot();
	const srcDir = (userConfig as Record<string, unknown>).srcDir as string | undefined;

	if (srcDir) {
		const sourceDirectory = path.resolve(projectRoot, srcDir);
		consola.log("从配置中获取到 srcDir:", srcDir);
		consola.log("VitePress 源目录为：", sourceDirectory);
		return sourceDirectory;
	}

	consola.log("配置中未指定 srcDir，源目录等于项目根目录：", projectRoot);
	return projectRoot;
}

/**
 * 检查源目录是否存在 prompts/index.md 文件
 * @description
 * 检查当前文档的运行目录内是否存在 prompts/index.md 文件
 */
export function hasPromptsIndexMd(userConfig: UserConfig<DefaultTheme.Config>): boolean {
	const sourceDir = getVitepressSourceDirectory(userConfig);
	const res = fs.existsSync(path.resolve(sourceDir, PROMPTS_INDEX_MD_PATH));
	if (!res) {
		consola.log("当前项目的 vitepress 源目录为：", sourceDir);
		consola.warn(`当前项目的 vitepress 源目录不存在 ${PROMPTS_INDEX_MD_PATH} 文件`);
	}
	return res;
}

/**
 * 检查源目录是否存在 CHANGELOG.md 文件
 * @description
 * 检查当前文档的运行目录内是否存在 CHANGELOG.md 文件
 */
export function hasChangelogMd(userConfig: UserConfig<DefaultTheme.Config>): boolean {
	const sourceDir = getVitepressSourceDirectory(userConfig);
	const res = fs.existsSync(path.resolve(sourceDir, CHANGELOG_MD_FILENAME));
	if (!res) {
		consola.log("当前项目的 vitepress 源目录为：", sourceDir);
		consola.warn(`当前项目的 vitepress 源目录不存在 ${CHANGELOG_MD_FILENAME} 文件`);
	}
	return res;
}
