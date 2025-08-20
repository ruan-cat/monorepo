import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => [
	// 主入口文件和所有模块一起构建
	{
		entry: [
			"./src/index.ts",
			"./src/plugins/changelog-with-changelogen.ts",
			"./src/scripts/sync-github-release.ts",
			"./src/configs/changelogen.config.ts",
		],
		sourcemap: true,
		outDir: "dist",
		format: ["esm", "cjs"],
		clean: true,
		dts: false, // 先跳过 DTS 生成
		tsconfig: "./tsconfig.json",
		splitting: false,
		treeshake: false,
	},
]);
