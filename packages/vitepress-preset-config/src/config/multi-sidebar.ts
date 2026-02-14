// 多侧边栏配置 - 使用 Object.defineProperty 拦截实现透明多侧边栏

import { type UserConfig, type DefaultTheme } from "vitepress";
import { generateSidebar } from "vitepress-sidebar";
import path from "node:path";
import consola from "consola";
import { merge, cloneDeep } from "lodash-es";

import {
	getVitepressProjectRoot,
	getVitepressSourceDirectory,
	hasPromptsIndexMd,
	hasChangelogMd,
} from "../utils/vitepress-project.ts";

/** 从 generateSidebar 函数参数中提取类型 */
type VitePressSidebarOptions = Parameters<typeof generateSidebar>[0];

/** 默认侧边栏配置选项 */
export const defaultSidebarOptions: VitePressSidebarOptions = {
	// 侧边栏需要折叠
	collapsed: true,

	// 用文件的 h1 标题作为侧边栏标题
	useTitleFromFileHeading: true,

	// 用index文件的标题作为折叠栏的标题
	useFolderTitleFromIndexFile: true,

	// 折叠栏链接到index文件
	useFolderLinkFromIndexFile: true,

	// 用order字段做菜单排序
	sortMenusByFrontmatterOrder: true,

	// 不使用名称排序
	sortMenusByName: false,

	useFolderLinkFromSameNameSubFile: true,

	// 不输出调试信息了
	debugPrint: false,
};

/**
 * 获取合并后的侧边栏配置
 */
export function getMergeSidebarOptions(options?: VitePressSidebarOptions) {
	return merge({}, cloneDeep(defaultSidebarOptions), options ?? {});
}

/**
 * 获取源目录相对于 process.cwd() 的路径
 * @description 用于 vitepress-sidebar 的配置
 */
export function getSourceDirRelativePathFromCwd(userConfig: UserConfig<DefaultTheme.Config>): string {
	const projectRoot = getVitepressProjectRoot();
	const sourceDir = getVitepressSourceDirectory(userConfig);
	const relativePath = path.relative(process.cwd(), sourceDir);

	consola.log("项目根目录:", projectRoot);
	consola.log("源目录:", sourceDir);
	consola.log("cwd:", process.cwd());
	consola.log("源目录相对于 cwd 的路径:", relativePath);

	if (!relativePath || relativePath.startsWith("..")) {
		return ".";
	}

	return relativePath.replace(/\\/g, "/");
}

/**
 * 递归为侧边栏项的 link 添加路径前缀
 * @description
 * generateSidebar 以子目录为根扫描时，生成的 link 缺少父路径前缀。
 * 例如扫描 prompts 目录时，link 为 "/make-dynamic-routes"，
 * 需要补充为 "/prompts/make-dynamic-routes"。
 */
function prefixSidebarLinks(items: any[], prefix: string): any[] {
	return items.map((item) => {
		const newItem = { ...item };
		if (newItem.link && typeof newItem.link === "string") {
			// 处理带和不带前导斜杠的情况
			const link = newItem.link.startsWith("/") ? newItem.link : `/${newItem.link}`;
			newItem.link = `${prefix}${link}`;
		}
		if (Array.isArray(newItem.items)) {
			newItem.items = prefixSidebarLinks(newItem.items, prefix);
		}
		return newItem;
	});
}

/**
 * 设置多侧边栏拦截
 * @description
 * 使用 Object.defineProperty 在 themeConfig.sidebar 上设置 getter/setter：
 * - setter: 消费者赋值时，存储为业务侧边栏内容
 * - getter: VitePress 读取时，返回包含 prompts/CHANGELOG 的多侧边栏对象
 *
 * 对消费者完全透明，无需修改任何消费者代码。
 */
export function setupMultiSidebar(userConfig: UserConfig<DefaultTheme.Config>): void {
	const hasPrompts = hasPromptsIndexMd(userConfig);
	const hasChangelog = hasChangelogMd(userConfig);

	if (!hasPrompts && !hasChangelog) {
		consola.log("未检测到 prompts 目录或 CHANGELOG.md，不需要多侧边栏");
		return;
	}

	const themeConfig = userConfig.themeConfig!;

	// 预生成额外侧边栏
	const extraSidebars: Record<string, any> = {};

	if (hasPrompts) {
		const sourceDirRelativePathFromCwd = getSourceDirRelativePathFromCwd(userConfig);
		const promptsFullPath =
			sourceDirRelativePathFromCwd === "." ? "prompts" : `${sourceDirRelativePathFromCwd}/prompts`;

		consola.log("promptsFullPath:", promptsFullPath);

		const promptsSidebar = generateSidebar(
			getMergeSidebarOptions({
				documentRootPath: promptsFullPath,
			}),
		);

		extraSidebars["/prompts/"] = Array.isArray(promptsSidebar)
			? prefixSidebarLinks(promptsSidebar, "/prompts")
			: promptsSidebar;
	}

	if (hasChangelog) {
		extraSidebars["/CHANGELOG"] = [];
	}

	// 设置 getter/setter 拦截
	let businessSidebar: any = themeConfig.sidebar;

	Object.defineProperty(themeConfig, "sidebar", {
		configurable: true,
		enumerable: true,
		get() {
			const result: Record<string, any> = { ...extraSidebars };
			if (Array.isArray(businessSidebar)) {
				result["/"] = businessSidebar;
			} else if (typeof businessSidebar === "object" && businessSidebar !== null) {
				Object.assign(result, businessSidebar);
			}
			return result;
		},
		set(value: any) {
			businessSidebar = value;
		},
	});

	consola.success("多侧边栏 defineProperty 拦截已设置");
}
