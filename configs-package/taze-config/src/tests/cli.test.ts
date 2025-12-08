import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";

describe("CLI init command", () => {
	let testDir: string;
	let originalCwd: string;

	beforeEach(() => {
		// 保存当前工作目录
		originalCwd = process.cwd();

		// 创建临时测试目录
		testDir = join(tmpdir(), `taze-config-test-${Date.now()}`);
		mkdirSync(testDir, { recursive: true });

		// 切换到测试目录
		process.chdir(testDir);
	});

	afterEach(() => {
		// 恢复原始工作目录
		process.chdir(originalCwd);

		// 清理测试目录
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true, force: true });
		}
	});

	describe("标准项目（非 monorepo）", () => {
		test("应该复制 taze.config.ts 文件", () => {
			// 创建一个标准项目的 package.json
			const packageJson = {
				name: "test-project",
				version: "1.0.0",
				scripts: {
					test: "echo test",
				},
			};
			writeFileSync(join(testDir, "package.json"), JSON.stringify(packageJson, null, 2));

			// 执行 CLI 命令
			const cliPath = join(originalCwd, "dist/cli.js");
			execSync(`node "${cliPath}" init --force`, { cwd: testDir });

			// 验证文件是否被创建
			const configFile = join(testDir, "taze.config.ts");
			expect(existsSync(configFile)).toBe(true);

			// 验证文件内容
			const content = readFileSync(configFile, "utf-8");
			expect(content).toContain('import { defineConfig } from "taze"');
			expect(content).toContain('import { defaultConfig } from "@ruan-cat/taze-config"');
			expect(content).toContain("export default defineConfig(defaultConfig)");
		});

		test("应该在 package.json 的 scripts 中添加 up-taze 命令（标准项目）", () => {
			// 创建一个标准项目的 package.json
			const packageJson = {
				name: "test-project",
				version: "1.0.0",
				scripts: {
					test: "echo test",
					build: "echo build",
				},
			};
			writeFileSync(join(testDir, "package.json"), JSON.stringify(packageJson, null, 2));

			// 执行 CLI 命令
			const cliPath = join(originalCwd, "dist/cli.js");
			execSync(`node "${cliPath}" init --force`, { cwd: testDir });

			// 读取更新后的 package.json
			const updatedPackageJson = JSON.parse(readFileSync(join(testDir, "package.json"), "utf-8"));

			// 验证 up-taze 命令是否被添加
			expect(updatedPackageJson.scripts["up-taze"]).toBe("pnpm up @ruan-cat/taze-config -L && npx taze -r");

			// 验证 up-taze 是否在第一行
			const scriptsKeys = Object.keys(updatedPackageJson.scripts);
			expect(scriptsKeys[0]).toBe("up-taze");

			// 验证其他脚本是否保留
			expect(updatedPackageJson.scripts.test).toBe("echo test");
			expect(updatedPackageJson.scripts.build).toBe("echo build");
		});

		test("应该覆盖已存在的 up-taze 命令", () => {
			// 创建一个已经有 up-taze 命令的 package.json
			const packageJson = {
				name: "test-project",
				version: "1.0.0",
				scripts: {
					"up-taze": "old command",
					test: "echo test",
				},
			};
			writeFileSync(join(testDir, "package.json"), JSON.stringify(packageJson, null, 2));

			// 执行 CLI 命令
			const cliPath = join(originalCwd, "dist/cli.js");
			execSync(`node "${cliPath}" init --force`, { cwd: testDir });

			// 读取更新后的 package.json
			const updatedPackageJson = JSON.parse(readFileSync(join(testDir, "package.json"), "utf-8"));

			// 验证 up-taze 命令是否被覆盖
			expect(updatedPackageJson.scripts["up-taze"]).toBe("pnpm up @ruan-cat/taze-config -L && npx taze -r");
			expect(updatedPackageJson.scripts["up-taze"]).not.toBe("old command");

			// 验证 up-taze 仍然在第一行
			const scriptsKeys = Object.keys(updatedPackageJson.scripts);
			expect(scriptsKeys[0]).toBe("up-taze");
		});
	});

	describe("Monorepo 项目", () => {
		test("应该在 monorepo 项目中添加正确的 up-taze 命令", () => {
			// 创建 monorepo 项目结构
			const packageJson = {
				name: "monorepo-root",
				version: "1.0.0",
				scripts: {
					test: "echo test",
				},
			};
			writeFileSync(join(testDir, "package.json"), JSON.stringify(packageJson, null, 2));

			// 创建 pnpm-workspace.yaml
			const workspaceConfig = "packages:\n  - packages/*\n";
			writeFileSync(join(testDir, "pnpm-workspace.yaml"), workspaceConfig);

			// 创建一个子包以满足 isMonorepoProject 的判断条件
			const packagesDir = join(testDir, "packages", "test-package");
			mkdirSync(packagesDir, { recursive: true });
			const subPackageJson = {
				name: "test-package",
				version: "1.0.0",
			};
			writeFileSync(join(packagesDir, "package.json"), JSON.stringify(subPackageJson, null, 2));

			// 执行 CLI 命令
			const cliPath = join(originalCwd, "dist/cli.js");
			execSync(`node "${cliPath}" init --force`, { cwd: testDir });

			// 读取更新后的 package.json
			const updatedPackageJson = JSON.parse(readFileSync(join(testDir, "package.json"), "utf-8"));

			// 验证 up-taze 命令是否使用 monorepo 格式
			expect(updatedPackageJson.scripts["up-taze"]).toBe("pnpm -w up @ruan-cat/taze-config -L && npx taze -r");

			// 验证 up-taze 是否在第一行
			const scriptsKeys = Object.keys(updatedPackageJson.scripts);
			expect(scriptsKeys[0]).toBe("up-taze");
		});

		test("应该在 monorepo 项目中复制配置文件", () => {
			// 创建 monorepo 项目结构
			const packageJson = {
				name: "monorepo-root",
				version: "1.0.0",
			};
			writeFileSync(join(testDir, "package.json"), JSON.stringify(packageJson, null, 2));

			// 创建 pnpm-workspace.yaml
			const workspaceConfig = "packages:\n  - packages/*\n";
			writeFileSync(join(testDir, "pnpm-workspace.yaml"), workspaceConfig);

			// 创建一个子包
			const packagesDir = join(testDir, "packages", "test-package");
			mkdirSync(packagesDir, { recursive: true });
			const subPackageJson = {
				name: "test-package",
				version: "1.0.0",
			};
			writeFileSync(join(packagesDir, "package.json"), JSON.stringify(subPackageJson, null, 2));

			// 执行 CLI 命令
			const cliPath = join(originalCwd, "dist/cli.js");
			execSync(`node "${cliPath}" init --force`, { cwd: testDir });

			// 验证配置文件是否被创建
			const configFile = join(testDir, "taze.config.ts");
			expect(existsSync(configFile)).toBe(true);

			// 验证文件内容
			const content = readFileSync(configFile, "utf-8");
			expect(content).toContain('import { defineConfig } from "taze"');
			expect(content).toContain('import { defaultConfig } from "@ruan-cat/taze-config"');
		});
	});

	describe("边界情况", () => {
		test("应该处理没有 scripts 字段的 package.json", () => {
			// 创建一个没有 scripts 字段的 package.json
			const packageJson = {
				name: "test-project",
				version: "1.0.0",
			};
			writeFileSync(join(testDir, "package.json"), JSON.stringify(packageJson, null, 2));

			// 执行 CLI 命令
			const cliPath = join(originalCwd, "dist/cli.js");
			execSync(`node "${cliPath}" init --force`, { cwd: testDir });

			// 读取更新后的 package.json
			const updatedPackageJson = JSON.parse(readFileSync(join(testDir, "package.json"), "utf-8"));

			// 验证 scripts 字段是否被创建并包含 up-taze
			expect(updatedPackageJson.scripts).toBeDefined();
			expect(updatedPackageJson.scripts["up-taze"]).toBe("pnpm up @ruan-cat/taze-config -L && npx taze -r");
		});

		test("应该保留 package.json 的其他字段", () => {
			// 创建一个包含各种字段的 package.json
			const packageJson = {
				name: "test-project",
				version: "1.0.0",
				description: "Test project",
				author: "Test Author",
				license: "MIT",
				scripts: {
					test: "echo test",
				},
				dependencies: {
					lodash: "^4.17.21",
				},
				devDependencies: {
					vitest: "^1.0.0",
				},
			};
			writeFileSync(join(testDir, "package.json"), JSON.stringify(packageJson, null, 2));

			// 执行 CLI 命令
			const cliPath = join(originalCwd, "dist/cli.js");
			execSync(`node "${cliPath}" init --force`, { cwd: testDir });

			// 读取更新后的 package.json
			const updatedPackageJson = JSON.parse(readFileSync(join(testDir, "package.json"), "utf-8"));

			// 验证其他字段是否保留
			expect(updatedPackageJson.name).toBe("test-project");
			expect(updatedPackageJson.version).toBe("1.0.0");
			expect(updatedPackageJson.description).toBe("Test project");
			expect(updatedPackageJson.author).toBe("Test Author");
			expect(updatedPackageJson.license).toBe("MIT");
			expect(updatedPackageJson.dependencies).toEqual({ lodash: "^4.17.21" });
			expect(updatedPackageJson.devDependencies).toEqual({ vitest: "^1.0.0" });
		});
	});
});
