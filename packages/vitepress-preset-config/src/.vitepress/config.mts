import { setUserConfig, setGenerateSidebar, addChangelog2doc } from "@ruan-cat/vitepress-preset-config/config";

addChangelog2doc({
	target: "./src",
	data: {
		order: 1000,
	},
});

/**
 * 本文档的渲染配置
 */
const thisDocUserConfig = setUserConfig();
// @ts-ignore
thisDocUserConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./src",
});
export default thisDocUserConfig;
