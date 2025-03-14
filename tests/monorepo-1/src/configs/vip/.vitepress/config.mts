import { setUserConfig, setGenerateSidebar } from "@ruan-cat/vitepress-preset-config/config";

import { moveMdAsHomePage } from "../../../tools/move-md-as-home-page";

const name = "vip";

moveMdAsHomePage({
	homePageMdPath: `./src/configs/${name}/.vitepress/index.md`,
	docsSourcePath: "./docs",
	targetDocsPath: `./.docs/${name}`,
});

const userConfig = setUserConfig({
	title: "monorepo-1-vitepress原版主题",
	description: "vitepress原版主题测试",
	lang: "zh",

	base: `/${name}/`,
	srcDir: `../../../.docs/${name}`,
	outDir: `../../../dist/${name}`,
	cacheDir: `../../../.cache/${name}`,

	themeConfig: {
		i18nRouting: true,

		search: {
			provider: "local",
		},

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
	},
});

// @ts-ignore
userConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "docs",
});
export default userConfig;
