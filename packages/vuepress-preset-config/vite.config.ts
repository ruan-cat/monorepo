import { defineConfig, type PluginOption } from "vite";
import { builtinModules as builtin } from "node:module";
import { dependencies } from "./package.json";

import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import commonjs from "@rollup/plugin-commonjs";
import inject from "@rollup/plugin-inject";
import esmShim from "@rollup/plugin-esm-shim";
// import { nodePolyfills } from "vite-plugin-node-polyfills";
import nodePolyfills from "rollup-plugin-polyfill-node";

// import nodeGlobals from "rollup-plugin-node-globals";

export default defineConfig({
	// // 其他配置...
	// optimizeDeps: {
	// 	// 排除特定依赖
	// 	exclude: ["rollup-plugin-visualizer"],
	// },

	build: {
		// 产物输出目录，默认值就是 dist。我们使用默认值，注释掉此字段。
		// outDir: 'dist',

		// target: "es2015",

		// 参考：https://cn.vitejs.dev/config/build-options.html#build-lib
		lib: {
			// 构建的入口文件
			entry: "./src/index.ts",

			// 产物的生成格式
			formats: ["es", "umd"],

			// 当产物为 umd、iife 格式时，该模块暴露的全局变量名称
			name: "VuepressPresetConfig",

			// 产物文件名称
			fileName: "vuepress-preset-config",
		},

		// 为了方便学习，查看构建产物，将此置为 false，不要混淆产物代码
		minify: false,

		// 参考：https://cn.vitejs.dev/config/build-options.html#build-rollupoptions
		rollupOptions: {
			// 确保外部化处理那些你不想打包进库的依赖
			external: [
				...builtin,
				...Object.keys(dependencies),
				/^node:.*$/,
				/^node:/,
				// 尝试直接屏蔽全部依赖 不再考虑逐个手动声明了
				// "@vuepress/bundler-vite",
				// "vuepress",
				// "vuepress-theme-hope",
				// "fs",
			],
			// external: [
			// 	/\@vuepress\/bundler-vite.*/,
			// 	//
			// 	/vuepress.*/,
			// 	/vuepress-theme-hope.*/,
			// 	// /vuepress*/,
			// 	// /vuepress-theme-hope*/,
			// 	/fsevents.*/,
			// 	/node.*/,
			// ],

			output: {
				// 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量。即使不设置，构建工具也会为我们自动生成。个人倾向于不设置
				globals: {
					vuepress: "vuepress",
					"vuepress-theme-hope": "vuepress-theme-hope",
					"@vuepress/bundler-vite": "@vuepress/bundler-vite",
					"rollup-plugin-visualizer": "rollup-plugin-visualizer",
				},
			},

			plugins: [],
		},

		// https://github.com/vitejs/vite/discussions/14490
		// https://cn.vitejs.dev/config/build-options.html#build-commonjsoptions
		// commonjsOptions: {
		// 	requireReturnsDefault: "auto",
		// },
	},

	// esbuild:{
	// },

	plugins: [
		// inject({
		// 	include: "./src/inject.ts",
		// }),
		// commonjs(),
		// FIXME:
		// nodeGlobals(),
		// FIXME: 为了解决 fs 问题，引入 nodePolyfills 插件 莫名其妙的类型报错
		// esmShim(),
		// nodePolyfills(),
		// nodeResolve(),
		// nodeResolve({
		// 	exportConditions: ["node"],
		// }),
		// as PluginOption,
		// replace({
		// 	preventAssignment: true,
		// 	values: {
		// 		__dirname: "import.meta.url",
		// 		__filename: "import.meta.url",
		// 	},
		// }),
	],
});
