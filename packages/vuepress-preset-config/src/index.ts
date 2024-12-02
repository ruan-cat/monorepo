import { merge } from "lodash-es";
import { type UserConfig, defineUserConfig } from "vuepress";
// import { getDirname, path } from "vuepress/utils";
// import { fileURLToPath, URL } from "node:url";

import { viteBundler } from "@vuepress/bundler-vite";
import { visualizer } from "rollup-plugin-visualizer";
import { type ThemeOptions, hopeTheme } from "vuepress-theme-hope";

export { hopeTheme } from "vuepress-theme-hope";
export type { ThemeOptions } from "vuepress-theme-hope";
// const __dirname = getDirname(import.meta.url);

import { slimsearchPlugin } from "@vuepress/plugin-slimsearch";

function getYaer() {
	return new Date().getFullYear();
}

/** 作者对外称呼 */
export const authorName = <const>"阮喵喵";

/** 页脚模板函数 */
export function footerTmpl() {
	return <const>`MIT Licensed | Copyright © ${getYaer()}-present ${authorName}`;
}

/** 阮喵喵的 hope 主题配置 */
export const ruancatHopeThemeConfig: ThemeOptions = {
	hostname: "https://www.ruan-cat.com",
	repo: "ruan-cat/vercel-monorepo-test",
	docsDir: "src",
	footer: "内部文档，请勿外传",

	sidebar: "structure",

	// 不使用全屏
	fullscreen: false,
	// 不使用暗黑模式
	darkmode: "disable",

	// 开发模式下是否启动热更新，显示所有更改并重新渲染
	hotReload: true,

	author: {
		name: authorName,
		url: "https://github.com/ruan-cat",
	},

	plugins: {
		components: {
			components: ["Badge", "VPCard"],
		},

		mdEnhance: {
			align: true,
			attrs: true,
			component: true,
			demo: true,
			// TODO: 根据 rc53 的更新记录，做迁移调整
			// figure: true,
			// imgLazyload: true,
			// imgSize: true,
			// TODO: 根据 rc56 的更新记录，做迁移调整
			// codetabs: true,
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
			vPre: true,
			// TODO: 根据 rc56 的更新记录，做迁移调整
			// tabs: true,

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

		// 该配置无效
		// searchPro: {
		// 	indexContent: true,
		// 	autoSuggestions: true,
		// },
	},
};

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

	// 提供基础的md标题识别配置 识别标题到5级
	markdown: {
		headers: {
			level: [2, 3, 4, 5],
		},
	},

	bundler: viteBundler({
		viteOptions: {
			plugins: [
				// TODO: 不提供 没必要输出打包报告
				// visualizer({
				// 	// filename: "dist/visualizer/index.html",
				// 	// TODO: 未来这里需要考虑实现vuepress的路由配置，在vuepress内加上一个路由来导航。
				// 	// 我们本地生成了一大堆html静态页面，如何对接接洽vuepress的路由？
				// 	// typedoc好像有类似的实现方案。
				// 	filename: "src/.vuepress/dist/visualizer/index.html",
				// 	title: "visualizer打包分析报告",
				// 	template: "network",
				// }),
			],
		},
		vuePluginOptions: {},
	}),

	theme: hopeTheme(
		ruancatHopeThemeConfig,

		{
			custom: true,
			// 关闭掉调试模式 不需要过多的提示内容
			debug: false,
		},
	),

	alias: {
		// "@theme-hope/modules/navbar/components/RepoLink": new URL("./components/test.vue", import.meta.url),
		// fileURLToPath(
		// 	new URL("./components/test.vue", import.meta.url),
		// ),
		// path.resolve(__dirname, "./components/test.vue"),
	},

	plugins: [
		slimsearchPlugin({
			indexContent: true,
			autoSuggestions: true,
		}),
	],
};

/**
 * 创建默认的配置对象
 * @description
 * 用类似于简单工厂函数的方式，生成新的对象。
 */
function createDefaultConfig() {
	return merge({}, defaultConfig);
}

/** 阮喵喵的默认 VuepressPresetConfig 配置对象 */
export const ruanCatVuepressPresetConfig = defineUserConfig(createDefaultConfig());

/**
 * 定义阮喵vuepress配置对象
 * @description
 * 传入参数 在阮喵喵配置的前提下 拓展配置
 */
export function defineRuanCatVuepressConfig(userConfig: UserConfig) {
	return merge(createDefaultConfig(), userConfig);
}
