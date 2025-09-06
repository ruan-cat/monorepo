import {
	setUserConfig,
	setGenerateSidebar,
	addChangelog2doc,
	copyReadmeMd,
} from "@ruan-cat/vitepress-preset-config/config";

import { printFormat } from "@ruan-cat/utils";

// TODO:
import { merge } from "lodash-es";

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

const userConfig = setUserConfig(
	{
		title: "阮喵喵域名文档",
		themeConfig: {
			socialLinks: [
				{
					icon: "github",
					link: "https://github.com/ruan-cat/monorepo/tree/main/packages/domains",
				},
			],

			// TODO: 更改成动态的代码写法
			// sidebar: [
			// 	{
			// 		text: "动态域名测试Domain",
			// 		items: [
			// 			{ text: "全部 index Domain", link: "/domain" },
			// 			{ text: "09oa", link: "/domain/09oa" },
			// 			{ text: "10wms", link: "/domain/10wms" },
			// 			{ text: "10wms-doc", link: "/domain/10wms-doc" },
			// 			{ text: "11comm", link: "/domain/11comm" },
			// 			{ text: "11comm-doc", link: "/domain/11comm-doc" },
			// 			{ text: "01s-doc", link: "/domain/01s-doc" },
			// 			{ text: "utils", link: "/domain/utils" },
			// 			{ text: "vitepress-preset", link: "/domain/vitepress-preset" },
			// 			{ text: "domain", link: "/domain/domain" },
			// 			{ text: "vercel-deploy-tool", link: "/domain/vercel-deploy-tool" },
			// 		],
			// 	},
			// ],
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

// TODO: 更改成动态的代码写法
const sidebarT = [
	{
		text: "域名集",
		collapsed: true,
		items: [
			{ text: "09oa", link: "/domain/09oa" },
			{ text: "10wms", link: "/domain/10wms" },
			{ text: "10wms-doc", link: "/domain/10wms-doc" },
			{ text: "11comm", link: "/domain/11comm" },
			{ text: "11comm-doc", link: "/domain/11comm-doc" },
			{ text: "01s-doc", link: "/domain/01s-doc" },
			{ text: "utils", link: "/domain/utils" },
			{ text: "vitepress-preset", link: "/domain/vitepress-preset" },
			{ text: "domain", link: "/domain/domain" },
			{ text: "vercel-deploy-tool", link: "/domain/vercel-deploy-tool" },
		],
	},
];

const sidebarAuto = setGenerateSidebar({
	documentRootPath: "./docs",
	excludeFilesByFrontmatterFieldName: "exclude",
	excludeByGlobPattern: ["domain/**"],
});

// @ts-ignore
userConfig.themeConfig.sidebar = sidebarT.concat(sidebarAuto);

// @ts-ignore
console.log(printFormat(userConfig.themeConfig.sidebar));

export default userConfig;
