/**
 * 主题适配器索引
 * @description
 * 导出所有内置主题适配器，并提供创建内置注册表的工厂函数
 * @module theme-switcher/adapters
 */

import { ThemeRegistry, createThemeRegistry } from "../registry";
import type { ThemeDefinition } from "../../types";

// 导出 Teek 主题适配器
export {
	TEEK_THEME_ID,
	TEEK_STYLE_ID,
	TEEK_STYLES,
	teekThemeDefinition,
	createTeekThemeDefinition,
	getTeekTheme,
} from "./teek";

// 导出 VoidZero 主题适配器
export {
	VOIDZERO_THEME_ID,
	VOIDZERO_STYLE_ID,
	VOIDZERO_STYLES,
	voidZeroThemeDefinition,
	createVoidZeroThemeDefinition,
	getVoidZeroStyleId,
	getVoidZeroTheme,
} from "./voidzero";

// 导出样式管理器
export * from "../style-manager";

// 导入主题定义用于内部使用
import { teekThemeDefinition, TEEK_THEME_ID } from "./teek";
import { voidZeroThemeDefinition, VOIDZERO_THEME_ID } from "./voidzero";

/**
 * 内置主题 ID 列表
 */
export const BUILTIN_THEME_IDS = [TEEK_THEME_ID, VOIDZERO_THEME_ID] as const;

/**
 * 内置主题 ID 类型
 */
export type BuiltinThemeId = (typeof BUILTIN_THEME_IDS)[number];

/**
 * 内置主题定义列表
 * @description
 * 包含 Teek 和 VoidZero 两个内置主题
 * VoidZero 主题所需的 Vite 别名会在 handleThemeSwitcher 中自动配置
 */
export const BUILTIN_THEMES: ThemeDefinition[] = [teekThemeDefinition, voidZeroThemeDefinition];

/**
 * 默认主题 ID
 * @description
 * 当未指定默认主题时使用的主题 ID
 */
export const DEFAULT_THEME_ID = TEEK_THEME_ID;

/**
 * 创建包含内置主题的注册表
 * @description
 * 创建一个新的 ThemeRegistry 实例，并注册所有内置主题
 * @returns 包含内置主题的 ThemeRegistry 实例
 * @see Requirements 3.2
 */
export function createBuiltinRegistry(): ThemeRegistry {
	const registry = createThemeRegistry();

	// 注册所有内置主题
	for (const theme of BUILTIN_THEMES) {
		registry.register(theme);
	}

	return registry;
}

/**
 * 创建包含指定主题的注册表
 * @description
 * 创建一个新的 ThemeRegistry 实例，仅注册指定 ID 的内置主题
 * @param themeIds - 要注册的主题 ID 列表
 * @returns 包含指定主题的 ThemeRegistry 实例
 */
export function createFilteredRegistry(themeIds: string[]): ThemeRegistry {
	const registry = createThemeRegistry();

	// 仅注册指定的内置主题
	for (const theme of BUILTIN_THEMES) {
		if (themeIds.includes(theme.id)) {
			registry.register(theme);
		}
	}

	return registry;
}

/**
 * 获取内置主题定义
 * @description
 * 通过 ID 获取内置主题定义
 * @param id - 主题 ID
 * @returns 主题定义，如果未找到则返回 undefined
 */
export function getBuiltinTheme(id: string): ThemeDefinition | undefined {
	return BUILTIN_THEMES.find((theme) => theme.id === id);
}

/**
 * 检查是否为内置主题 ID
 * @description
 * 检查给定的 ID 是否为内置主题的 ID
 * @param id - 要检查的 ID
 * @returns 如果是内置主题 ID 返回 true
 */
export function isBuiltinThemeId(id: string): id is BuiltinThemeId {
	return BUILTIN_THEME_IDS.includes(id as BuiltinThemeId);
}
