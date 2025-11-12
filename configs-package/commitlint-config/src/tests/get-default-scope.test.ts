import { describe, test, expect, vi, beforeEach } from "vitest";
import { minimatch } from "minimatch";
import { commonScopes } from "../common-scopes.ts";

describe("getDefaultScope glob matching", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("glob 匹配逻辑", () => {
		test("应该正确匹配 prompt 范围", () => {
			const filePath = "configs-package/commitlint-config/prompts/get-default-scope-by-glob.md";
			const promptScope = commonScopes.find((scope) => scope.value === "prompt");

			expect(promptScope).toBeDefined();
			expect(promptScope?.glob).toBeDefined();

			const matched = promptScope?.glob?.some((globPattern) => minimatch(filePath, globPattern));

			expect(matched).toBe(true);
		});

		test("应该正确匹配 turbo.json 文件的多个范围", () => {
			const filePath = "packages/utils/turbo.json";
			const matchedScopes: string[] = [];

			commonScopes.forEach((scopeItem) => {
				if (scopeItem.glob && scopeItem.glob.length > 0) {
					scopeItem.glob.forEach((globPattern) => {
						if (minimatch(filePath, globPattern)) {
							matchedScopes.push(scopeItem.value);
						}
					});
				}
			});

			// 应该匹配到 config 和 turbo 两个范围
			expect(matchedScopes).toContain("config");
			expect(matchedScopes).toContain("turbo");
			expect(matchedScopes.length).toBeGreaterThanOrEqual(2);
		});

		test("应该正确匹配各种配置文件", () => {
			const testFiles = [
				{ path: "vite.config.ts", expectedScope: "vite" },
				{ path: "src/vite.config.js", expectedScope: "vite" },
				{ path: "package.json", expectedScope: "package.json" },
				{ path: "packages/utils/package.json", expectedScope: "package.json" },
				{ path: "tsconfig.json", expectedScope: "tsc" },
				{ path: "apps/web/tsconfig.build.json", expectedScope: "tsc" },
			];

			testFiles.forEach(({ path, expectedScope }) => {
				const matchedScopes: string[] = [];

				commonScopes.forEach((scopeItem) => {
					if (scopeItem.glob && scopeItem.glob.length > 0) {
						scopeItem.glob.forEach((globPattern) => {
							if (minimatch(path, globPattern)) {
								matchedScopes.push(scopeItem.value);
							}
						});
					}
				});

				expect(matchedScopes).toContain(expectedScope);
			});
		});

		test("应该正确匹配 claude 配置文件", () => {
			const testFiles = [".claude/config.json", "packages/utils/.claude/memory.md", "CLAUDE.md"];

			testFiles.forEach((filePath) => {
				const claudeScope = commonScopes.find((scope) => scope.value === "claude");
				expect(claudeScope).toBeDefined();

				const matched = claudeScope?.glob?.some((globPattern) => minimatch(filePath, globPattern));

				expect(matched).toBe(true);
			});
		});

		test("应该正确匹配路由文件", () => {
			const testFiles = ["src/router/index.ts", "apps/admin/src/routers/user.ts", "packages/core/router/auth.ts"];

			testFiles.forEach((filePath) => {
				const routerScope = commonScopes.find((scope) => scope.value === "router");
				expect(routerScope).toBeDefined();

				const matched = routerScope?.glob?.some((globPattern) => minimatch(filePath, globPattern));

				expect(matched).toBe(true);
			});
		});

		test("应该正确匹配 root 范围的文件（根目录配置文件）", () => {
			const testFiles = [
				".gitignore",
				".gitattributes",
				".czrc",
				".nvmrc",
				".npmrc",
				".editorconfig",
				".prettierrc",
				".prettierrc.js",
				".eslintrc.json",
				"README.md",
				"LICENSE",
				"CHANGELOG.md",
				"Makefile",
				"Dockerfile",
			];

			testFiles.forEach((filePath) => {
				const rootScope = commonScopes.find((scope) => scope.value === "root");
				expect(rootScope).toBeDefined();
				expect(rootScope?.glob).toBeDefined();

				const matched = rootScope?.glob?.some((globPattern) => minimatch(filePath, globPattern));

				expect(matched).toBe(true);
			});
		});

		test("不应该将子包中的配置文件匹配为 root 范围", () => {
			const testFiles = [
				"packages/utils/.gitignore",
				"configs-package/commitlint-config/.prettierrc",
				"apps/web/README.md",
				"packages/core/LICENSE",
			];

			testFiles.forEach((filePath) => {
				const rootScope = commonScopes.find((scope) => scope.value === "root");
				expect(rootScope).toBeDefined();

				const matched = rootScope?.glob?.some((globPattern) => minimatch(filePath, globPattern));

				// 子包中的文件不应该匹配 root 范围
				expect(matched).toBe(false);
			});
		});

		test("不应该将 .XXX 文件夹下的文件匹配为 root 范围", () => {
			const testFiles = [
				".vscode/extensions.json",
				".github/workflows/ci.yaml",
				".claude/agents/package-linter.md",
				".changeset/config.json",
				".husky/pre-commit",
			];

			testFiles.forEach((filePath) => {
				const rootScope = commonScopes.find((scope) => scope.value === "root");
				expect(rootScope).toBeDefined();

				const matched = rootScope?.glob?.some((globPattern) => minimatch(filePath, globPattern));

				// .XXX 文件夹下的文件不应该匹配 root 范围
				expect(matched).toBe(false);
			});
		});

		test("不应该匹配不符合 glob 模式的文件", () => {
			const filePath = "src/components/Button.vue";
			const matchedScopes: string[] = [];

			commonScopes.forEach((scopeItem) => {
				if (scopeItem.glob && scopeItem.glob.length > 0) {
					scopeItem.glob.forEach((globPattern) => {
						if (minimatch(filePath, globPattern)) {
							matchedScopes.push(scopeItem.value);
						}
					});
				}
			});

			// 普通的组件文件不应该匹配到任何特殊范围
			expect(matchedScopes).toHaveLength(0);
		});
	});

	describe("边界情况测试", () => {
		test("处理空文件路径", () => {
			const filePath = "";
			const matchedScopes: string[] = [];

			commonScopes.forEach((scopeItem) => {
				if (scopeItem.glob && scopeItem.glob.length > 0) {
					scopeItem.glob.forEach((globPattern) => {
						if (minimatch(filePath, globPattern)) {
							matchedScopes.push(scopeItem.value);
						}
					});
				}
			});

			expect(matchedScopes).toHaveLength(0);
		});

		test("处理没有 glob 字段的范围配置", () => {
			const scopeWithoutGlob = commonScopes.find((scope) => !scope.glob);
			expect(scopeWithoutGlob).toBeDefined();

			// 确保有些范围配置确实没有 glob 字段
			const scopesWithoutGlob = commonScopes.filter((scope) => !scope.glob);
			expect(scopesWithoutGlob.length).toBeGreaterThan(0);
		});

		test("处理 Windows 风格的路径分隔符", () => {
			const windowsPath = "configs-package\\commitlint-config\\prompts\\test.md";
			const normalizedPath = windowsPath.replace(/\\/g, "/");

			const promptScope = commonScopes.find((scope) => scope.value === "prompt");
			const matched = promptScope?.glob?.some((globPattern) => minimatch(normalizedPath, globPattern));

			expect(matched).toBe(true);
		});
	});
});
