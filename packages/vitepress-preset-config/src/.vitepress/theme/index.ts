// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";

// 全局导入element-plus组件 并全局注册
import elementplus from "element-plus";
import "element-plus/dist/index.css";

// import "./assets/main.css";
// import "./assets/iconfont/iconfont.css";
// import "../../assets/main.css";
// import "../../assets/iconfont/iconfont.css";

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

export default {
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
	enhanceApp({ app, router, siteData }) {
		// ...
		app.use(NolebaseGitChangelogPlugin);

		app.use(elementplus);

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
	},
} satisfies Theme;
