<script setup lang="ts">
/**
 * 主题切换器布局组件
 * @description
 * 包装 VitePress 默认布局，在导航栏添加主题切换按钮
 * @see Requirements 1.1
 */

import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";
import ThemeSwitcherNav from "./ThemeSwitcherNav.vue";

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

const { Layout } = DefaultTheme;
</script>

<template>
	<Layout>
		<!-- 在导航栏右侧添加主题切换按钮 -->
		<template #nav-bar-content-after>
			<ThemeSwitcherNav :button-text="props.buttonText" />
		</template>

		<!-- 传递所有其他插槽 -->
		<template v-for="(_, name) in $slots" :key="name" #[name]>
			<slot :name="name" />
		</template>
	</Layout>
</template>
