/**
 * 主题切换器组合式函数
 * @description
 * 提供响应式的主题状态管理和切换功能
 * @module theme-switcher/composables/useThemeSwitcher
 * @see Requirements 1.2, 1.4, 5.3
 */

import { ref, computed, readonly, onMounted, onUnmounted } from "vue";
import type { ThemeDefinition, ThemeSwitcherConfig } from "../../types";
import { ThemeManager, createThemeManager } from "../manager";
import { ThemeRegistry, createThemeRegistry } from "../registry";
import { ThemePersistence, createThemePersistence } from "../persistence";
import { createBuiltinRegistry, createFilteredRegistry, DEFAULT_THEME_ID } from "../adapters";

/**
 * 主题切换器组合式函数的返回类型
 */
export interface UseThemeSwitcherReturn {
	/** 当前主题 ID（只读响应式） */
	currentTheme: ReturnType<typeof readonly<ReturnType<typeof ref<string>>>>;
	/** 可用主题列表（只读响应式） */
	availableThemes: ReturnType<typeof readonly<ReturnType<typeof ref<ThemeDefinition[]>>>>;
	/** 当前主题定义（计算属性） */
	currentThemeDefinition: ReturnType<typeof computed<ThemeDefinition | undefined>>;
	/** 是否正在切换主题 */
	isSwitching: ReturnType<typeof readonly<ReturnType<typeof ref<boolean>>>>;
	/** 切换主题 */
	switchTheme: (themeId: string) => Promise<void>;
	/** 初始化主题切换器 */
	initialize: () => void;
	/** 是否已初始化 */
	isInitialized: ReturnType<typeof readonly<ReturnType<typeof ref<boolean>>>>;
}

/**
 * 全局主题管理器实例
 */
let globalManager: ThemeManager | null = null;

/**
 * 全局状态
 */
const globalCurrentTheme = ref<string>(DEFAULT_THEME_ID);
const globalAvailableThemes = ref<ThemeDefinition[]>([]);
const globalIsSwitching = ref(false);
const globalIsInitialized = ref(false);

/**
 * 创建主题切换器
 * @description
 * 根据配置创建主题管理器实例
 * @param config - 主题切换器配置
 */
function createSwitcher(config?: ThemeSwitcherConfig): ThemeManager {
	// 创建注册表
	let registry: ThemeRegistry;

	if (config?.themes && config.themes.length > 0) {
		// 使用过滤后的注册表
		registry = createFilteredRegistry(config.themes);
	} else {
		// 使用包含所有内置主题的注册表
		registry = createBuiltinRegistry();
	}

	// 注册自定义主题
	if (config?.customThemes) {
		for (const theme of config.customThemes) {
			registry.register(theme);
		}
	}

	// 创建持久化实例
	const persistence = createThemePersistence(config?.storageKey);

	// 创建主题管理器
	const manager = createThemeManager({
		registry,
		persistence,
		defaultTheme: config?.defaultTheme ?? DEFAULT_THEME_ID,
	});

	return manager;
}

/**
 * 主题切换器组合式函数
 * @description
 * 提供响应式的主题状态和切换方法
 * @param config - 可选的主题切换器配置
 * @returns 主题切换器状态和方法
 */
export function useThemeSwitcher(config?: ThemeSwitcherConfig): UseThemeSwitcherReturn {
	/**
	 * 当前主题定义
	 */
	const currentThemeDefinition = computed(() => {
		return globalAvailableThemes.value.find((t) => t.id === globalCurrentTheme.value);
	});

	/**
	 * 切换主题
	 * @description
	 * 保存主题偏好到 localStorage 后刷新页面以应用新主题
	 * VitePress 的 Layout 组件在应用启动时确定，需要刷新页面才能切换
	 * @param themeId - 目标主题 ID
	 */
	async function switchTheme(themeId: string): Promise<void> {
		if (!globalManager || globalIsSwitching.value) {
			return;
		}

		// 如果是同一个主题，不做任何操作
		if (themeId === globalCurrentTheme.value) {
			return;
		}

		globalIsSwitching.value = true;

		try {
			// 保存主题偏好到 localStorage
			const persistence = globalManager.getPersistence();
			if (persistence) {
				persistence.save(themeId);
			}

			// 刷新页面以应用新主题
			if (typeof window !== "undefined") {
				window.location.reload();
			}
		} finally {
			globalIsSwitching.value = false;
		}
	}

	/**
	 * 初始化主题切换器
	 */
	function initialize(): void {
		if (globalIsInitialized.value) {
			return;
		}

		// 创建或获取管理器
		if (!globalManager) {
			globalManager = createSwitcher(config);
		}

		// 初始化管理器
		globalManager.initialize(config?.defaultTheme);

		// 更新响应式状态
		globalCurrentTheme.value = globalManager.getCurrentTheme();
		globalAvailableThemes.value = globalManager.getAvailableThemes();
		globalIsInitialized.value = true;
	}

	// 在组件挂载时自动初始化
	onMounted(() => {
		if (!globalIsInitialized.value) {
			initialize();
		}
	});

	// 监听主题变更事件
	function handleThemeChange(event: Event) {
		const customEvent = event as CustomEvent<{ newTheme: string }>;
		if (customEvent.detail?.newTheme) {
			globalCurrentTheme.value = customEvent.detail.newTheme;
		}
	}

	onMounted(() => {
		if (typeof window !== "undefined") {
			window.addEventListener("theme-change", handleThemeChange);
		}
	});

	onUnmounted(() => {
		if (typeof window !== "undefined") {
			window.removeEventListener("theme-change", handleThemeChange);
		}
	});

	return {
		currentTheme: readonly(globalCurrentTheme),
		availableThemes: readonly(globalAvailableThemes),
		currentThemeDefinition,
		isSwitching: readonly(globalIsSwitching),
		switchTheme,
		initialize,
		isInitialized: readonly(globalIsInitialized),
	};
}

/**
 * 重置全局状态
 * @description
 * 主要用于测试，重置所有全局状态
 * @internal
 */
export function resetThemeSwitcherState(): void {
	globalManager = null;
	globalCurrentTheme.value = DEFAULT_THEME_ID;
	globalAvailableThemes.value = [];
	globalIsSwitching.value = false;
	globalIsInitialized.value = false;
}

/**
 * 获取全局主题管理器
 * @description
 * 获取当前的全局主题管理器实例
 * @returns 主题管理器实例，如果未初始化则返回 null
 */
export function getGlobalThemeManager(): ThemeManager | null {
	return globalManager;
}
