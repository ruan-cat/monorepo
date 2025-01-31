import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import theme from "./theme.js";

import { defineRuanCatVuepressConfig } from "@ruan-cat/vuepress-preset-config";
export default defineRuanCatVuepressConfig({
	lang: "zh-CN",
	title: "这里是 monorepo-4",
	description: "monorepo-4 测试项目",
});
