import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./src/index.ts", "./src/cli.ts"],
	outDir: "dist",
	format: ["cjs"],
	clean: true,
	// 生成类型文件和 JS 文件
	dts: true,
	shims: true,
	// 复制 assets 目录到 dist
	publicDir: "./src/assets",
	// 外部依赖（不打包）
	external: ["node-notifier"],
	// 目标环境
	target: "node18",
	// 代码分割
	splitting: false,
});
