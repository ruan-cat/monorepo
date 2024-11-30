import { defineRuanCatVuepressConfig } from "@ruan-cat/vuepress-preset-config";

/**
 * 路径
 * @description
 * 待优化 找到一个方式，实现动态获取当前路径
 */
const currPath = "src/configs/vp-hope";

/**
 * @see https://vuejs.press/zh/reference/config.html#通用配置项
 */

export default defineRuanCatVuepressConfig({
	title: "monorepo-1-vp-hope主题",
	base: "/vp-hope/",
	dest: `dist/vp-hope`,
	cache: `.cache/vp-hope`,
	temp: `.temp/vp-hope`,
	public: `${currPath}/public`,
});
