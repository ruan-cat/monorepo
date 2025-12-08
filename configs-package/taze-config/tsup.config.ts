import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./src/cli.ts"],
	outDir: "dist",
	format: ["esm"],
	clean: true,
	dts: true,
	shims: true,
});
