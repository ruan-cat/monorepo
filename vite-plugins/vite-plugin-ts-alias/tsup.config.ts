import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => [
	{
		entry: ["src/index.ts"],
		format: ["esm"],
		dts: true,
		clean: true,
		external: ["vite"],
		// 禁用自动类型包含，避免包含不需要的类型定义
		skipNodeModulesBundle: true,
	},
]);
