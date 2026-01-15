/**
 * Teek 主题适配器
 * @description
 * 提供 vitepress-theme-teek 主题的配置定义
 * 支持动态样式加载和卸载
 * @module theme-switcher/adapters/teek
 * @see https://vp.teek.top/
 */

import type { ThemeDefinition } from "../../types";
import { injectStyle, removeStyles, isStyleLoaded, markStyleLoaded } from "../style-manager";

// 导入 Teek 主题（仅导入 JS，不导入 CSS）
import Teek from "vitepress-theme-teek";

/**
 * Teek 主题 ID
 */
export const TEEK_THEME_ID = "teek" as const;

/**
 * Teek 主题样式标识符
 */
export const TEEK_STYLE_ID = "teek-theme-style";

/**
 * Teek 主题样式文件列表
 * @description
 * 包含主题核心样式和增强样式
 * @see https://vp.teek.top/guide/styles-plus.html
 */
export const TEEK_STYLES = [
	"vitepress-theme-teek/index.css",
	// 样式增强
	"vitepress-theme-teek/theme-chalk/tk-doc-h1-gradient.css", // 文章一级标题渐变色
	"vitepress-theme-teek/theme-chalk/tk-nav-blur.css", // 导航栏毛玻璃样式
	"vitepress-theme-teek/theme-chalk/tk-scrollbar.css", // 滚动条样式
	"vitepress-theme-teek/theme-chalk/tk-sidebar.css", // 侧边栏样式
	"vitepress-theme-teek/theme-chalk/tk-aside.css", // 右侧目录栏文字悬停和激活样式
	"vitepress-theme-teek/theme-chalk/tk-fade-up-animation.css", // 首次进入页面添加渐显动画
] as const;

/**
 * 动态加载 Teek 主题样式
 * @description
 * 通过动态 import() 加载所有 Teek 主题 CSS 文件
 * 使用 Vite 的标准 CSS 处理流程
 * 注意：由于使用页面刷新切换主题（方案 B），样式不需要手动卸载
 */
async function loadTeekStyles(): Promise<void> {
	if (typeof document === "undefined") {
		return;
	}

	// 如果已加载，跳过
	if (isStyleLoaded(TEEK_THEME_ID)) {
		return;
	}

	try {
		// 动态导入所有样式文件，让 Vite 处理
		await Promise.all([
			import("vitepress-theme-teek/index.css"),
			import("vitepress-theme-teek/theme-chalk/tk-doc-h1-gradient.css"),
			import("vitepress-theme-teek/theme-chalk/tk-nav-blur.css"),
			import("vitepress-theme-teek/theme-chalk/tk-scrollbar.css"),
			import("vitepress-theme-teek/theme-chalk/tk-sidebar.css"),
			import("vitepress-theme-teek/theme-chalk/tk-aside.css"),
			import("vitepress-theme-teek/theme-chalk/tk-fade-up-animation.css"),
		]);

		// 标记已加载
		markStyleLoaded(TEEK_THEME_ID);

		// 添加主题类
		document.documentElement.classList.add("theme-teek");
		document.documentElement.classList.remove("theme-voidzero");
	} catch (error) {
		console.error("[Teek Theme] Failed to load styles:", error);
		throw error;
	}
}

/**
 * 卸载 Teek 主题样式
 * @description
 * 从 DOM 中移除所有 Teek 主题的样式元素
 */
function unloadTeekStyles(): void {
	if (typeof document === "undefined") {
		return;
	}

	// 移除样式
	removeStyles(TEEK_THEME_ID);

	// 移除主题类
	document.documentElement.classList.remove("theme-teek");
}

/**
 * Teek 主题定义
 * @description
 * 完整的 Teek 主题配置，包含主题对象、样式和动态加载/卸载函数
 * @see Requirements 2.1, 2.4
 */
export const teekThemeDefinition: ThemeDefinition = {
	id: TEEK_THEME_ID,
	name: "Teek",
	description: "vitepress-theme-teek 主题 - 功能丰富的 VitePress 主题",
	theme: Teek,
	styles: [...TEEK_STYLES],
	styleId: TEEK_STYLE_ID,
	loadStyles: loadTeekStyles,
	unloadStyles: unloadTeekStyles,
	cleanup: () => {
		// Teek 主题清理逻辑
		unloadTeekStyles();
	},
};

/**
 * 创建 Teek 主题定义
 * @description
 * 工厂函数，可用于创建自定义的 Teek 主题变体
 * @param overrides - 覆盖默认配置的选项
 * @returns Teek 主题定义
 */
export function createTeekThemeDefinition(overrides?: Partial<ThemeDefinition>): ThemeDefinition {
	return {
		...teekThemeDefinition,
		...overrides,
	};
}
