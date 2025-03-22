import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => [
	{
		entry: ["./src/config.mts", "./src/theme.ts"],
		outDir: "dist",
		format: ["esm"],
		clean: true,
		// 该配置可以实现生成类型文件 也可以实现js文件的生成
		dts: true,
		tsconfig: "./tsconfig.build.json",
	},
	// 不直接使用文档配置
	// {
	// 	entry: ["./src/.vitepress/theme/index.ts"],
	// 	outDir: "dist/theme",
	// 	format: ["esm"],
	// 	clean: true,
	// 	dts: true,
	// 	tsconfig: "./tsconfig.build.json",
	// },
]);
