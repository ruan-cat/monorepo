import llmstxt from "vitepress-plugin-llms";
import { GitChangelog, type GitChangelogMarkdownSectionOptions } from "@nolebase/vitepress-plugin-git-changelog/vite";
import type { Theme } from "vitepress";

// https://vp.teek.top/guide/quickstart.html#teek-引入
import { defineTeekConfig } from "vitepress-theme-teek/config";

export type LlmstxtSettings = NonNullable<Parameters<typeof llmstxt>[0]>;

export type GitChangelogOptions = NonNullable<Parameters<typeof GitChangelog>[0]>;

export type TeekConfigOptions = NonNullable<Parameters<typeof defineTeekConfig>[0]>;

// ============================================================================
// 主题切换器类型定义
// ============================================================================

/**
 * 主题定义接口
 * @description
 * 定义一个可注册到主题注册表的主题配置对象
 */
export interface ThemeDefinition {
	/** 主题唯一标识符 */
	id: string;
	/** 主题显示名称 */
	name: string;
	/** 主题描述 */
	description?: string;
	/** 主题图标（可选，用于 UI 显示） */
	icon?: string;
	/** VitePress Theme 对象 */
	theme: Theme;
	/** 主题样式文件路径列表（用于静态导入参考） */
	styles?: string[];
	/** 主题特定的 CSS 变量 */
	cssVars?: Record<string, string>;
	/** 主题清理函数（切换离开时调用） */
	cleanup?: () => void;
	/**
	 * 样式标识符
	 * @description
	 * 用于标记和移除动态注入的样式元素
	 */
	styleId?: string;
	/**
	 * 动态加载样式的方法
	 * @description
	 * 通过动态 import() 加载主题 CSS，并将样式注入到 DOM
	 * 返回 Promise，加载完成后 resolve
	 */
	loadStyles?: () => Promise<void>;
	/**
	 * 卸载样式的方法
	 * @description
	 * 从 DOM 中移除该主题注入的所有样式元素
	 */
	unloadStyles?: () => void;
}

/**
 * 主题注册表接口
 * @description
 * 管理所有可用主题的注册和查询
 */
export interface IThemeRegistry {
	/** 注册主题 */
	register(theme: ThemeDefinition): void;
	/** 获取主题 */
	get(id: string): ThemeDefinition | undefined;
	/** 获取所有主题 */
	getAll(): ThemeDefinition[];
	/** 检查主题是否存在 */
	has(id: string): boolean;
	/** 获取主题数量 */
	size(): number;
}

/**
 * 主题管理器接口
 * @description
 * 负责主题切换的核心逻辑
 */
export interface IThemeManager {
	/** 获取当前激活的主题 ID */
	getCurrentTheme(): string;
	/** 切换到指定主题 */
	switchTheme(themeId: string): Promise<void>;
	/** 获取可用主题列表 */
	getAvailableThemes(): ThemeDefinition[];
	/** 初始化主题管理器 */
	initialize(defaultTheme?: string): void;
}

/**
 * 主题持久化接口
 * @description
 * 负责主题偏好的存储和恢复
 */
export interface IThemePersistence {
	/** 保存主题偏好 */
	save(themeId: string): void;
	/** 加载主题偏好 */
	load(): string | null;
	/** 清除主题偏好 */
	clear(): void;
}

/**
 * 主题切换器配置接口
 * @description
 * 用于配置主题切换器的行为
 */
export interface ThemeSwitcherConfig {
	/** 是否启用主题切换器，默认 false */
	enabled?: boolean;
	/** 默认主题 ID，默认 'teek' */
	defaultTheme?: string;
	/** 可用主题列表，为空则使用所有内置主题 */
	themes?: string[];
	/** 持久化存储的 key，默认 'vitepress-theme' */
	storageKey?: string;
	/** 自定义主题定义 */
	customThemes?: ThemeDefinition[];
	/** 切换按钮的位置，默认 'nav' */
	buttonPosition?: "nav" | "sidebar";
	/** 切换按钮的文本，默认 '主题' */
	buttonText?: string;
}

/**
 * 主题切换器错误码
 */
export enum ThemeErrorCode {
	THEME_NOT_FOUND = "THEME_NOT_FOUND",
	THEME_LOAD_FAILED = "THEME_LOAD_FAILED",
	STYLE_INJECTION_FAILED = "STYLE_INJECTION_FAILED",
	PERSISTENCE_FAILED = "PERSISTENCE_FAILED",
	INVALID_CONFIGURATION = "INVALID_CONFIGURATION",
}

/**
 * 主题切换器错误类
 */
export class ThemeSwitcherError extends Error {
	constructor(
		message: string,
		public code: ThemeErrorCode,
		public cause?: Error,
	) {
		super(message);
		this.name = "ThemeSwitcherError";
	}
}

/**
 * 额外的配置
 * @description
 * 目前主要用于精细化配置 vitepress 的插件
 */
export interface ExtraConfig {
	/**
	 * 即 vite 的 plugins
	 * @description
	 * vitepress 配置的一系列插件
	 */
	plugins?: {
		/**
		 * @description 用于配置 vitepress-plugin-llms 插件
		 * @see https://github.com/okineadev/vitepress-plugin-llms
		 */
		llmstxt?: LlmstxtSettings | false;

		/**
		 * @description 用于配置 @nolebase/vitepress-plugin-git-changelog 插件
		 * @see
		 */
		gitChangelog?: GitChangelogOptions | false;

		/**
		 * @description 用于配置 @nolebase/vitepress-plugin-git-changelog-markdown-section 插件
		 * @see
		 */
		gitChangelogMarkdownSection?: GitChangelogMarkdownSectionOptions | false;
	};

	/**
	 * Teek 主题配置
	 * @see https://vp.teek.top/reference/config.html
	 */
	teekConfig?: TeekConfigOptions;

	/**
	 * 主题切换器配置
	 * @description
	 * 用于配置运行时主题切换功能
	 * @see Requirements 4.1
	 */
	themeSwitcher?: ThemeSwitcherConfig;
}
