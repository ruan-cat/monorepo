<script setup lang="ts">
/**
 * 自定义布局组件
 * @description
 * 扩展 Teek 主题布局，在导航栏添加主题切换按钮
 */

import Teek from "vitepress-theme-teek";
import ThemeSwitcherNav from "../../../theme-switcher/components/ThemeSwitcherNav.vue";

const { Layout } = Teek;
</script>

<template>
	<Layout>
		<!-- 在导航栏右侧添加主题切换按钮 -->
		<template #nav-bar-content-after>
			<ThemeSwitcherNav button-text="切换主题" />
		</template>

		<!-- 传递所有其他插槽 -->
		<template v-for="(_, name) in $slots" :key="name" #[name]>
			<slot :name="name" />
		</template>
	</Layout>
</template>
