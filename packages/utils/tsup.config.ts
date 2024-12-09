import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./src/index.ts"],
	sourcemap: true,
	outDir: "dist",
	format: ["iife", "cjs", "esm"],
	clean: true,
	// dts: false,
	// tsconfig: "./tsconfig.json",

	// 该配置可以实现生成类型文件 也可以实现js文件的生成
	dts: true,
	tsconfig: "./tsconfig.types.json",
});
