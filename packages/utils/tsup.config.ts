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
		dts: true,
		tsconfig: "./tsconfig.types.json",
	},

	// 专门用于 node cjs 场景下的打包
	{
		entry: ["./src/node-cjs/index.ts"],
		sourcemap: true,
		outDir: "dist/node-cjs",
		format: ["cjs"],
		clean: true,
		dts: true,
		shims: true,
		tsconfig: "./tsconfig.types.json",
	},

	// 专门用于 node esm 场景下的打包
	{
		entry: ["./src/node-esm/index.ts"],
		sourcemap: true,
		outDir: "dist/node-esm",
		format: ["esm"],
		clean: true,
		dts: true,
		shims: true,
		tsconfig: "./tsconfig.types.json",
	},

	// 专用于模板文件的复制粘贴
	// {
	// 	entry: ["./src/node-esm/vite-plugin-autogeneration-import-file/template/components.template.ts"],
	// 	clean: true,
	// 	format: ["esm"],
	// 	outDir: "dist/node-esm/template",
	// 	publicDir: "./src/node-esm/vite-plugin-autogeneration-import-file/template",
	// },
]);
