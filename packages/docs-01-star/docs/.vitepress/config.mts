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
			{ text: "Home", link: "/" },
			{ text: "Examples", link: "/markdown-examples" },
		],

		sidebar: [
			{
				text: "2024-06 大项目报告",
				link: "/report",
			},

			{
				text: "2024-07 小项目建议",
				link: "/suggest",
				base: "/suggest",
				items: [
					{ text: "组长及管理者", link: "/group-leader" },
					{ text: "各组员", link: "/members" },
				],
			},

			{
				text: "Examples",
				items: [
					{ text: "Markdown Examples", link: "/markdown-examples" },
					{ text: "Runtime API Examples", link: "/api-examples" },
				],
			},
		],

		socialLinks: [{ icon: "github", link: "https://github.com/vuejs/vitepress" }],
	},
});
