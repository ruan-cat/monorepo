import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import theme from "./theme.js";

export default defineUserConfig({
	base: "/",

	lang: "zh-CN",
	title: "文档演示",
	description: "vuepress-theme-hope 的文档演示",

	// dest: "src/.vuepress/dist/monorepo-3",
	// 现在有专门的命令保证打包文件移动到特定的部署文件夹
	// dest: ".vercel/output/static",

	theme,

	bundler: viteBundler({
		viteOptions: {},
		vuePluginOptions: {},
	}),

	// 和 PWA 一起启用
	// shouldPrefetch: false,
});
