import { setUserConfig, setGenerateSidebar } from "@ruan-cat/vitepress-preset-config/config";

/**
 * 本文档的渲染配置
 */
const thisDocUserConfig = setUserConfig();
// @ts-ignore
thisDocUserConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./src",
});
export default thisDocUserConfig;
