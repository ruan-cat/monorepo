import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";

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
	plugins: [
		vue(),

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
