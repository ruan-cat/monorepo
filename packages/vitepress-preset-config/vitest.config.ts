import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// spec 要求：依赖 dist 的包入口测试必须声明构建前置，缺失时在前置阶段失败并给出包名与缺失产物。
if (!existsSync(new URL("./dist/config.mjs", import.meta.url))) {
	throw new Error(
		"[vitepress-preset-config] 缺少构建产物 dist/config.mjs。请先运行 `pnpm --dir packages/vitepress-preset-config run build` 再执行包入口测试。",
	);
}

export default defineConfig({
	test: {
		name: "vitepress-preset-config",
		include: ["src/docs/tests/**/*.test.ts"],
		environment: "node",
	},
});
