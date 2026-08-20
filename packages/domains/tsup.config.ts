import { defineConfig, type Options } from "tsup";

const config: Options = {
	entry: ["./src/index.ts"],
	sourcemap: true,
	outDir: "dist",
	format: ["iife", "cjs", "esm"],
	clean: true,
	dts: true,
	tsconfig: "./tsconfig.json",
};

export default defineConfig(config);
