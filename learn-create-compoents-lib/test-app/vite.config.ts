import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
import { visualizer } from "rollup-plugin-visualizer";

// FIXME: 处理类型声明问题 这是一个纯js文件
// import { GieResolver } from "@giegie/resolver";

// console.log(" GieResolver ", GieResolver);

function GieResolver_2(name: string) {
	console.log(" in name ", name);
	if (name.startsWith("Gie")) {
		const partialName = name.slice(3);
		return {
			name: "Gie" + partialName,
			from: `@giegie/components`,
			sideEffects: `@giegie/components/es/${partialName}/style/index.css`,
		};
	}
}

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		port: 8080,
	},

	// build: {},

	plugins: [
		vue(),

		visualizer({
			// filename: "dist/visualizer/index.html",
			// TODO: 未来这里需要考虑实现vuepress的路由配置，在vuepress内加上一个路由来导航。
			// 我们本地生成了一大堆html静态页面，如何对接接洽vuepress的路由？
			// typedoc好像有类似的实现方案。
			filename: "dist/visualizer/index.html",
			title: "visualizer打包分析报告",
			template: "network",
		}),

		Components({
			// dts: true,
			resolvers: [
				// GieResolver()
				{
					type: "component",
					resolve: GieResolver_2,
				},
			],
		}),

		AutoImport({
			resolvers: [
				// GieResolver()
				{
					type: "component",
					resolve: GieResolver_2,
				},
			],
		}),
	],
});
