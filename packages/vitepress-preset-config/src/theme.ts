// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme, EnhanceAppContext } from "vitepress";
import DefaultTheme from "vitepress/theme";

// 将全部的样式集中在专门的文件内 在tsup内被打包出去
import "./index.css";

// 警告 放弃内部处理该库 直接使用peer对等依赖 不再考虑包装封装该库
// import { VitepressDemoBox, VitepressDemoPlaceholder } from "@ruan-cat/vitepress-demo-plugin";
// import "@ruan-cat/vitepress-demo-plugin/dist/index.css";

import { NolebaseBreadcrumbs } from "@nolebase/vitepress-plugin-breadcrumbs/client";

import {
	NolebaseEnhancedReadabilitiesMenu,
	NolebaseEnhancedReadabilitiesScreenMenu,

	// https://nolebase-integrations.ayaka.io/pages/zh-CN/integrations/vitepress-plugin-enhanced-readabilities/#如何在-vitepress-中进行配置
	InjectionKey,
	type Options,
	LayoutMode,
} from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
// import "@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css";

import { NolebaseHighlightTargetedHeading } from "@nolebase/vitepress-plugin-highlight-targeted-heading/client";
// import "@nolebase/vitepress-plugin-highlight-targeted-heading/client/style.css";

import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client";
// import "@nolebase/vitepress-plugin-git-changelog/client/style.css";

import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client";
// import "@shikijs/vitepress-twoslash/style.css";

/**
 * 一个回调函数 用来暴露变量 实现注册\
 * @deprecated
 */
export interface EnhanceAppCallBack {
	({ app, router, siteData }: EnhanceAppContext): void;
}

/**
 * @deprecated
 */
export interface DefineRuancatPresetThemeParams {
	enhanceAppCallBack?: EnhanceAppCallBack;
}

/**
 * 定义默认主题预设
 * @deprecated
 */
export function defineRuancatPresetTheme(params?: DefineRuancatPresetThemeParams) {
	return {
		extends: DefaultTheme,
		Layout: () => {
			return h(DefaultTheme.Layout, null, {
				// https://vitepress.dev/guide/extending-default-theme#layout-slots
				"doc-before": () => h(NolebaseBreadcrumbs),
				"nav-bar-content-after": () => h(NolebaseEnhancedReadabilitiesMenu),
				// 为较窄的屏幕（通常是小于 iPad Mini）添加阅读增强菜单
				"nav-screen-content-after": () => h(NolebaseEnhancedReadabilitiesScreenMenu),
				"layout-top": () => [h(NolebaseHighlightTargetedHeading)],
			});
		},
		enhanceApp({ app, router, siteData }: EnhanceAppContext) {
			app.use(NolebaseGitChangelogPlugin);
			app.use(TwoslashFloatingVue);
			app.provide(InjectionKey, {
				layoutSwitch: {
					defaultMode: LayoutMode["BothWidthAdjustable"],
					pageLayoutMaxWidth: {
						defaultMaxWidth: 85,
					},
					contentLayoutMaxWidth: {
						defaultMaxWidth: 95,
					},
				},
			} as Options);

			/**
			 * 放弃全局注册demo展示组件
			 * 在生产环境内使用peer对等依赖
			 */
			// app.component("VitepressDemoBox", VitepressDemoBox);
			// app.component("VitepressDemoPlaceholder", VitepressDemoPlaceholder);

			params?.enhanceAppCallBack?.({ app, router, siteData });
		},
	} satisfies Theme;
}

/** 默认布局配置 */
const defaultLayoutConfig = {
	// https://vitepress.dev/guide/extending-default-theme#layout-slots
	"doc-before": () => h(NolebaseBreadcrumbs),
	"nav-bar-content-after": () => h(NolebaseEnhancedReadabilitiesMenu),
	// 为较窄的屏幕（通常是小于 iPad Mini）添加阅读增强菜单
	"nav-screen-content-after": () => h(NolebaseEnhancedReadabilitiesScreenMenu),
	"layout-top": () => [h(NolebaseHighlightTargetedHeading)],
};

/** 默认 enhanceApp 预设 */
export function defaultEnhanceAppPreset({ app, router, siteData }: EnhanceAppContext) {
	app.use(NolebaseGitChangelogPlugin);
	app.use(TwoslashFloatingVue);
	app.provide(InjectionKey, {
		layoutSwitch: {
			defaultMode: LayoutMode["BothWidthAdjustable"],
			pageLayoutMaxWidth: {
				defaultMaxWidth: 85,
			},
			contentLayoutMaxWidth: {
				defaultMaxWidth: 95,
			},
		},
	} as Options);
}

/** 默认主题配置 */
export const defaultTheme = {
	extends: DefaultTheme,
	Layout: () => {
		return h(DefaultTheme.Layout, null, defaultLayoutConfig);
	},
	enhanceApp({ app, router, siteData }: EnhanceAppContext) {
		defaultEnhanceAppPreset({ app, router, siteData });
		/**
		 * 放弃全局注册demo展示组件
		 * 在生产环境内使用peer对等依赖
		 */
		// app.component("VitepressDemoBox", VitepressDemoBox);
		// app.component("VitepressDemoPlaceholder", VitepressDemoPlaceholder);
	},
} satisfies Theme;
