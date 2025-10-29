// 工具包文档项目 直接导入生成文档配置 避免出现循环依赖
import { setUserConfig, setGenerateSidebar, addChangelog2doc, copyReadmeMd } from "../../../vitepress-preset-config";

import { description } from "../../package.json";

copyReadmeMd("./src");

addChangelog2doc({
	target: "./src",
});

const userConfig = setUserConfig({
	title: "阮喵喵工具包",
	description,
	themeConfig: {
		editLink: {
			pattern: "https://github.com/ruan-cat/monorepo/blob/dev/packages/utils/src/:path",
		},
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/monorepo/tree/main/packages/utils",
			},
		],
	},
});

// @ts-ignore
userConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./src",
});
export default userConfig;
