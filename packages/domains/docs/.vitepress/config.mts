import {
	setUserConfig,
	setGenerateSidebar,
	addChangelog2doc,
	copyReadmeMd,
} from "@ruan-cat/vitepress-preset-config/config";

import { projects } from "../../src/types";

import { printFormat } from "@ruan-cat/utils";
import consola from "consola";

copyReadmeMd("./docs");

addChangelog2doc({
	target: "./docs",
});

const userConfig = setUserConfig(
	{
		title: "阮喵喵域名文档",
		themeConfig: {
			editLink: {
				pattern: "https://github.com/ruan-cat/monorepo/blob/dev/packages/domains/docs/:path",
			},
			socialLinks: [
				{
					icon: "github",
					link: "https://github.com/ruan-cat/monorepo/tree/main/packages/domains",
				},
			],
		},
	},

	{
		plugins: {
			llmstxt: {
				ignoreFiles: ["domain/**"],
			},
		},

		/**
		 * 不应该使用该配置
		 * 自动化侧边栏的效果很难看
		 */
		// teekConfig: {
		// 	vitePlugins: {
		// 		sidebarOption: {
		// 			/**
		// 			 * 修改侧边栏生成类型
		// 			 * 使得侧边栏可以识别出来
		// 			 */
		// 			type: "array",
		// 		},
		// 	},
		// },
	},
);

/** 动态域名的侧边栏 手写手动实现 */
const sidebarDomain = [
	{
		text: "域名集",
		collapsed: true,
		// 生成形如 { text: "09oa", link: "/domain/09oa" }, 格式的数组
		items: projects.map((project) => {
			// 目录在 /domain/ 下
			return { text: project.name, link: `/domain/${project.name}` };
		}),
	},
];

/** 自动生成的侧边栏 */
const sidebarAuto = setGenerateSidebar({
	documentRootPath: "./docs",
	excludeFilesByFrontmatterFieldName: "exclude",
	excludeByGlobPattern: ["domain/**"],
});

// @ts-ignore 合并侧边栏 先展示域名列表 再展示自动生成的侧边栏
userConfig.themeConfig.sidebar = sidebarDomain.concat(sidebarAuto);

consola.log(printFormat(userConfig?.themeConfig?.sidebar));

export default userConfig;
