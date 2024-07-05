import { merge } from "lodash-es";
import { type UserConfig, defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";

import { type PluginVisualizerOptions, visualizer } from "rollup-plugin-visualizer";

import { hopeTheme } from "vuepress-theme-hope";

/**
 * 默认的vuepress基础配置
 * @description
 * 仅提供了少数配置，这些配置都预设的最低限度配置
 *
 * 未来应该尽可能地减少此处的配置
 */
const defaultConfig: UserConfig = {
	base: "/",
	lang: "zh-CN",
	title: "默认标题",
	description: "默认预设的描述文本",

	bundler: viteBundler({
		viteOptions: {
			plugins: [
				visualizer({
					filename: "dist/visualizer/index.html",
					title: "visualizer打包分析报告",
					template: "network",
				}),
			],
		},
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
};

/**
 * 创建默认的配置对象
 * @description
 * 用类似于简单工厂函数的方式，生成新的对象。
 */
function createDefaultConfig() {
	return merge({}, defaultConfig);
}

const defineRuanCatVuepressPresetConfig = defineUserConfig(createDefaultConfig());

/** 定义阮喵vuepress配置对象 */
function defineRuanCatVuepressConfig(userConfig: UserConfig) {
	return merge(createDefaultConfig(), userConfig);
}

export { defineRuanCatVuepressPresetConfig, defineRuanCatVuepressConfig };
