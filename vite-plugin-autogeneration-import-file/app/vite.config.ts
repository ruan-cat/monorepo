import { dirname, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import * as fs from "node:fs";

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
				template: `
import '@vue/runtime-core'
export {}
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    //import code
  }
}`,
				name: "_{{name}}",
				codeTemplates: [{ key: "//import code", template: '{{name}}: typeof import("{{path}}")["default"]\n    ' }],
			},

			// module
			{
				pattern: ["**/*.{ts,js}", "*.{ts,js}"],
				// dir: pathResolve("./src/store/modules"),
				dir: pathResolve("./src/store"),
				toFile: pathResolve("./types/generate-types-store-modules.d.ts"),
				name: (name) => {
					name = getName(name);
					return name[0].toUpperCase() + name.slice(1) + "Store";
				},
			},

			// myComponents
			{
				pattern: ["**/{index.vue,index.ts,index.js}", "*.{vue,ts,js}"],
				dir: pathResolve("./src/myComponents"),
				toFile: pathResolve("./types/generate-types-myComponents.d.ts"),
				template: `
import '@vue/runtime-core'
export {}
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    //import code
  }
}`,
				name: "_{{name}}",
				codeTemplates: [{ key: "//import code", template: '{{name}}: typeof import("{{path}}")["default"]\n    ' }],
			},

			// myDirective
			{
				pattern: ["**/{index.vue,index.ts,index.js}", "*.{vue,ts,js}"],
				dir: pathResolve("./src/myDirective"),
				toFile: pathResolve("./types/generate-types-myDirective.d.ts"),
				template: `
import '@vue/runtime-core'
export {}
declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    //import code
  }
}`,
				name: "V_{{name}}",
				codeTemplates: [{ key: "//import code", template: '{{name}}: typeof import("{{path}}")["default"]\n    ' }],
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
