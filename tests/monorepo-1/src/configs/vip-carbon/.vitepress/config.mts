import { defineConfig } from "vitepress";
import baseConfig from "vitepress-carbon/config";
import { generateSidebar } from "vitepress-sidebar";

import { moveMdAsHomePage } from "../../../tools/move-md-as-home-page.ts";

const name = "vip-carbon";

moveMdAsHomePage({
	homePageMdPath: `./src/configs/${name}/.vitepress/index.md`,
	docsSourcePath: "./docs",
	targetDocsPath: `./.docs/${name}`,
});

/**
 * @see https://github.com/brenoepics/vitepress-carbon
 * @see https://carbon.breno.tech/guide/configuration
 */
export default defineConfig({
	title: "vitepress-carbon主题",
	description: "vitepress-carbon主题",
	lang: "zh",

	base: `/${name}/`,
	srcDir: `../../../.docs/${name}`,
	outDir: `../../../dist/${name}`,
	cacheDir: `../../../.cache/${name}`,

	extends: baseConfig,
	themeConfig: {
		i18nRouting: true,

		editLink: {
			pattern: "https://github.com/ruan-cat/monorepo/blob/dev/tests/monorepo-1/docs/:path",
		},

		sidebar: generateSidebar({
			documentRootPath: "./docs",
			collapsed: true,
		}),
	},
});
