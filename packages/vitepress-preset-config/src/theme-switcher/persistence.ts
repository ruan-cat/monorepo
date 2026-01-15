/**
 * 主题持久化模块
 * @description
 * 提供主题偏好的存储和恢复功能，使用 localStorage 实现持久化
 * @module theme-switcher/persistence
 */

import type { IThemePersistence } from "../types";
import { ThemeSwitcherError, ThemeErrorCode } from "../types";

/** 默认存储键名 */
export const DEFAULT_STORAGE_KEY = "vitepress-theme";

/** 持久化数据版本号 */
const PERSISTENCE_VERSION = 1;

/**
 * 持久化数据结构
 * @description
 * 存储在 localStorage 中的数据格式
 */
interface PersistedThemeData {
	/** 主题 ID */
	themeId: string;
	/** 保存时间戳 */
	timestamp: number;
	/** 版本号（用于未来迁移） */
	version: number;
}

/**
 * 检查 localStorage 是否可用
 * @description
 * 在某些环境下（如 SSR、隐私模式）localStorage 可能不可用
 * @returns 如果 localStorage 可用返回 true
 */
function isLocalStorageAvailable(): boolean {
	try {
		const testKey = "__theme_switcher_test__";
		if (typeof window === "undefined" || !window.localStorage) {
			return false;
		}
		window.localStorage.setItem(testKey, testKey);
		window.localStorage.removeItem(testKey);
		return true;
	} catch {
		return false;
	}
}

/**
 * 主题持久化实现类
 * @description
 * 使用 localStorage 存储用户的主题偏好
 * @implements {IThemePersistence}
 */
export class ThemePersistence implements IThemePersistence {
	/** 存储键名 */
	private storageKey: string;

	/**
	 * 创建 ThemePersistence 实例
	 * @param storageKey - 自定义存储键名，默认为 'vitepress-theme'
	 */
	constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
		this.storageKey = storageKey;
	}

	/**
	 * 保存主题偏好
	 * @description
	 * 将主题 ID 保存到 localStorage
	 * @param themeId - 要保存的主题 ID
	 * @see Requirements 1.4
	 */
	save(themeId: string): void {
		if (!isLocalStorageAvailable()) {
			console.warn("[ThemePersistence] localStorage 不可用，无法保存主题偏好");
			return;
		}

		try {
			const data: PersistedThemeData = {
				themeId,
				timestamp: Date.now(),
				version: PERSISTENCE_VERSION,
			};
			window.localStorage.setItem(this.storageKey, JSON.stringify(data));
		} catch (error) {
			console.warn("[ThemePersistence] 保存主题偏好失败:", error);
			// 不抛出错误，允许应用继续运行
		}
	}

	/**
	 * 加载主题偏好
	 * @description
	 * 从 localStorage 加载之前保存的主题 ID
	 * @returns 保存的主题 ID，如果未找到或无效则返回 null
	 * @see Requirements 1.4, 1.5
	 */
	load(): string | null {
		if (!isLocalStorageAvailable()) {
			return null;
		}

		try {
			const stored = window.localStorage.getItem(this.storageKey);
			if (!stored) {
				return null;
			}

			const data = JSON.parse(stored) as PersistedThemeData;

			// 验证数据结构
			if (!this.isValidPersistedData(data)) {
				console.warn("[ThemePersistence] 存储的数据格式无效，将被忽略");
				this.clear();
				return null;
			}

			return data.themeId;
		} catch (error) {
			console.warn("[ThemePersistence] 加载主题偏好失败:", error);
			// 清除无效数据
			this.clear();
			return null;
		}
	}

	/**
	 * 清除主题偏好
	 * @description
	 * 从 localStorage 中移除保存的主题偏好
	 */
	clear(): void {
		if (!isLocalStorageAvailable()) {
			return;
		}

		try {
			window.localStorage.removeItem(this.storageKey);
		} catch (error) {
			console.warn("[ThemePersistence] 清除主题偏好失败:", error);
		}
	}

	/**
	 * 验证持久化数据是否有效
	 * @param data - 要验证的数据
	 * @returns 如果数据有效返回 true
	 */
	private isValidPersistedData(data: unknown): data is PersistedThemeData {
		if (typeof data !== "object" || data === null) {
			return false;
		}

		const obj = data as Record<string, unknown>;

		return (
			typeof obj.themeId === "string" &&
			obj.themeId.length > 0 &&
			typeof obj.timestamp === "number" &&
			typeof obj.version === "number"
		);
	}

	/**
	 * 获取存储键名
	 * @returns 当前使用的存储键名
	 */
	getStorageKey(): string {
		return this.storageKey;
	}
}

/**
 * 创建主题持久化实例
 * @description
 * 工厂函数，创建一个新的主题持久化实例
 * @param storageKey - 自定义存储键名
 * @returns 新的 ThemePersistence 实例
 */
export function createThemePersistence(storageKey?: string): ThemePersistence {
	return new ThemePersistence(storageKey);
}
