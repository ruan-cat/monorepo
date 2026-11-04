import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// CLI 测试执行 dist/cli.js，属包入口测试：缺失构建产物时在前置阶段失败并给出包名与产物路径。
if (!existsSync(new URL("./dist/cli.js", import.meta.url))) {
	throw new Error(
		"[taze-config] 缺少构建产物 dist/cli.js。请先运行 `pnpm --dir configs-package/taze-config run build` 再执行包入口测试。",
	);
}

export default defineConfig({
	test: {
		name: "taze-config",
		include: ["src/tests/**/*.test.ts"],
		environment: "node",
	},
});
