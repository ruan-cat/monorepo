<script setup lang="ts">
/**
 * 主题切换器导航栏组件
 * @description
 * 自包含的主题切换器组件，自动获取主题状态
 * 可直接放置在 VitePress 导航栏插槽中使用
 * @see Requirements 1.1, 1.3
 */

import { useThemeSwitcher } from "../composables/useThemeSwitcher";
import ThemeSwitcherButton from "./ThemeSwitcherButton.vue";

/**
 * 组件属性
 */
interface Props {
	/** 按钮文本，默认 '主题' */
	buttonText?: string;
}

const props = withDefaults(defineProps<Props>(), {
	buttonText: "主题",
});

// 使用主题切换器组合式函数
const { currentTheme, availableThemes, switchTheme, isInitialized } = useThemeSwitcher();

/**
 * 处理主题切换
 */
function handleSwitch(themeId: string) {
	switchTheme(themeId);
}
</script>

<template>
	<ThemeSwitcherButton
		v-if="isInitialized && availableThemes.length > 1"
		:current-theme="currentTheme"
		:themes="availableThemes"
		:button-text="props.buttonText"
		@switch="handleSwitch"
	/>
</template>
