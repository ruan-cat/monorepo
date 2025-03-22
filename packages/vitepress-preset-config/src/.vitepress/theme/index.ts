// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme, EnhanceAppContext } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { defaultLayoutConfig, defaultEnhanceAppPreset } from "@ruan-cat/vitepress-preset-config/theme";

// 导入全部的主题样式
import "@ruan-cat/vitepress-preset-config/theme.css";
import "./style.css";
export default {
	extends: DefaultTheme,
	Layout: () => {
		return h(DefaultTheme.Layout, null, defaultLayoutConfig);
	},
	enhanceApp({ app, router, siteData }: EnhanceAppContext) {
		defaultEnhanceAppPreset({ app, router, siteData });
	},
} satisfies Theme;
