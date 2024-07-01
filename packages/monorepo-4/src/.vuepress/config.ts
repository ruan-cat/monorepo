import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import theme from "./theme.js";

// FIXME: 生成类型声明、动态打包生成产物。 先去继续学习组件库内生成类型声明文件。
import { defineRuanCatVuepressConfig } from "@ruan-cat-vercel-monorepo-test/vuepress-preset-config";

export default defineUserConfig({
	base: "/",

	lang: "zh-CN",
	title: "文档演示",
	description: "vuepress-theme-hope 的文档演示",

	theme,

	bundler: viteBundler({
		viteOptions: {},
		vuePluginOptions: {},
	}),

	// 和 PWA 一起启用
	// shouldPrefetch: false,
});
