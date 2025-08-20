import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => [
	// 主入口文件和所有模块一起构建
	{
		entry: ["./src/index.ts", "./src/plugins/changelog-with-changelogen.ts"],
		sourcemap: true,
		outDir: "dist",
		format: ["esm", "cjs"],
		clean: true,
		dts: true,
		tsconfig: "./tsconfig.json",
		splitting: false,
		treeshake: false,
	},
]);
