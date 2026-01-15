<script setup lang="ts">
/**
 * 动态主题布局组件
 * @description
 * 根据 localStorage 中保存的主题偏好动态选择对应的 Layout 组件
 * 支持在 Teek 和 VoidZero 主题之间切换
 */

import { ref, onMounted, markRaw, type Component } from "vue";
import { DEFAULT_STORAGE_KEY } from "../persistence";
import { DEFAULT_THEME_ID } from "../adapters";
import ThemeSwitcherNav from "./ThemeSwitcherNav.vue";

/**
 * 组件属性
 */
interface Props {
	/** 按钮文本，默认 '切换主题' */
	buttonText?: string;
	/** 存储键名 */
	storageKey?: string;
	/** 默认主题 ID */
	defaultTheme?: string;
}

const props = withDefaults(defineProps<Props>(), {
	buttonText: "切换主题",
	storageKey: DEFAULT_STORAGE_KEY,
	defaultTheme: DEFAULT_THEME_ID,
});

/** 当前主题 ID */
const currentThemeId = ref<string>(props.defaultTheme);

/** 当前 Layout 组件 */
const CurrentLayout = ref<Component | null>(null);

/** 是否已加载 */
const isLoaded = ref(false);

/**
 * 从 localStorage 获取保存的主题 ID
 */
function getSavedThemeId(): string {
	if (typeof window === "undefined" || !window.localStorage) {
		return props.defaultTheme;
	}

	try {
		const stored = window.localStorage.getItem(props.storageKey);
		if (!stored) {
			return props.defaultTheme;
		}

		const data = JSON.parse(stored);
		if (data && typeof data.themeId === "string") {
			return data.themeId;
		}
	} catch {
		// 忽略解析错误
	}

	return props.defaultTheme;
}

/**
 * 根据主题 ID 加载对应的 Layout 组件和样式
 */
async function loadLayout(themeId: string): Promise<Component> {
	// 添加主题标识类到 html 元素
	if (typeof document !== "undefined") {
		document.documentElement.setAttribute("data-theme", themeId);
	}

	switch (themeId) {
		case "voidzero": {
			// 动态导入 VoidZero 主题样式
			// VoidZero 主题的样式在 src/styles/index.css
			// @ts-ignore - 样式模块没有类型声明
			await import("@voidzero-dev/vitepress-theme/src/styles/index.css");
			// 动态导入 VoidZero 主题
			const VoidZeroTheme = await import("@voidzero-dev/vitepress-theme");
			// @ts-ignore - 类型定义可能不完整
			return VoidZeroTheme.default?.Layout || VoidZeroTheme.default;
		}
		case "teek":
		default: {
			// 动态导入 Teek 主题样式
			await import("vitepress-theme-teek/index.css");
			// 样式增强
			await Promise.all([
				import("vitepress-theme-teek/theme-chalk/tk-doc-h1-gradient.css"),
				import("vitepress-theme-teek/theme-chalk/tk-nav-blur.css"),
				import("vitepress-theme-teek/theme-chalk/tk-scrollbar.css"),
				import("vitepress-theme-teek/theme-chalk/tk-sidebar.css"),
				import("vitepress-theme-teek/theme-chalk/tk-aside.css"),
				import("vitepress-theme-teek/theme-chalk/tk-fade-up-animation.css"),
			]);
			// 动态导入 Teek 主题
			const TeekTheme = await import("vitepress-theme-teek");
			// Teek 主题的 Layout 在 default.Layout 中
			return TeekTheme.default?.Layout || TeekTheme.default;
		}
	}
}

onMounted(async () => {
	// 获取保存的主题 ID
	currentThemeId.value = getSavedThemeId();

	// 加载对应的 Layout 组件
	try {
		const layout = await loadLayout(currentThemeId.value);
		CurrentLayout.value = markRaw(layout);
	} catch (error) {
		console.error("[DynamicLayout] 加载主题 Layout 失败:", error);
		// 回退到 Teek 主题
		try {
			await import("vitepress-theme-teek/index.css");
			const TeekTheme = await import("vitepress-theme-teek");
			// @ts-ignore - 类型定义可能不完整
			CurrentLayout.value = markRaw(TeekTheme.default?.Layout || TeekTheme.default);
		} catch (fallbackError) {
			console.error("[DynamicLayout] 回退加载也失败:", fallbackError);
		}
	}

	isLoaded.value = true;
});
</script>

<template>
	<component :is="CurrentLayout" v-if="isLoaded && CurrentLayout">
		<!-- 在导航栏右侧添加主题切换按钮 -->
		<template #nav-bar-content-after>
			<ThemeSwitcherNav :button-text="buttonText" />
		</template>

		<!-- 传递所有其他插槽 -->
		<template v-for="(_, name) in $slots" :key="name" #[name]>
			<slot :name="name" />
		</template>
	</component>

	<!-- 加载中状态 -->
	<div v-else class="dynamic-layout-loading">
		<div class="loading-spinner"></div>
	</div>
</template>

<style scoped>
.dynamic-layout-loading {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	background: var(--vp-c-bg, #fff);
}

.loading-spinner {
	width: 40px;
	height: 40px;
	border: 3px solid var(--vp-c-divider, #e2e2e3);
	border-top-color: var(--vp-c-brand-1, #646cff);
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
