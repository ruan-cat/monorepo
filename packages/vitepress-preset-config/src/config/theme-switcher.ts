/**
 * 主题切换器配置处理模块
 * @description
 * 处理 ExtraConfig 中的 themeSwitcher 配置
 * @module config/theme-switcher
 * @see Requirements 2.3, 4.2, 4.3, 4.4, 4.5
 */

import type { DefaultTheme, UserConfig } from "vitepress";
import type { ExtraConfig, ThemeSwitcherConfig } from "../types";

// 同步导入 VoidZero 主题的配置函数
import { extendConfig as extendVoidZeroConfig } from "@voidzero-dev/vitepress-theme/config";

/**
 * 默认主题切换器配置
 * @description
 * 当用户未提供配置时使用的默认值
 */
export const defaultThemeSwitcherConfig: ThemeSwitcherConfig = {
	enabled: false,
	defaultTheme: "teek",
	storageKey: "vitepress-theme",
	buttonPosition: "nav",
	buttonText: "主题",
};

/**
 * 合并主题切换器配置
 * @description
 * 将用户配置与默认配置合并
 * @param userConfig - 用户提供的配置
 * @returns 合并后的配置
 */
export function mergeThemeSwitcherConfig(userConfig?: ThemeSwitcherConfig): ThemeSwitcherConfig {
	if (!userConfig) {
		return { ...defaultThemeSwitcherConfig };
	}

	return {
		...defaultThemeSwitcherConfig,
		...userConfig,
	};
}

/**
 * 添加 VoidZero 主题所需的配置
 * @description
 * 使用 VoidZero 主题提供的 extendConfig 函数来配置所有必要的别名和设置
 * @param resUserConfig - VitePress 用户配置对象
 */
function addVoidZeroConfig(resUserConfig: UserConfig<DefaultTheme.Config>): void {
	try {
		// 使用 VoidZero 提供的 extendConfig 函数来配置别名
		extendVoidZeroConfig(resUserConfig);
	} catch (error) {
		console.warn("[ThemeSwitcher] 无法加载 VoidZero 主题配置，VoidZero 主题可能无法正常工作:", error);
	}
}

/**
 * 处理主题切换器配置
 * @description
 * 在 setUserConfig 中调用，处理 ExtraConfig 中的 themeSwitcher 配置
 * 包括添加 VoidZero 主题所需的 Vite 别名
 * @param resUserConfig - VitePress 用户配置对象
 * @param extraConfig - 额外配置对象
 * @see Requirements 2.3, 4.2, 4.3, 4.4, 4.5
 */
export function handleThemeSwitcher(resUserConfig: UserConfig<DefaultTheme.Config>, extraConfig?: ExtraConfig): void {
	// 如果没有主题切换器配置，直接返回
	if (!extraConfig?.themeSwitcher) {
		return;
	}

	const themeSwitcherConfig = mergeThemeSwitcherConfig(extraConfig.themeSwitcher);

	// 如果未启用，直接返回
	if (!themeSwitcherConfig.enabled) {
		return;
	}

	// 添加 VoidZero 主题所需的配置
	addVoidZeroConfig(resUserConfig);

	// 验证默认主题是否在可用主题列表中
	if (themeSwitcherConfig.themes && themeSwitcherConfig.themes.length > 0) {
		const defaultTheme = themeSwitcherConfig.defaultTheme ?? "teek";
		if (!themeSwitcherConfig.themes.includes(defaultTheme)) {
			console.warn(`[ThemeSwitcher] 默认主题 "${defaultTheme}" 不在可用主题列表中，将使用列表中的第一个主题`);
		}
	}

	// 主题切换器的实际初始化在客户端进行（通过 useThemeSwitcher 组合式函数）
	// 这里只做配置验证和准备工作
}

/**
 * 获取主题切换器配置
 * @description
 * 从 ExtraConfig 中提取并合并主题切换器配置
 * @param extraConfig - 额外配置对象
 * @returns 合并后的主题切换器配置
 */
export function getThemeSwitcherConfig(extraConfig?: ExtraConfig): ThemeSwitcherConfig {
	return mergeThemeSwitcherConfig(extraConfig?.themeSwitcher);
}
