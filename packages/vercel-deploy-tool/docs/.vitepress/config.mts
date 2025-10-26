import {
	setUserConfig,
	setGenerateSidebar,
	addChangelog2doc,
	copyReadmeMd,
} from "@ruan-cat/vitepress-preset-config/config";

copyReadmeMd("./docs");

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
	title: "阮喵喵的 Vercel 部署工具",
	themeConfig: {
		editLink: {
			pattern: "https://github.com/ruan-cat/monorepo/blob/dev/packages/vercel-deploy-tool/docs/:path",
		},
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/monorepo/tree/main/packages/vercel-deploy-tool",
			},
		],
	},
});

// @ts-ignore
userConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "docs",
});
export default userConfig;
