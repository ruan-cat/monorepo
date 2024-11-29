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
	title: "monorepo-1",
	base: "/vp-hope/",
	// dest: `${currPath}/dist`,
	dest: `.vercel/output/static/vp-hope`,
	cache: `${currPath}/.cache`,
	temp: `${currPath}/.temp`,
	public: `${currPath}/public`,
});
