/**
 * VoidZero 主题适配器
 * @description
 * 提供 @voidzero-dev/vitepress-theme 主题的配置定义
 * 该主题是 Vite 官方风格的 VitePress 主题
 * 支持动态样式加载和卸载
 * @module theme-switcher/adapters/voidzero
 * @see https://github.com/vitejs/vite-plugin-registry/pull/11/files
 */

import type { ThemeDefinition } from "../../../types";
import { removeStyles, isStyleLoaded, markStyleLoaded } from "../../style-manager";

/**
 * VoidZero 主题 ID
 */
export const VOIDZERO_THEME_ID = "voidzero" as const;

/**
 * VoidZero 主题样式标识符
 * @description
 * 用于在 DOM 中标识 VoidZero 主题注入的样式元素
 */
export const VOIDZERO_STYLE_ID = "voidzero-theme-style";

/**
 * VoidZero 主题样式文件列表
 * @description
 * VoidZero 主题的样式文件
 */
export const VOIDZERO_STYLES = ["@voidzero-dev/vitepress-theme/src/styles/index.css"] as const;

/**
 * 动态加载 VoidZero 主题样式
 * @description
 * 通过动态 import() 加载 VoidZero 主题 CSS 文件
 * 使用 Vite 的标准 CSS 处理流程，支持 Tailwind CSS
 * 注意：由于使用页面刷新切换主题（方案 B），样式不需要手动卸载
 */
async function loadVoidZeroStyles(): Promise<void> {
	if (typeof document === "undefined") {
		return;
	}

	// 如果已加载，跳过
	if (isStyleLoaded(VOIDZERO_THEME_ID)) {
		return;
	}

	try {
		// 并行加载：
		// 1. VoidZero 主题的核心样式（包含 Tailwind CSS）
		// 2. 适配器的备用样式（Tailwind 类备用和布局修复）
		await Promise.all([import("@voidzero-dev/vitepress-theme/src/styles/index.css"), import("./styles.css")]);

		// 标记已加载
		markStyleLoaded(VOIDZERO_THEME_ID);

		// 添加主题类
		document.documentElement.classList.add("theme-voidzero");
		document.documentElement.classList.remove("theme-teek");

		// 强制重新计算样式，确保固定定位生效
		// 这是为了解决某些情况下样式不立即生效的问题
		if (typeof window !== "undefined") {
			window.requestAnimationFrame(() => {
				// 触发重排，确保样式应用
				document.body.offsetHeight;
			});
		}
	} catch (error) {
		console.error("[VoidZero Theme] Failed to load styles:", error);
		throw error;
	}
}

/**
 * 卸载 VoidZero 主题样式
 * @description
 * 从 DOM 中移除所有 VoidZero 主题的样式元素和 CSS 变量
 */
function unloadVoidZeroStyles(): void {
	if (typeof document === "undefined") {
		return;
	}

	// 移除样式
	removeStyles(VOIDZERO_THEME_ID);

	// 移除主题类
	document.documentElement.classList.remove("theme-voidzero");

	// 清理可能的 VoidZero 特定 CSS 变量
	const root = document.documentElement;
	const voidZeroVars = [
		"--vz-c-brand",
		"--vz-c-brand-light",
		"--vz-c-brand-dark",
		"--vz-c-brand-lighter",
		"--vz-c-brand-darker",
	];

	voidZeroVars.forEach((varName) => {
		root.style.removeProperty(varName);
	});
}

/**
 * 延迟加载的 VoidZero 主题模块
 * @description
 * 使用动态导入避免在模块加载时就解析 @voidzero-dev/vitepress-theme
 * 这样可以避免 @vp-default 别名解析问题
 */
let voidZeroThemeModule: any = null;

/**
 * 获取 VoidZero 主题模块
 * @description
 * 延迟加载 VoidZero 主题，只在需要时才导入
 * @returns VoidZero 主题模块
 */
export async function getVoidZeroTheme(): Promise<any> {
	if (!voidZeroThemeModule) {
		// 动态导入，避免构建时解析
		voidZeroThemeModule = await import("@voidzero-dev/vitepress-theme");
	}
	return voidZeroThemeModule.default || voidZeroThemeModule;
}

/**
 * VoidZero 主题定义（延迟加载版本）
 * @description
 * 完整的 VoidZero 主题配置，使用占位符主题对象
 * 实际主题在运行时通过 getVoidZeroTheme() 加载
 * @see Requirements 6.1, 6.2, 6.3, 6.4
 */
export const voidZeroThemeDefinition: ThemeDefinition = {
	id: VOIDZERO_THEME_ID,
	name: "VoidZero",
	description: "@voidzero-dev/vitepress-theme 主题 - Vite 官方风格（需要配置 Vite 别名）",
	// 使用占位符，实际主题需要通过 getVoidZeroTheme() 获取
	theme: {} as any,
	styles: [...VOIDZERO_STYLES],
	styleId: VOIDZERO_STYLE_ID,
	loadStyles: loadVoidZeroStyles,
	unloadStyles: unloadVoidZeroStyles,
	cleanup: () => {
		// VoidZero 主题清理逻辑
		unloadVoidZeroStyles();
	},
};

/**
 * 创建 VoidZero 主题定义
 * @description
 * 工厂函数，可用于创建自定义的 VoidZero 主题变体
 * @param overrides - 覆盖默认配置的选项
 * @returns VoidZero 主题定义
 */
export function createVoidZeroThemeDefinition(overrides?: Partial<ThemeDefinition>): ThemeDefinition {
	return {
		...voidZeroThemeDefinition,
		...overrides,
	};
}

/**
 * 获取 VoidZero 样式标识符
 * @description
 * 返回用于标识 VoidZero 样式元素的 ID
 * @returns 样式标识符
 */
export function getVoidZeroStyleId(): string {
	return VOIDZERO_STYLE_ID;
}
