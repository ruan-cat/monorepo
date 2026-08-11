import { defineConfig, type Options } from "tsup";

// 发布产物不能依赖 pnpm 工作区内的运行时软链接；Node.js 内建模块保持外部。
const bundleRuntimeDependencies = [/^(?!node:).+/];

export default defineConfig((options: Options) => [
	// 常规 esm 情况的包
	{
		entry: ["./src/index.ts", "./src/conditions.ts", "./src/monorepo/index.ts"],
		sourcemap: true,
		outDir: "dist",
		format: ["esm"],
		noExternal: bundleRuntimeDependencies,
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
		noExternal: bundleRuntimeDependencies,
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
		noExternal: bundleRuntimeDependencies,
		dts: true,
		shims: true,
		tsconfig: "./tsconfig.types.json",
	},

	// CLI 入口构建
	{
		entry: {
			index: "./src/cli/index.ts",
			"move-vercel-output-to-root": "./src/cli/move-vercel-output-to-root.ts",
			"relizy-runner": "./src/cli/relizy-runner.ts",
		},
		sourcemap: true,
		outDir: "dist/cli",
		format: ["esm"],
		noExternal: bundleRuntimeDependencies,
		shims: true,
		banner: {
			js: "#!/usr/bin/env node",
		},
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
