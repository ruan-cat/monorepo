import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { isMonorepoProject } from "../monorepo";
import * as fs from "node:fs";
import { load } from "js-yaml";
import { sync } from "glob";
import { join } from "node:path";

describe("isMonorepoProject", () => {
	// 保存原始的 cwd
	let originalCwd: string;
	const monorepoRoot = join(process.cwd(), "../..");

	beforeEach(() => {
		originalCwd = process.cwd();
		// 切换到 monorepo 根目录
		process.chdir(monorepoRoot);
	});

	afterEach(() => {
		// 恢复原始的工作目录
		process.chdir(originalCwd);
	});

	describe("集成测试 - 在真实 monorepo 环境中", () => {
		test("应该正确识别当前项目为 monorepo", () => {
			// 当前项目确实是一个 monorepo 项目
			const result = isMonorepoProject();
			expect(result).toBe(true);
		});

		test("当前项目应该有有效的 pnpm-workspace.yaml", () => {
			const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");
			expect(fs.existsSync(workspaceConfigPath)).toBe(true);

			const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");
			const workspaceConfig = load(workspaceFile) as { packages?: string[] };

			expect(workspaceConfig.packages).toBeDefined();
			expect(Array.isArray(workspaceConfig.packages)).toBe(true);
			expect(workspaceConfig.packages!.length).toBeGreaterThan(0);
		});

		test("当前项目应该能匹配到多个 package.json", () => {
			const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");
			const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");
			const workspaceConfig = load(workspaceFile) as { packages?: string[] };

			let totalMatches = 0;
			workspaceConfig.packages?.forEach((pattern) => {
				const matches = sync(`${pattern}/package.json`, {
					cwd: process.cwd(),
					ignore: "**/node_modules/**",
				});
				totalMatches += matches.length;
			});

			expect(totalMatches).toBeGreaterThan(0);
		});
	});

	describe("函数行为验证", () => {
		test("isMonorepoProject 应该返回 boolean 类型", () => {
			const result = isMonorepoProject();
			expect(typeof result).toBe("boolean");
		});

		test("在 monorepo 环境中多次调用应该返回一致的结果", () => {
			const result1 = isMonorepoProject();
			const result2 = isMonorepoProject();
			const result3 = isMonorepoProject();

			expect(result1).toBe(result2);
			expect(result2).toBe(result3);
		});
	});

	describe("与其他函数的集成", () => {
		test("验证 pnpm-workspace.yaml 的 packages 配置确实有效", () => {
			// 如果 isMonorepoProject() 返回 true，说明至少匹配到了一个 package.json
			const isMonorepo = isMonorepoProject();

			if (isMonorepo) {
				const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");
				const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");
				const workspaceConfig = load(workspaceFile) as { packages?: string[] };

				// 验证配置存在
				expect(workspaceConfig.packages).toBeDefined();
				expect(workspaceConfig.packages!.length).toBeGreaterThan(0);

				// 验证至少有一个模式能匹配到文件
				let hasMatch = false;
				workspaceConfig.packages?.forEach((pattern) => {
					const matches = sync(`${pattern}/package.json`, {
						cwd: process.cwd(),
						ignore: "**/node_modules/**",
					});
					if (matches.length > 0) {
						hasMatch = true;
					}
				});

				expect(hasMatch).toBe(true);
			}
		});
	});

	describe("边界情况测试", () => {
		test("pnpm-workspace.yaml 文件应该是有效的 YAML 格式", () => {
			const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");

			if (fs.existsSync(workspaceConfigPath)) {
				const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");

				// 应该能够成功解析 YAML 文件
				expect(() => {
					load(workspaceFile);
				}).not.toThrow();
			}
		});

		test("验证 packages 配置不是空数组", () => {
			const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");

			if (fs.existsSync(workspaceConfigPath)) {
				const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");
				const workspaceConfig = load(workspaceFile) as { packages?: string[] };

				if (workspaceConfig.packages) {
					// 如果 packages 存在，它不应该是空数组
					expect(workspaceConfig.packages.length).toBeGreaterThan(0);
				}
			}
		});

		test("验证至少有一个 package.json 被匹配到", () => {
			const isMonorepo = isMonorepoProject();

			// 如果是 monorepo，必然能匹配到至少一个 package.json
			if (isMonorepo) {
				const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");
				const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");
				const workspaceConfig = load(workspaceFile) as { packages?: string[] };

				let totalMatches = 0;
				workspaceConfig.packages?.forEach((pattern) => {
					const matches = sync(`${pattern}/package.json`, {
						cwd: process.cwd(),
						ignore: "**/node_modules/**",
					});
					totalMatches += matches.length;
				});

				expect(totalMatches).toBeGreaterThan(0);
			}
		});
	});
});
