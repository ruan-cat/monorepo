import { defineConfig } from "vitest/config";

/**
 * tests/ 目录下无独立配置的 skill 测试子目录的公共 vitest 配置。
 *
 * include 显式列出纳入本 project 的子目录（spec：只发现具有明确配置或明确列出的测试目录）。
 * 新增 node 测试子目录时，必须在此 include 中登记，或为其建立独立 vitest 配置并加入根 projects。
 *
 * 注意：useIconEffect（jsdom）与 cleanup-agent-team-node-processes（具名 include + 超时）拥有
 * 各自的 vitest 配置并在根 projects 中单独引用，不要把它们的测试并入本 include，避免重复发现。
 */
export default defineConfig({
	test: {
		name: "tests-node",
		environment: "node",
		include: [
			"clean-vercel-deployment-storage/**/*.test.ts",
			"init-prettier-git-hooks/**/*.test.ts",
			"init-shadcn-docs-nuxt/**/*.test.ts",
			"init-simple-memorix/**/*.test.ts",
			"sync-local-global-agents-skills/**/*.test.ts",
		],
	},
});
