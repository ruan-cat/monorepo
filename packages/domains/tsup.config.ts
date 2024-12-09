import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./main.ts"],
	sourcemap: true,
	outDir: "dist",
	format: ["iife", "cjs", "esm"],
	clean: true,
	dts: true,
	tsconfig: "./tsconfig.json",
	// TODO: 晚点研究该配置
	// target: "es5",
});
