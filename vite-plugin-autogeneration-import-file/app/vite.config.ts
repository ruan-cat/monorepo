import { dirname, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import * as fs from "node:fs";

import { upperFirst } from "lodash-es";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { getName, createPlugin } from "@ruan-cat-test/vite-plugin-autogeneration-import-file";

const { autoImport, resolver } = createPlugin();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function pathResolve(dir: string) {
	const resPath = resolve(__dirname, ".", dir);
	return resPath;
}

const autoImportTemplatePath = <const>"./template/components.template.d.ts";

/** 文件生成模板 */
function createAutoImportTemplate() {
	return fs.readFileSync(pathResolve(autoImportTemplatePath), "utf-8");
}

const autoImportTemplate = createAutoImportTemplate();

type DirOptions = Parameters<typeof autoImport>["0"];
type DirOption = DirOptions[number];
type _DirOptionName = DirOption["name"];

type _DirOptionNameNotString = Exclude<_DirOptionName, string>;
type DirOptionName = NonNullable<_DirOptionNameNotString>;

/**
 * 创建名称生成函数
 * @description
 * 用于诸如特定的名称前缀 便于实现模块注册
 */
function createDirOptionNameFunction(prefix: string = "") {
	/**
	 * 组件名命名规则支持字符串模板和函数
	 * @description
	 * 设置首字母为大写
	 */
	const dirOptionName: DirOptionName = function name(fileName) {
		const resFileName = getName(fileName);
		const resFileNameWithPrefix = <const>`${upperFirst(prefix)}${upperFirst(resFileName)}`;
		return resFileNameWithPrefix;
	};

	return dirOptionName;
}

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		port: 8080,
		open: true,
	},

	plugins: [
		vue(),

		autoImport([
			// components
			{
				pattern: ["**/{index.vue,index.ts,index.js}", "*.{vue,ts,js}"],
				dir: pathResolve("./src/components"),
				toFile: pathResolve("./types/generate-types-components.d.ts"),
				template: autoImportTemplate,
				// name: "_{{name}}",
				name: createDirOptionNameFunction("Component"),
				// codeTemplates: [{ key: "//code", template: 'Component{{name}}: typeof import("{{path}}")["default"]\n    ' }],
				codeTemplates: [{ key: "//code", template: '{{name}}: typeof import("{{path}}")["default"]\n    ' }],
			},

			// module
			{
				pattern: ["**/*.{ts,js}", "*.{ts,js}"],
				dir: pathResolve("./src/store"),
				toFile: pathResolve("./types/generate-types-store-modules.d.ts"),
				name: createDirOptionNameFunction(),
				// name: (name) => {
				// 	name = getName(name);
				// 	return name[0].toUpperCase() + name.slice(1) + "Store";
				// },
			},

			// myComponents
			{
				pattern: ["**/{index.vue,index.ts,index.js}", "*.{vue,ts,js}"],
				dir: pathResolve("./src/myComponents"),
				toFile: pathResolve("./types/generate-types-myComponents.d.ts"),
				template: autoImportTemplate,
				// name: "_{{name}}",
				name: createDirOptionNameFunction("MyComponent"),
				// codeTemplates: [{ key: "//code", template: 'MyComponent{{name}}: typeof import("{{path}}")["default"]\n    ' }],
				codeTemplates: [{ key: "//code", template: '{{name}}: typeof import("{{path}}")["default"]\n    ' }],
			},

			// myDirective
			{
				pattern: ["**/{index.vue,index.ts,index.js}", "*.{vue,ts,js}"],
				dir: pathResolve("./src/myDirective"),
				toFile: pathResolve("./types/generate-types-myDirective.d.ts"),
				template: autoImportTemplate,
				// name: "V_{{name}}",
				name: createDirOptionNameFunction("MyDirective"),
				// codeTemplates: [{ key: "//code", template: 'MyDirective{{name}}: typeof import("{{path}}")["default"]\n    ' }],
				codeTemplates: [{ key: "//code", template: '{{name}}: typeof import("{{path}}")["default"]\n    ' }],
			},
		]),

		// FIXME: 莫名其妙地称类型不匹配 需要修复
		// @ts-ignore
		Components({
			dirs: [],
			dts: false,
			resolvers: [resolver([0, 2], [3])],
		}),
	],
});
