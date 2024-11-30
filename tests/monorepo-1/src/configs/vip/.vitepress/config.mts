import { defineConfig } from "vitepress";
import { generateSidebar } from "vitepress-sidebar";

const name = "vip";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "monorepo-1-vitepress原版主题",
	description: "vitepress原版主题测试",
	lang: "zh",

	base: `/${name}/`,
	srcDir: "../../../docs",
	outDir: `../../../dist/${name}`,
	cacheDir: `../../../.cache/${name}`,

	themeConfig: {
		i18nRouting: true,

		outline: {
			label: "本页目录",
			level: "deep",
		},

		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/vercel-monorepo-test/blob/dev/tests/monorepo-1/docs/index.md",
			},
		],

		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "首页", link: "/" },
			{
				text: "仓库地址",
				link: "https://github.com/ruan-cat/vercel-monorepo-test/blob/dev/tests/monorepo-1/docs/index.md",
			},
		],

		sidebar: generateSidebar({
			documentRootPath: "docs",
			collapsed: true,
		}),
	},
});
