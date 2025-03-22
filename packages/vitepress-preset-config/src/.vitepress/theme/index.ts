// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme, EnhanceAppContext } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";

import { VitepressDemoBox, VitepressDemoPlaceholder } from "vitepress-demo-plugin";
import "vitepress-demo-plugin/dist/index.css";

import { NolebaseBreadcrumbs } from "@nolebase/vitepress-plugin-breadcrumbs/client";

import {
	NolebaseEnhancedReadabilitiesMenu,
	NolebaseEnhancedReadabilitiesScreenMenu,

	// https://nolebase-integrations.ayaka.io/pages/zh-CN/integrations/vitepress-plugin-enhanced-readabilities/#如何在-vitepress-中进行配置
	InjectionKey,
	type Options,
	LayoutMode,
} from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import "@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css";

import { NolebaseHighlightTargetedHeading } from "@nolebase/vitepress-plugin-highlight-targeted-heading/client";
import "@nolebase/vitepress-plugin-highlight-targeted-heading/client/style.css";

import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client";
import "@nolebase/vitepress-plugin-git-changelog/client/style.css";

import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client";
import "@shikijs/vitepress-twoslash/style.css";

const theme = {
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

		// 全局注册demo展示组件
		app.component("VitepressDemoBox", VitepressDemoBox);
		app.component("VitepressDemoPlaceholder", VitepressDemoPlaceholder);
	},
} satisfies Theme;

export default theme;
