import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";

import { hopeTheme } from "vuepress-theme-hope";

const defineRuanCatVuepressPresetConfig = defineUserConfig({
	base: "/",
	lang: "zh-CN",
	title: "默认标题",
	description: "默认预设的描述文本",

	bundler: viteBundler({
		viteOptions: {},
		vuePluginOptions: {},
	}),

	theme: hopeTheme({
		hostname: "https://www.ruan-cat.com",
		repo: "RuanZhongNan/vercel-monorepo-test",
		docsDir: "src",
		footer: "内部文档，请勿外传",

		sidebar: "structure",

		hotReload: true,

		plugins: {
			components: {
				components: ["Badge", "VPCard"],
			},

			mdEnhance: {
				align: true,
				attrs: true,
				codetabs: true,
				component: true,
				demo: true,
				figure: true,
				imgLazyload: true,
				imgSize: true,
				include: true,
				mark: true,
				stylize: [
					{
						matcher: "Recommended",
						replacer: ({ tag }) => {
							if (tag === "em") {
								return {
									tag: "Badge",
									attrs: { type: "tip" },
									content: "Recommended",
								};
							}
						},
					},
				],
				sub: true,
				sup: true,
				tabs: true,
				vPre: true,

				// 在启用之前安装 chart.js
				// chart: true,

				// insert component easily

				// 在启用之前安装 echarts
				// echarts: true,

				// 在启用之前安装 flowchart.ts
				// flowchart: true,

				// gfm requires mathjax-full to provide tex support
				// gfm: true,

				// 在启用之前安装 katex
				// katex: true,

				// 在启用之前安装 mathjax-full
				// mathjax: true,

				// 在启用之前安装 mermaid
				// mermaid: true,

				// playground: {
				//   presets: ["ts", "vue"],
				// },

				// 在启用之前安装 reveal.js
				// revealJs: {
				//   plugins: ["highlight", "math", "search", "notes", "zoom"],
				// },

				// 在启用之前安装 @vue/repl
				// vuePlayground: true,

				// install sandpack-vue3 before enabling it
				// sandpack: true,
			},
		},
	}),
});

export { defineRuanCatVuepressPresetConfig };
