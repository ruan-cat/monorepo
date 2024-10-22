import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { getName, createPlugin } from "@ruan-cat-test/vite-plugin-autogeneration-import-file";
const { autoImport, resolver } = createPlugin();

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),

		autoImport([
			// components
			{
				pattern: ["**/{index.vue,index.ts,index.js}", "*.{vue,ts,js}"],
				dir: "./src/components",
				toFile: "./components1.d.ts",
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
			// {
			// 	pattern: ["**/*.{ts,js}", "*.{ts,js}"],
			// 	dir: "./src/store/modules",
			// 	toFile: "./src/store/module.ts",
			// 	name: (name) => {
			// 		name = getName(name);
			// 		return name[0].toUpperCase() + name.slice(1) + "Store";
			// 	},
			// },

			// myComponents
			{
				pattern: ["**/{index.vue,index.ts,index.js}", "*.{vue,ts,js}"],
				dir: "./src/myComponents",
				toFile: "./myComponents.d.ts",
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
				dir: "./src/myDirective",
				toFile: "./myDirective.d.ts",
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
			resolvers: [
				// resolver([0, 2], [3])
			],
		}),
	],
});
