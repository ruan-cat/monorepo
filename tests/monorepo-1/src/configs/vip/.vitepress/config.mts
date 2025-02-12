import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitepress";
import { GitChangelog, GitChangelogMarkdownSection } from "@nolebase/vitepress-plugin-git-changelog/vite";

import { generateSidebar } from "vitepress-sidebar";

import { moveMdAsHomePage } from "../../../tools/move-md-as-home-page";

const name = "vip";

moveMdAsHomePage({
	homePageMdPath: `./src/configs/${name}/.vitepress/index.md`,
	docsSourcePath: "./docs",
	targetDocsPath: `./.docs/${name}`,
});

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "monorepo-1-vitepress原版主题",
	description: "vitepress原版主题测试",
	lang: "zh",

	base: `/${name}/`,
	srcDir: `../../../.docs/${name}`,
	outDir: `../../../dist/${name}`,
	cacheDir: `../../../.cache/${name}`,

	vite: {
		server: {
			open: true,
		},

		plugins: [
			GitChangelog({
				// 填写在此处填写您的仓库链接
				repoURL: () => "https://github.com/nolebase/integrations",
			}),
			GitChangelogMarkdownSection(),
		],

		optimizeDeps: {
			exclude: [
				"@nolebase/vitepress-plugin-breadcrumbs/client",
				"@nolebase/vitepress-plugin-enhanced-readabilities/client",
				"vitepress",
				"@nolebase/ui",
			],
		},

		ssr: {
			noExternal: [
				// 如果还有别的依赖需要添加的话，并排填写和配置到这里即可
				"@nolebase/vitepress-plugin-breadcrumbs",

				"@nolebase/vitepress-plugin-enhanced-readabilities",
				"@nolebase/ui",

				"@nolebase/vitepress-plugin-highlight-targeted-heading",
			],
		},
	},

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
