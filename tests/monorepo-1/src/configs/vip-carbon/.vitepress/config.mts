import { defineConfig } from "vitepress";
import baseConfig from "vitepress-carbon/config";

const name = "vip-carbon";

export default defineConfig({
	title: "vitepress-carbon主题",
	description: "vitepress-carbon主题",
	lang: "zh",

	base: `/${name}/`,
	srcDir: "../../../docs",
	outDir: `../../../dist/${name}`,
	cacheDir: `../../../.cache/${name}`,

	extends: baseConfig,
	themeConfig: {
		i18nRouting: true,
	},
});
