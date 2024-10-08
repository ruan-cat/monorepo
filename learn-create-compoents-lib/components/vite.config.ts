// 在 components 下 新建一个vite.config.ts文件，配置和说明如下：
import { uniqueId } from "lodash-es";

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import { defineConfig } from "vite";
import type { UserConfig } from "vite";
import Components from "unplugin-vue-components/vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { GieResolver } from "@giegie/resolver";
import { createPlugin } from "vite-plugin-autogeneration-import-file";

const { autoImport, resolver } = createPlugin();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function pathResolve(dir: string) {
	const resPath = resolve(__dirname, ".", dir);
	// console.log(" in tool pathResolve => ", resPath);
	return resPath;
}

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

					// {
					// 	// 打包成 commonjs
					// 	format: "cjs",
					// 	// 重命名
					// 	entryFileNames: "[name].js",
					// 	// 打包目录和开发目录对应
					// 	preserveModules: true,
					// 	// 输出目录
					// 	dir: "lib",
					// 	// 指定保留模块结构的根目录
					// 	preserveModulesRoot: "src",
					// },
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

			autoImport([
				// 自动生成
				{
					// auto import components
					pattern: [
						// "*.{vue,ts}",
						// "**/index.{vue,ts}"
						// "**/*.{vue,ts}",
						// "./src/**/*.vue",
						"**/*.vue",
						// "./src/Input/Input.vue",
						// "**/index.{ts}",
						// "*.{vue,ts}",
						// "**/index.{vue,ts}",
					],
					// 监听的文件夹
					dir: pathResolve("src"),
					// 生成的文件
					// FIXME: 当不包含文件路径时，就出现错误 如果没有预先准备好文件夹，就会生成失败。
					// toFile: pathResolve("types/components.d.ts"),
					toFile: pathResolve("components.d.ts"),
					// 文件生成模板
					template: fs.readFileSync(pathResolve("template/components.template.d.ts"), "utf-8"),
					codeTemplates: [
						// 代码模板
						{
							key: "//code",
							template: '{{name}}: typeof import("{{path}}")["default"];\n    ',
						},
						{
							key: "//typeCode",
							template: 'type {{name}}Instance = InstanceType<typeof import("{{path}}")["default"]>;\n  ',
						},
					],
					// 组件名命名规则支持字符串模板和函数
					// name: "RuanCat_{{name}}",
					name: "Gie_{{name}}",
				},
			]),

			Components({
				// 忽略掉'unplugin-vue-components'的组件引入
				dirs: [],
				// include: [],
				// ui库解析器
				resolvers: [resolver([0])], //应用vite-plugin-autogeneration-import-file插件的第0组规则进行组件引入
				//禁止生成component.d.ts
				dts: false,
				// dts: true,
			}),

			// 尝试在这里自己生成类型声明文件，生成 GlobalComponents 接口的内容。
			// 失败 unplugin-vue-components/vite 提供的自动生成类型，不能深度地配置
			// Components({
			// 	// dts: true,
			// 	// dirs: ["src"],
			// 	// resolvers: [
			// 	// 	{
			// 	// 		type: "component",
			// 	// 		resolve(name) {
			// 	// 			console.log(" in name ", name);
			// 	// 			return {
			// 	// 				name: `${name}_${uniqueId("aaa")}`,
			// 	// 				from: `@giegie/components`,
			// 	// 				sideEffects: `@giegie/components/es/${name}/style/index.css`,
			// 	// 			};
			// 	// 			// if (name.startsWith("Gie")) {
			// 	// 			// 	const partialName = name.slice(3);
			// 	// 			// 	return {
			// 	// 			// 		name: "Gie" + partialName,
			// 	// 			// 		from: `@giegie/components`,
			// 	// 			// 		sideEffects: `@giegie/components/es/${partialName}/style/index.css`,
			// 	// 			// 	};
			// 	// 			// }
			// 	// 		},
			// 	// 	},
			// 	// ],
			// }),

			// 尝试自己生成类型声明文件，生成 GlobalComponents 接口的内容。
			// Components({
			// 	resolvers: [GieResolver()],
			// }),
			// AutoImport({
			// 	resolvers: [GieResolver()],
			// }),
		],
	} as UserConfig;
});
