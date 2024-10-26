import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "阮喵喵的01星球笔记",
	description: "阮喵喵在01星球内的一些公用文档",

	lang: "zh",

	themeConfig: {
		i18nRouting: true,

		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "首页", link: "/" },
			{ text: "仓库地址", link: "https://github.com/ruan-cat/vercel-monorepo-test/tree/dev/packages/docs-01-star" },
		],

		outline: {
			label: "本页目录",
			level: "deep",
		},

		sidebar: [
			// 警告 暂不提供
			// {
			// 	text: "2024-06 大项目报告",
			// 	link: "/report",
			// },
			// 警告 暂不提供
			// {
			// 	text: "2024-07 小项目建议",
			// 	link: "/index",
			// 	base: "/suggest",
			// 	items: [
			// 		{ text: "组长及管理者", link: "/group-leader" },
			// 		{ text: "各组员", link: "/members" },
			// 	],
			// },
			{
				text: "2024-09 大项目-oa项目",
				link: "/index",
				base: "/09oa",
				items: [
					// 警告 暂不提供
					// { text: "项目首页", link: "/home" },
					// { text: "个人设置", link: "/settings" },

					{
						text: "前端项目架构",
						base: "/09oa/frontend-architecture",
						link: "/index",
						items: [{ text: "package.json", link: "/package-json" }],
					},
				],
			},
		],

		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/vercel-monorepo-test/blob/dev/packages/docs-01-star/docs/index.md",
			},
		],
	},
});
