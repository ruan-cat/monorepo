// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme, EnhanceAppContext } from "vitepress";
import DefaultTheme from "vitepress/theme";

/**
 * 警告 将全部的样式集中在专门的文件内 在tsup内被打包出去
 * 不再对外提供专门的样式
 */
// import "./index.css";

// 警告 放弃内部处理该库 直接使用peer对等依赖 不再考虑包装封装该库
// import { VitepressDemoBox, VitepressDemoPlaceholder } from "@ruan-cat/vitepress-demo-plugin";
// import "@ruan-cat/vitepress-demo-plugin/dist/index.css";

import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client";
import "@nolebase/vitepress-plugin-git-changelog/client/style.css";

import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client";
import "@shikijs/vitepress-twoslash/style.css";

// https://vp.teek.top/guide/quickstart.html#teek-引入
import Teek from "vitepress-theme-teek";
import "vitepress-theme-teek/index.css";

/**
 * 一个回调函数 用来暴露变量 实现注册
 */
export interface EnhanceAppCallBack {
	({ app, router, siteData }: EnhanceAppContext): void;
}

/**
 */
export interface DefineRuancatPresetThemeParams {
	enhanceAppCallBack?: EnhanceAppCallBack;
}

/**
 * 默认 enhanceApp 预设
 * @description
 * 这个函数预期应该作为一个内部函数 不应该对外暴露使用
 * @private
 */
function defaultEnhanceAppPreset({ app, router, siteData }: EnhanceAppContext) {
	app.use(NolebaseGitChangelogPlugin);
	app.use(TwoslashFloatingVue);
	/**
	 * 放弃全局注册demo展示组件
	 * 在生产环境内使用peer对等依赖
	 */
	// app.component("VitepressDemoBox", VitepressDemoBox);
	// app.component("VitepressDemoPlaceholder", VitepressDemoPlaceholder);
}

/** 简单主题 尝试避免复杂的使用 */
export const smipleTheme = {
	extends: Teek,
	enhanceApp({ app, router, siteData }: EnhanceAppContext) {
		app.use(NolebaseGitChangelogPlugin);
		app.use(TwoslashFloatingVue);
	},
} satisfies Theme;

/** 默认主题配置 */
export const defaultTheme = {
	// extends: DefaultTheme,
	// TODO: 正在应用 teek 主题 需要进行测试
	extends: Teek,
	// Layout: () => {
	// 	return h(
	// 		// DefaultTheme.Layout
	// 		// TODO: 正在应用 teek 主题 需要进行测试
	// 		Teek.Layout,
	// 		null,
	// 	);
	// },
	Layout: Teek.Layout,
	enhanceApp({ app, router, siteData }: EnhanceAppContext) {
		defaultEnhanceAppPreset({ app, router, siteData });
	},
} satisfies Theme;

/**
 * 定义默认主题预设
 */
export function defineRuancatPresetTheme(params?: DefineRuancatPresetThemeParams) {
	return {
		...defaultTheme,
		enhanceApp({ app, router, siteData }: EnhanceAppContext) {
			// 回调默认主题内的函数
			defaultTheme.enhanceApp({ app, router, siteData });
			// 执行用户传入的回调函数
			params?.enhanceAppCallBack?.({ app, router, siteData });
		},
		// setup() {},
	} satisfies Theme;
}
