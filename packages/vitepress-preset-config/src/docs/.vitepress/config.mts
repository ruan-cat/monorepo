// 避免直接使用自己的包
// import { setUserConfig, setGenerateSidebar, addChangelog2doc } from "@ruan-cat/vitepress-preset-config/config";
// @ts-ignore
import { setUserConfig, setGenerateSidebar, addChangelog2doc } from "../../config.mts";
import { description } from "../../../package.json";

addChangelog2doc({
	target: "./src/docs",
});

/**
 * 本文档的渲染配置
 * @description
 * 启用主题切换器功能，支持在 Teek 和 VoidZero 主题之间切换
 */
const thisDocUserConfig = setUserConfig(
	{
		title: "vitepress预设配置",
		description,
		themeConfig: {
			socialLinks: [
				{
					icon: "github",
					link: "https://github.com/ruan-cat/monorepo/tree/dev/packages/vitepress-preset-config",
				},
			],
			editLink: {
				pattern: "https://github.com/ruan-cat/monorepo/blob/dev/packages/vitepress-preset-config/src/docs/:path",
			},
		},
	},
	{
		// 启用主题切换器
		themeSwitcher: {
			enabled: true,
			defaultTheme: "teek",
			buttonText: "主题",
		},
	},
);

// @ts-ignore
thisDocUserConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./src/docs",
});

export default thisDocUserConfig;
