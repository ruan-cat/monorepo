import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "monorepo-1-vitepress原版主题",
	description: "vitepress原版主题测试",
	lang: "zh",

	base: "/vitepress/",
	srcDir: "../../../docs",
	outDir: "../../../dist/vitepress",
	cacheDir: "../../../.cache/vitepress",

	themeConfig: {
		i18nRouting: true,

		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "首页", link: "/" },
			{
				text: "仓库地址",
				link: "https://github.com/ruan-cat/vercel-monorepo-test/blob/dev/tests/monorepo-1/docs/index.md",
			},
		],

		outline: {
			label: "本页目录",
			level: "deep",
		},

		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/vercel-monorepo-test/blob/dev/tests/monorepo-1/docs/index.md",
			},
		],

		sidebar: [
			{
				text: "2024-09 大项目-oa项目",
				link: "/index",
				base: "/09oa",
				items: [
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
		],
	},
});
