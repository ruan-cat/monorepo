/**
 * 主题管理器模块
 * @description
 * 提供主题切换的核心逻辑，包括主题应用、样式注入和状态管理
 * @module theme-switcher/manager
 */

import type { ThemeDefinition, IThemeManager, IThemeRegistry, IThemePersistence } from "../types";
import { ThemeSwitcherError, ThemeErrorCode } from "../types";

/** 默认主题 ID */
const DEFAULT_THEME_ID = "teek";

/**
 * 样式元素的 data 属性名
 */
const STYLE_DATA_ATTR = "data-theme-switcher-style";

/**
 * 主题管理器配置选项
 */
export interface ThemeManagerOptions {
	/** 主题注册表 */
	registry: IThemeRegistry;
	/** 主题持久化实例 */
	persistence?: IThemePersistence;
	/** 默认主题 ID */
	defaultTheme?: string;
	/** 切换动画持续时间（毫秒） */
	transitionDuration?: number;
}

/**
 * 主题管理器实现类
 * @description
 * 负责主题切换的核心逻辑，包括：
 * - 主题状态管理
 * - 样式动态注入
 * - 与持久化模块集成
 * @implements {IThemeManager}
 */
export class ThemeManager implements IThemeManager {
	/** 主题注册表 */
	private registry: IThemeRegistry;

	/** 主题持久化实例 */
	private persistence: IThemePersistence | null;

	/** 当前激活的主题 ID */
	private currentThemeId: string;

	/** 默认主题 ID */
	private defaultThemeId: string;

	/** 切换动画持续时间 */
	private transitionDuration: number;

	/** 是否已初始化 */
	private initialized: boolean = false;

	/**
	 * 创建 ThemeManager 实例
	 * @param options - 配置选项
	 */
	constructor(options: ThemeManagerOptions) {
		this.registry = options.registry;
		this.persistence = options.persistence ?? null;
		this.defaultThemeId = options.defaultTheme ?? DEFAULT_THEME_ID;
		this.currentThemeId = this.defaultThemeId;
		this.transitionDuration = options.transitionDuration ?? 300;
	}

	/**
	 * 获取当前激活的主题 ID
	 * @returns 当前主题 ID
	 * @see Requirements 1.3
	 */
	getCurrentTheme(): string {
		return this.currentThemeId;
	}

	/**
	 * 切换到指定主题
	 * @description
	 * 应用新主题的样式，清理旧主题，并保存偏好
	 * @param themeId - 目标主题 ID
	 * @throws {ThemeSwitcherError} 当主题未找到时
	 * @see Requirements 1.2, 5.1, 5.2
	 */
	async switchTheme(themeId: string): Promise<void> {
		// 检查主题是否存在
		const newTheme = this.registry.get(themeId);
		if (!newTheme) {
			throw new ThemeSwitcherError(`主题 "${themeId}" 未找到`, ThemeErrorCode.THEME_NOT_FOUND);
		}

		// 如果是同一个主题，不做任何操作
		if (themeId === this.currentThemeId) {
			return;
		}

		// 获取当前主题用于清理
		const oldTheme = this.registry.get(this.currentThemeId);

		try {
			// 执行旧主题的清理函数
			if (oldTheme?.cleanup) {
				oldTheme.cleanup();
			}

			// 移除旧主题的样式
			this.removeThemeStyles(this.currentThemeId);

			// 注入新主题的样式
			await this.injectThemeStyles(newTheme);

			// 更新当前主题 ID
			this.currentThemeId = themeId;

			// 保存到持久化存储
			if (this.persistence) {
				this.persistence.save(themeId);
			}

			// 触发主题变更事件
			this.dispatchThemeChangeEvent(themeId, oldTheme?.id);
		} catch (error) {
			throw new ThemeSwitcherError(
				`切换到主题 "${themeId}" 失败`,
				ThemeErrorCode.THEME_LOAD_FAILED,
				error instanceof Error ? error : undefined,
			);
		}
	}

	/**
	 * 获取可用主题列表
	 * @returns 所有可用主题的定义数组
	 */
	getAvailableThemes(): ThemeDefinition[] {
		return this.registry.getAll();
	}

