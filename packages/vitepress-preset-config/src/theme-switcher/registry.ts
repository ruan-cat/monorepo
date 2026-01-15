/**
 * 主题注册表模块
 * @description
 * 提供主题的注册、查询和管理功能
 * @module theme-switcher/registry
 */

import type { ThemeDefinition, IThemeRegistry } from "../types";

/**
 * 主题注册表实现类
 * @description
 * 使用 Map 存储主题定义，支持注册、查询、覆盖等操作
 * @implements {IThemeRegistry}
 */
export class ThemeRegistry implements IThemeRegistry {
	/** 主题存储 Map */
	private themes: Map<string, ThemeDefinition> = new Map();

	/**
	 * 注册主题
	 * @description
	 * 将主题定义注册到注册表中。如果主题 ID 已存在，则覆盖之前的注册。
	 * @param theme - 主题定义对象
	 * @see Requirements 3.1, 3.4
	 */
	register(theme: ThemeDefinition): void {
		this.themes.set(theme.id, theme);
	}

	/**
	 * 获取主题
	 * @description
	 * 通过主题 ID 获取主题定义
	 * @param id - 主题唯一标识符
	 * @returns 主题定义对象，如果未找到则返回 undefined
	 * @see Requirements 3.5
	 */
	get(id: string): ThemeDefinition | undefined {
		return this.themes.get(id);
	}

	/**
	 * 获取所有主题
	 * @description
	 * 返回注册表中所有主题的数组
	 * @returns 所有主题定义的数组
	 */
	getAll(): ThemeDefinition[] {
		return Array.from(this.themes.values());
	}

	/**
	 * 检查主题是否存在
	 * @description
	 * 检查指定 ID 的主题是否已注册
	 * @param id - 主题唯一标识符
	 * @returns 如果主题存在返回 true，否则返回 false
	 */
	has(id: string): boolean {
		return this.themes.has(id);
	}

	/**
	 * 获取主题数量
	 * @description
	 * 返回注册表中主题的总数
	 * @returns 主题数量
	 */
	size(): number {
		return this.themes.size;
	}

	/**
	 * 清空注册表
	 * @description
	 * 移除所有已注册的主题
	 */
	clear(): void {
		this.themes.clear();
	}

	/**
	 * 批量注册主题
	 * @description
	 * 一次性注册多个主题
	 * @param themes - 主题定义数组
	 */
	registerAll(themes: ThemeDefinition[]): void {
		for (const theme of themes) {
			this.register(theme);
		}
	}

	/**
	 * 移除主题
	 * @description
	 * 从注册表中移除指定 ID 的主题
	 * @param id - 主题唯一标识符
	 * @returns 如果主题存在并被移除返回 true，否则返回 false
	 */
	remove(id: string): boolean {
		return this.themes.delete(id);
	}

	/**
	 * 获取所有主题 ID
	 * @description
	 * 返回注册表中所有主题 ID 的数组
	 * @returns 主题 ID 数组
	 */
	getIds(): string[] {
		return Array.from(this.themes.keys());
	}
}

/**
 * 创建主题注册表实例
 * @description
 * 工厂函数，创建一个新的主题注册表实例
 * @returns 新的 ThemeRegistry 实例
 */
export function createThemeRegistry(): ThemeRegistry {
	return new ThemeRegistry();
}
