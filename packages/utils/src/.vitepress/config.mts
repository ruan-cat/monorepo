// 工具包文档项目 直接导入生成文档配置 避免出现循环依赖
import { setUserConfig, setGenerateSidebar } from "../../../vitepress-preset-config";
import { addChangelog2doc } from "@ruan-cat/utils/node-esm";

import { description } from "../../package.json";

addChangelog2doc({
	target: "./src",
	data: {
		order: 2000,
		dir: {
			order: 2000,
		},
	},
});

const userConfig = setUserConfig({
	title: "阮喵喵工具包",
	description,
	themeConfig: {
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/vercel-monorepo-test/tree/main/packages/domains",
			},
		],
	},
});

// @ts-ignore
userConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "src",
});
export default userConfig;
