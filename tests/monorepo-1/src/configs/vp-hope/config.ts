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

const name = "vp-hope";

export default defineRuanCatVuepressConfig({
	title: "monorepo-1-vp-hope主题",
	base: `/${name}/`,
	dest: `dist/${name}`,
	cache: `.cache/${name}`,
	temp: `.temp/${name}`,
	public: `${currPath}/public`,
});
