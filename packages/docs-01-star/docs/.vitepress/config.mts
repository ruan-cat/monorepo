import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "01星球-大项目建议",
	description: "01星球-大项目建议",

	lang: "zh",

	themeConfig: {
		i18nRouting: true,

		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "首页", link: "/" },
			{ text: "仓库地址", link: "https://github.com/ruan-cat/vercel-monorepo-test" },
		],

		sidebar: [
			{
				text: "2024-06 大项目报告",
				link: "/report",
			},

			{
				text: "2024-07 小项目建议",
				link: "/index",
				base: "/suggest",
				items: [
					{ text: "组长及管理者", link: "/group-leader" },
					{ text: "各组员", link: "/members" },
				],
			},

			{
				text: "oa项目",
				link: "/index",
				base: "/09oa",
				items: [
					{ text: "项目首页", link: "/home" },
					{ text: "个人设置", link: "/settings" },
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
