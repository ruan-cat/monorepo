import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import theme from "./theme.js";

// FIXME: 生成类型声明、动态打包生成产物。 先去继续学习组件库内生成类型声明文件。
// import { defineRuanCatVuepressConfig } from "@ruan-cat/vuepress-preset-config/src/index.ts";
import { defineRuanCatVuepressConfig } from "@ruan-cat/vuepress-preset-config";

export default defineRuanCatVuepressConfig({
	lang: "zh-CN",
	title: "这里是 monorepo-4",
	description: "monorepo-4 测试项目",
});

// defineUserConfig({
// 	base: "/",
// 	lang: "zh-CN",
// 	title: "文档演示",
// 	description: "vuepress-theme-hope 的文档演示",
// 	theme,

// 	bundler: viteBundler({
// 		viteOptions: {},
// 		vuePluginOptions: {},
// 	}),
// });
