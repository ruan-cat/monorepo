// 避免直接使用自己的包
// import { setUserConfig, setGenerateSidebar, addChangelog2doc } from "@ruan-cat/vitepress-preset-config/config";
// @ts-ignore
import { setUserConfig, setGenerateSidebar, addChangelog2doc } from "../../src/config.mts";

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
