// import { defineUserConfig } from "vuepress";
// import theme from "./theme.js";
// export default defineUserConfig({
// 	base: "/",
// 	lang: "zh-CN",
// 	title: "文档演示",
// 	description: "vuepress-theme-hope 的文档演示",
// 	theme,
// });

// import { defineRuanCatVuepressConfig } from "../../src/index.ts";
import { defineRuanCatVuepressConfig } from "@ruan-cat/vuepress-preset-config";
export default defineRuanCatVuepressConfig({
	lang: "zh-CN",
	title: "这里是预设配置的测试文档",
	description: "测试文档",
});
