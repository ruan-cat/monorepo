import { defineConfig } from "vitepress";
import baseConfig from "vitepress-carbon/config";
import { generateSidebar } from "vitepress-sidebar";

const name = "vip-carbon";

/**
 * @see https://github.com/brenoepics/vitepress-carbon
 * @see https://carbon.breno.tech/guide/configuration
 */
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

		sidebar: generateSidebar({
			documentRootPath: "docs",
			collapsed: true,
		}),
	},
});
