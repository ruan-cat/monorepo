import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const cleanupProjectName = "cleanup-agent-team-node-processes";
const cleanupProjectSelected = process.argv.some(
	(arg, index) =>
		arg === `--project=${cleanupProjectName}` ||
		(arg === "--project" && process.argv[index + 1] === cleanupProjectName),
);

export default defineConfig({
	plugins: [
		// 放弃在vitest内使用路径别名 跳过
		/**
		 * 用于解决 vitest 测试用例的路径别名问题
		 * @see https://cn.vitest.dev/guide/common-errors.html#cannot-find-module-relative-path
		 */
		// tsconfigPaths({
		// 	projects: ["./tsconfig.test.json"],
		// }),
		// tsconfigPaths(),
		// tsAlias({
		// 	tsConfigName: "./tsconfig.test.json",
		// }),
	],

	test: {
		reporters: cleanupProjectSelected ? ["default"] : ["html"],
		outputFile: cleanupProjectSelected ? undefined : "./.vitest-reporter-html/index.html",
		// Vitest projects 显式清单（等价迁移自 vitest.workspace.ts，消除 packages/* 宽 glob 隐式发现）。
		// 只收录具有独立 vitest 配置的包与明确列出的测试目录；skill-router-mcp（vitest4+cloudflare pool）
		// 与 release-toolkit（自研 runner）走独立轨道，不进根发现。
		projects: [
			"packages/utils/vitest.config.ts",
			"packages/domains/vitest.config.ts",
			"packages/cf-build-notifier/vitest.config.ts",
			"packages/vercel-deploy-tool/vitest.config.ts",
			"packages/vitepress-preset-config/vitest.config.ts",
			"configs-package/commitlint-config/vitest.config.ts",
			"configs-package/taze-config/vitest.config.ts",
			"tests/vitest.config.ts",
			"tests/useIconEffect/vitest.config.ts",
			"tests/cleanup-agent-team-node-processes/vitest.config.ts",
		],
		// 放弃在测试用例中使用别名 这些配置都无效
		// alias: {
		// 	"@utils": resolve(__dirname, "packages/utils/src/index.ts"),
		// 	"@utils-tests": resolve(__dirname, "./packages/utils/tests"),
		// },
	},
});
