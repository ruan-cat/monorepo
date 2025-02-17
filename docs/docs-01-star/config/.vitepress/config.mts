import { defineConfig, type DefaultTheme } from "vitepress";
import { generateSidebar } from "vitepress-sidebar";

import { GitChangelog, GitChangelogMarkdownSection } from "@nolebase/vitepress-plugin-git-changelog/vite";
import { calculateSidebar } from "@nolebase/vitepress-plugin-sidebar";

/**
 * 手动配置的侧边栏
 * @description
 */
const sidebar: DefaultTheme.Config["sidebar"] = [
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
		text: "注意事项",
		link: "/index",
		base: "/attention",
		items: [{ text: "及时修改git用户名", link: "/change-git-user-name" }],
	},

	{
		text: "2024-09 大项目-oa项目",
		link: "/index",
		base: "/09oa",
		collapsed: true,
		items: [
			// 警告 暂不提供
			// { text: "项目首页", link: "/home" },
			// { text: "个人设置", link: "/settings" },

			{
				text: "前端项目架构",
				base: "/09oa/frontend-architecture",
				link: "/index",
				items: [
					{ text: "package.json", link: "/package-json" },
					{ text: "生产环境依赖", link: "/dependencies" },
					{ text: "开发环境依赖", link: "/devDependencies" },
					{ text: "复杂命令脚本", link: "/scripts" },
					{ text: "生成模板", link: "/template" },
					{ text: "类型声明文件", link: "/types" },
					{ text: "git忽略配置", link: "/gitignore" },
					{ text: "vscode配置", link: "/vscode-config" },
					{ text: "vite配置", link: "/vite" },
				],
			},

			{
				text: "搭建开发环境",
				base: "/09oa/frontend-dev",
				link: "/index",
				items: [
					{ text: "浏览器插件", link: "/chrome-extensions" },
					{ text: "node版本控制", link: "/node-version" },
					{ text: "高性能包管理器", link: "/pnpm" },
					{ text: "常用的vscode插件", link: "/vscode-extensions" },
					{ text: "简易网络代理", link: "/watt-toolkit" },
				],
			},

			{ text: "阶段性总结", link: "/summary" },
		],
	},
];

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "阮喵喵的01星球笔记",
	description: "阮喵喵在01星球内的一些公用文档",

	lang: "zh",
	srcDir: "../docs",

	themeConfig: {
		i18nRouting: true,

		search: {
			provider: "local",
		},

		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "首页", link: "/" },
			{ text: "仓库地址", link: "https://github.com/ruan-cat/vercel-monorepo-test/tree/dev/packages/docs-01-star" },
		],

		outline: {
			label: "本页目录",
			level: "deep",
		},

		sidebar,
		// sidebar: generateSidebar({
		// 	documentRootPath: "docs",
		// 	collapsed: true,
		// }),
		// sidebar: calculateSidebar(),

		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/vercel-monorepo-test/blob/dev/packages/docs-01-star/docs/index.md",
			},
		],
	},

	vite: {
		server: {
			open: true,
		},

		plugins: [
			GitChangelog({
				// 填写在此处填写您的仓库链接
				repoURL: () => "https://github.com/ruan-cat/vercel-monorepo-test",
			}),
			GitChangelogMarkdownSection(),
		],

		optimizeDeps: {
			exclude: [
				"@nolebase/vitepress-plugin-breadcrumbs/client",
				"@nolebase/vitepress-plugin-enhanced-readabilities/client",
				"vitepress",
				"@nolebase/ui",
			],
		},

		ssr: {
			noExternal: [
				// 如果还有别的依赖需要添加的话，并排填写和配置到这里即可
				"@nolebase/vitepress-plugin-breadcrumbs",

				"@nolebase/vitepress-plugin-enhanced-readabilities",
				"@nolebase/ui",

				"@nolebase/vitepress-plugin-highlight-targeted-heading",
			],
		},
	},
});
