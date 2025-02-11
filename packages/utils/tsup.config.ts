import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
	entry: ["./src/index.ts"],
	sourcemap: true,
	outDir: "dist",
	format: ["iife", "cjs", "esm"],
	clean: true,
	// dts: false,
	// tsconfig: "./tsconfig.json",
	external: ["lightningcss", "vite"],

	// 该配置可以实现生成类型文件 也可以实现js文件的生成
	dts: true,
	tsconfig: "./tsconfig.types.json",
}));
