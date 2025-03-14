import { setUserConfig, setGenerateSidebar, addChangelog2doc } from "@ruan-cat/vitepress-preset-config/config";

addChangelog2doc({
	target: "./docs",
	data: {
		order: 1000,
		dir: {
			order: 1000,
		},
	},
});

const userConfig = setUserConfig({
	title: "阮喵喵域名文档",
	themeConfig: {
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/vercel-monorepo-test/blob/dev/tests/monorepo-1/docs/index.md",
			},
		],
		nav: [
			{ text: "首页", link: "/" },
			// {
			// 	text: "仓库地址",
			// 	link: "https://github.com/ruan-cat/vercel-monorepo-test/blob/dev/tests/monorepo-1/docs/index.md",
			// },
		],
	},
});

// @ts-ignore
userConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "docs",
});
export default userConfig;
