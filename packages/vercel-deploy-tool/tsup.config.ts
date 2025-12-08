import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./src/index.ts", "./src/cli.ts"],
	outDir: "dist",
	format: ["esm"],
	clean: true,
	dts: true,
	shims: true,
	splitting: false,
	target: "node18",
	external: ["vercel"],
});
