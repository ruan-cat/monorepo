// 避免直接使用自己的包
// import { setUserConfig, setGenerateSidebar, addChangelog2doc } from "@ruan-cat/vitepress-preset-config/config";
// @ts-ignore
import { setUserConfig, setGenerateSidebar, addChangelog2doc } from "../config.mts";
import { description } from "../../package.json";

addChangelog2doc({
	target: "./src",
	data: {
		order: 1000,
	},
});

/**
 * 本文档的渲染配置
 */
const thisDocUserConfig = setUserConfig({
	title: "vitepress预设配置",
	description,
	themeConfig: {
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/vercel-monorepo-test/tree/main/packages/vitepress-preset-config",
			},
		],
	},
});
// @ts-ignore
thisDocUserConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./src",
});
export default thisDocUserConfig;
