import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { merge } from "lodash-es";

import { defineRuanCatVuepressConfig, ruancatHopeThemeConfig, hopeTheme } from "@ruan-cat/vuepress-preset-config";
import type { ThemeOptions } from "@ruan-cat/vuepress-preset-config";

/**
 * 路径
 * @description
 * 待优化 找到一个方式，实现动态获取当前路径
 */
const currPath = "src/configs/vuepress-hope/.vuepress";

export default defineRuanCatVuepressConfig({
	title: "monorepo-1",
	dest: `${currPath}/dist`,
	cache: `${currPath}/.cache`,
	temp: `${currPath}/.temp`,
	public: `${currPath}/public`,
	theme: hopeTheme(merge<ThemeOptions, ThemeOptions, ThemeOptions>({}, ruancatHopeThemeConfig, {}), {
		custom: true,
		debug: false,
	}),
});
