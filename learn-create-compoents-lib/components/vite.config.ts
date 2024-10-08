// 在 components 下 新建一个vite.config.ts文件，配置和说明如下：

import { defineConfig } from "vite";
import type { UserConfig } from "vite";
import Components from "unplugin-vue-components/vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

export default defineConfig(() => {
	return {
		build: {
			// 为了方便学习，查看构建产物，将此置为 false，不要混淆产物代码
			minify: false,

			lib: {
				// 指定入口文件
				entry: "./src/index.ts",
				// 模块名
				name: "GIE_COMPONENTS",
			},

			rollupOptions: {
				// 将vue模块排除在打包文件之外，使用用这个组件库的项目的vue模块
				external: ["vue"],

				// 输出配置
				output: [
					{
						// 打包成 es module
						format: "es",
						// 重命名
						entryFileNames: "[name].js",
						// 打包目录和开发目录对应
						preserveModules: true,
						// 输出目录
						dir: "es",
						// 指定保留模块结构的根目录
						preserveModulesRoot: "src",
					},
					{
						// 打包成 commonjs
						format: "cjs",
						// 重命名
						entryFileNames: "[name].js",
						// 打包目录和开发目录对应
						preserveModules: true,
						// 输出目录
						dir: "lib",
						// 指定保留模块结构的根目录
						preserveModulesRoot: "src",
					},
				],
			},
		},

		plugins: [
			vue(),
			dts({
				// 输出目录
				outDir: ["types"],
				// 将动态引入转换为静态（例如：`import('vue').DefineComponent` 转换为 `import { DefineComponent } from 'vue'`）
				staticImport: true,
				// 将所有的类型合并到一个文件中
				rollupTypes: true,
			}),
		],
	} as UserConfig;
});
