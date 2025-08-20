import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		"./src/index.ts",
		/**
		 * 导出类型提取功能
		 * 用于与 changelogen 集成
		 */
		"./src/types-extractor.ts",
	],
	outDir: "dist",
	format: ["cjs"],
	clean: true,
	// 该配置可以实现生成类型文件 也可以实现js文件的生成
	dts: true,
	shims: true,
});
