import { setUserConfig, setGenerateSidebar } from "@ruan-cat/vitepress-preset-config/config";

const userConfig = setUserConfig({
	title: "阮喵喵的01星球笔记",
	description: "阮喵喵在01星球内的一些公用文档",
	lang: "zh",
	themeConfig: {
		nav: [
			{ text: "首页", link: "/" },
			{ text: "仓库地址", link: "https://github.com/ruan-cat/vercel-monorepo-test/tree/dev/packages/docs-01-star" },
		],
		outline: {
			label: "本页目录",
			level: "deep",
		},
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/vercel-monorepo-test/blob/dev/packages/docs-01-star/docs/index.md",
			},
		],
	},
});
// @ts-ignore
userConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./docs",
});
export default userConfig;