	/**
	 * 初始化主题管理器
	 * @description
	 * 从持久化存储恢复主题偏好，或使用默认主题
	 * @param defaultTheme - 可选的默认主题 ID
	 * @see Requirements 1.4, 1.5
	 */
	initialize(defaultTheme?: string): void {
		if (this.initialized) {
			return;
		}

		// 更新默认主题
		if (defaultTheme) {
			this.defaultThemeId = defaultTheme;
		}

		// 尝试从持久化存储加载主题偏好
		let themeToApply = this.defaultThemeId;

		if (this.persistence) {
			const savedTheme = this.persistence.load();
			if (savedTheme && this.registry.has(savedTheme)) {
				themeToApply = savedTheme;
			} else if (savedTheme) {
				// 保存的主题无效，清除并使用默认主题
				console.warn(`[ThemeManager] 保存的主题 "${savedTheme}" 无效，使用默认主题`);
				this.persistence.clear();
			}
		}

		// 验证要应用的主题是否存在
		if (!this.registry.has(themeToApply)) {
			console.warn(`[ThemeManager] 主题 "${themeToApply}" 不存在，使用第一个可用主题`);
			const availableThemes = this.registry.getAll();
			if (availableThemes.length > 0) {
				themeToApply = availableThemes[0].id;
			} else {
				throw new ThemeSwitcherError("没有可用的主题", ThemeErrorCode.THEME_NOT_FOUND);
			}
		}

		// 设置当前主题
		this.currentThemeId = themeToApply;
		this.initialized = true;
	}

	/**
	 * 注入主题样式
	 * @description
	 * 动态创建 style 元素注入主题样式
	 * @param theme - 主题定义
	 */
	private async injectThemeStyles(theme: ThemeDefinition): Promise<void> {
		if (typeof document === "undefined") {
			return;
		}

		// 添加主题标识类
		document.documentElement.classList.add(`${theme.id}-theme`);

		// 注入 CSS 变量
		if (theme.cssVars) {
			const root = document.documentElement;
			for (const [key, value] of Object.entries(theme.cssVars)) {
				root.style.setProperty(key, value);
			}
		}
	}

	/**
	 * 移除主题样式
	 * @description
	 * 移除指定主题的样式元素
	 * @param themeId - 主题 ID
	 */
	private removeThemeStyles(themeId: string): void {
		if (typeof document === "undefined") {
			return;
		}

		// 移除主题标识类
		document.documentElement.classList.remove(`${themeId}-theme`);

		// 移除该主题的样式元素
		const styleElements = document.querySelectorAll(`[${STYLE_DATA_ATTR}="${themeId}"]`);
		styleElements.forEach((el) => el.remove());
	}

	/**
	 * 触发主题变更事件
	 * @description
	 * 派发自定义事件通知主题变更
	 * @param newThemeId - 新主题 ID
	 * @param oldThemeId - 旧主题 ID
	 */
	private dispatchThemeChangeEvent(newThemeId: string, oldThemeId?: string): void {
		if (typeof window === "undefined") {
			return;
		}

		const event = new CustomEvent("theme-change", {
			detail: {
				newTheme: newThemeId,
				oldTheme: oldThemeId,
			},
		});

		window.dispatchEvent(event);
	}

	/**
	 * 获取主题注册表
	 * @returns 主题注册表实例
	 */
	getRegistry(): IThemeRegistry {
		return this.registry;
	}

	/**
	 * 获取持久化实例
	 * @returns 持久化实例，如果未配置则返回 null
	 */
	getPersistence(): IThemePersistence | null {
		return this.persistence;
	}

	/**
	 * 检查是否已初始化
	 * @returns 是否已初始化
	 */
	isInitialized(): boolean {
		return this.initialized;
	}
}

/**
 * 创建主题管理器实例
 * @description
 * 工厂函数，创建一个新的主题管理器实例
 * @param options - 配置选项
 * @returns 新的 ThemeManager 实例
 */
export function createThemeManager(options: ThemeManagerOptions): ThemeManager {
	return new ThemeManager(options);
}
