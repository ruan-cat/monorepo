import { defineConfig } from "vite";

// 导入插件
import { createPlugin } from "vite-plugin-autogeneration-import-file";

// 导入辅助工具函数和变量
import {
	createDirOptionNameFunction,
	pathResolve,
	defaultAutoImportTemplate,
} from "@ruan-cat/utils/vite-plugin-autogeneration-import-file";

// 按照教程创建插件
const { autoImport, resolver } = createPlugin();

export default defineConfig({
	plugins: [
		/** 自动生成类型声明文件插件 */
		autoImport([
			// components 目录
			{
				// 文件命名规则
				name: createDirOptionNameFunction("Components"),
				// 匹配规则 匹配全部的vue组件
				pattern: ["**/*.vue"],
				// 监听的文件夹
				dir: pathResolve("./src/components"),
				// 生成的文件
				toFile: pathResolve("./types/components-in-components-path.d.ts"),
				// 文件生成模板
				template: defaultAutoImportTemplate,
				codeTemplates: [
					{
						key: "//code",
						template: '{{name}}: typeof import("{{path}}")["default"];\n    ',
					},
				],
			},

			// views 目录
			{
				name: createDirOptionNameFunction("Page"),
				pattern: ["**/*.vue"],
				dir: pathResolve("./src/views"),
				toFile: pathResolve("./types/components-in-views-path.d.ts"),
				template: defaultAutoImportTemplate,
				codeTemplates: [
					{
						key: "//code",
						template: '{{name}}: typeof import("{{path}}")["default"];\n    ',
					},
				],
			},
		]),
	],
});
