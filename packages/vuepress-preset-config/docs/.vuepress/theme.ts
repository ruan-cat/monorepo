import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar.js";

export default hopeTheme({
	hostname: "https://vuepress-theme-hope-docs-demo.netlify.app",

	author: {
		name: "Mr.Hope",
		url: "https://mister-hope.com",
	},

	logo: "https://theme-hope-assets.vuejs.press/logo.svg",

	docsDir: "docs",

	// 导航栏
	navbar,

	// 侧边栏
	sidebar: "structure",

	// 页脚
	footer: "默认页脚",
	displayFooter: true,

	// 多语言配置
	metaLocales: {
		editLink: "在 GitHub 上编辑此页",
	},

	// 如果想要实时查看任何改变，启用它。注: 这对更新性能有很大负面影响
	hotReload: true,

	// 此处开启了很多功能用于演示，你应仅保留用到的功能。
	markdown: {
		align: true,
		attrs: true,
		codeTabs: true,
		component: true,
		demo: true,
		figure: true,
		gfm: true,
		imgLazyload: true,
		imgSize: true,
		include: true,
		mark: true,
		plantuml: true,
		spoiler: true,
		sub: true,
		sup: true,
		tabs: true,
		tasklist: true,
		vPre: true,
	},

	// 在这里配置主题提供的插件
	plugins: {
		components: {
			components: ["Badge", "VPCard"],
		},

		icon: {
			prefix: "fa6-solid:",
		},
	},
});
