/**
 * shadcn-docs-nuxt 站点配置骨架
 *
 * app.config.ts 只负责站点元信息和 UI 配置，不涉及构建逻辑。
 * 构建相关配置统一放在 nuxt.config.ts。
 *
 * 使用方式：
 * 1. 复制本文件到文档站根目录
 * 2. 替换 site.name / description / header / footer 等为你的项目信息
 * 3. nav 和 links 按实际需要填充
 *
 * 可用的 theme.color 值: slate, gray, zinc, neutral, stone
 */
export default defineAppConfig({
	shadcnDocs: {
		site: {
			name: "你的项目名",
			description: "项目描述",
		},
		theme: {
			customizable: true,
			color: "stone",
			radius: 0.5,
		},
		header: {
			title: "你的项目名",
			showTitle: true,
			darkModeToggle: true,
			logo: {
				light: "/logo.svg",
				dark: "/logo-dark.svg",
			},
			nav: [
				{ title: "快速开始", to: "/getting-started" },
				{ title: "组件", to: "/components" },
			],
			links: [
				{
					icon: "lucide:github",
					to: "https://github.com/your-org/your-repo",
					target: "_blank",
				},
			],
		},
		aside: {
			useLevel: true,
			collapse: false,
			levelStyle: "aside",
			collapseLevel: 1,
			folderStyle: "default",
		},
		main: {
			breadCrumb: true,
			showTitle: true,
		},
		footer: {
			credits: "项目文档站描述",
			links: [],
		},
		toc: {
			enable: true,
			title: "本页目录",
			links: [
				{
					title: "GitHub",
					icon: "lucide:star",
					to: "https://github.com/your-org/your-repo",
					target: "_blank",
				},
				{
					title: "提交 Issue",
					icon: "lucide:circle-dot",
					to: "https://github.com/your-org/your-repo/issues",
					target: "_blank",
				},
			],
		},
		search: {
			enable: true,
			inAside: false,
		},
	},
});
