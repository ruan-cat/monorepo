import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";

// FIXME: 处理类型声明问题 这是一个纯js文件
import { GieResolver } from "@giegie/resolver";

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		port: 8080,
	},
	plugins: [
		vue(),

		Components({
			resolvers: [GieResolver()],
		}),

		AutoImport({
			resolvers: [GieResolver()],
		}),
	],
});
