import {
	setUserConfig,
	setGenerateSidebar,
	addChangelog2doc,
	copyReadmeMd,
} from "@ruan-cat/vitepress-preset-config/config";

copyReadmeMd("./src/docs");

addChangelog2doc({
	target: "./src/docs",
	data: {
		order: 1000,
		dir: {
			order: 1000,
		},
	},
});

const userConfig = setUserConfig({
	title: "Claude Code 通知工具",
	themeConfig: {
		editLink: {
			pattern: "https://github.com/ruan-cat/monorepo/blob/dev/packages/claude-notifier/src/docs/:path",
		},
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/monorepo/tree/dev/packages/claude-notifier",
			},
		],
	},
});

// @ts-ignore
userConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./src/docs",
});
export default userConfig;
