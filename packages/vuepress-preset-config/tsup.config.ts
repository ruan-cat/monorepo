import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => [
	// 常规 esm 情况的包
	{
		entry: ["./src/index.ts"],
		sourcemap: true,
		outDir: "dist",
		format: ["esm"],
		clean: true,
		// 该配置可以实现生成类型文件 也可以实现js文件的生成
		// dts: true,
		// tsconfig: "./tsconfig.types.json",
	},
]);
