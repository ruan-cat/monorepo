import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

import { installMemorixMcp } from "../../ai-plugins/common-tools/skills/init-simple-memorix/src/install-mcp.ts";
import { DEFAULT_MCP_PLATFORMS } from "../../ai-plugins/common-tools/skills/init-simple-memorix/src/platforms.ts";

/**
 * 测试 installMemorixMcp 的 MCP 配置文件维护逻辑
 *
 * 覆盖场景：
 * - JSON 格式配置文件的创建、更新、跳过
 * - TOML 格式配置文件的创建、更新、跳过
 * - 边界情况：候选路径、解析错误、空 args 等
 */
describe("installMemorixMcp", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(join(os.tmpdir(), "memorix-mcp-test-"));
	});

	afterEach(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	// 辅助函数：创建单个平台的测试配置
	function createTestPlatform(configPath: string, format: "json" | "toml") {
		return {
			name: "test-platform",
			configFiles: [configPath],
			format,
		};
	}

	// ───────────────────────────────────────────────
	// 场景 A：JSON 格式配置文件
	// ───────────────────────────────────────────────
	describe("场景 A：JSON 格式配置文件", () => {
		test("A1: 配置文件不存在 → 应该创建新文件，包含正确的 memorix 配置", () => {
			const configPath = join(tempDir, "mcp.json");
			const platforms = [createTestPlatform(configPath, "json")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("created");
			expect(fs.existsSync(configPath)).toBe(true);

			const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
			expect(content.mcpServers).toBeDefined();
			expect(content.mcpServers.memorix).toBeDefined();
			expect(content.mcpServers.memorix.command).toBe("memorix");
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "full"]);
		});

		test("A2: 配置文件存在但没有 mcpServers → 应该添加 mcpServers.memorix", () => {
			const configPath = join(tempDir, "mcp.json");
			fs.writeFileSync(configPath, JSON.stringify({ someOtherField: true }, null, 2));
			const platforms = [createTestPlatform(configPath, "json")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");

			const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
			expect(content.someOtherField).toBe(true);
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "full"]);
			expect(content.mcpServers.memorix.command).toBe("memorix");
		});

		test("A3: 配置文件有 mcpServers 但没有 memorix → 应该添加 memorix，不删除已有 server", () => {
			const configPath = join(tempDir, "mcp.json");
			fs.writeFileSync(
				configPath,
				JSON.stringify(
					{
						mcpServers: {
							otherServer: { command: "node", args: ["index.js"] },
						},
					},
					null,
					2,
				),
			);
			const platforms = [createTestPlatform(configPath, "json")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");

			const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
			expect(content.mcpServers.otherServer).toBeDefined();
			expect(content.mcpServers.memorix.command).toBe("memorix");
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "full"]);
		});

		test('A4: 配置文件有 memorix 但 args 是 ["serve"] → 应该更新为 ["serve", "--mode", "full"]', () => {
			const configPath = join(tempDir, "mcp.json");
			fs.writeFileSync(
				configPath,
				JSON.stringify(
					{
						mcpServers: {
							memorix: { command: "memorix", args: ["serve"] },
						},
					},
					null,
					2,
				),
			);
			const platforms = [createTestPlatform(configPath, "json")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");
			expect(results[0].previousArgs).toEqual(["serve"]);

			const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "full"]);
			expect(content.mcpServers.memorix.command).toBe("memorix");
		});

		test('A5: 配置文件有 memorix 且 args 已经是 ["serve", "--mode", "full"] → 应该跳过', () => {
			const configPath = join(tempDir, "mcp.json");
			fs.writeFileSync(
				configPath,
				JSON.stringify(
					{
						mcpServers: {
							memorix: { command: "memorix", args: ["serve", "--mode", "full"] },
						},
					},
					null,
					2,
				),
			);
			const platforms = [createTestPlatform(configPath, "json")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("skipped");
			expect(results[0].previousArgs).toEqual(["serve", "--mode", "full"]);
		});

		test('A6: 配置文件有 memorix 且 args 是 ["serve", "--mode", "team"] → 应该更新为 ["serve", "--mode", "full"]', () => {
			const configPath = join(tempDir, "mcp.json");
			fs.writeFileSync(
				configPath,
				JSON.stringify(
					{
						mcpServers: {
							memorix: { command: "memorix", args: ["serve", "--mode", "team"] },
						},
					},
					null,
					2,
				),
			);
			const platforms = [createTestPlatform(configPath, "json")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");
			expect(results[0].previousArgs).toEqual(["serve", "--mode", "team"]);

			const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "full"]);
		});

		test("A7: dryRun 模式 → 不应该实际写入文件（即使是创建操作）", () => {
			const configPath = join(tempDir, "mcp.json");
			const platforms = [createTestPlatform(configPath, "json")];

			const results = installMemorixMcp(platforms, { dryRun: true });

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("created");
			expect(fs.existsSync(configPath)).toBe(false);
		});

		test("A8: dryRun 模式且文件已存在 → 不应该修改文件", () => {
			const configPath = join(tempDir, "mcp.json");
			fs.writeFileSync(
				configPath,
				JSON.stringify(
					{
						mcpServers: {
							memorix: { command: "memorix", args: ["serve"] },
						},
					},
					null,
					2,
				),
			);
			const originalContent = fs.readFileSync(configPath, "utf-8");
			const platforms = [createTestPlatform(configPath, "json")];

			const results = installMemorixMcp(platforms, { dryRun: true });

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");
			expect(fs.readFileSync(configPath, "utf-8")).toBe(originalContent);
		});
	});

	// ───────────────────────────────────────────────
	// 场景 B：TOML 格式配置文件
	// ───────────────────────────────────────────────
	describe("场景 B：TOML 格式配置文件", () => {
		test("B1: TOML 文件不存在 → 应该创建新文件", () => {
			const configPath = join(tempDir, "mcp.toml");
			const platforms = [createTestPlatform(configPath, "toml")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("created");
			expect(fs.existsSync(configPath)).toBe(true);

			const content = fs.readFileSync(configPath, "utf-8");
			expect(content).toContain("[mcpServers.memorix]");
			expect(content).toContain('command = "memorix"');
			expect(content).toContain('args = ["serve", "--mode", "full"]');
		});

		test("B2: TOML 文件存在但没有 memorix 部分 → 应该追加，不覆盖已有内容", () => {
			const configPath = join(tempDir, "mcp.toml");
			fs.writeFileSync(configPath, "[other]\nkey = \"value\"\n");
			const platforms = [createTestPlatform(configPath, "toml")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");

			const content = fs.readFileSync(configPath, "utf-8");
			expect(content).toContain("[other]");
			expect(content).toContain("[mcpServers.memorix]");
			expect(content).toContain('args = ["serve", "--mode", "full"]');
		});

		test("B3: TOML 文件有 memorix 但 args 需要更新 → 应该更新", () => {
			const configPath = join(tempDir, "mcp.toml");
			fs.writeFileSync(
				configPath,
				'[mcpServers.memorix]\ncommand = "memorix"\nargs = ["serve"]\n',
			);
			const platforms = [createTestPlatform(configPath, "toml")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");
			expect(results[0].previousArgs).toEqual(["serve"]);

			const content = fs.readFileSync(configPath, "utf-8");
			expect(content).toContain('args = ["serve", "--mode", "full"]');
		});

		test("B4: TOML 文件有 memorix 且已经是 full 模式 → 应该跳过", () => {
			const configPath = join(tempDir, "mcp.toml");
			fs.writeFileSync(
				configPath,
				'[mcpServers.memorix]\ncommand = "memorix"\nargs = ["serve", "--mode", "full"]\n',
			);
			const platforms = [createTestPlatform(configPath, "toml")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("skipped");
			expect(results[0].previousArgs).toEqual(["serve", "--mode", "full"]);
		});

		test("B5: TOML 文件使用单引号数组 → 应该正确解析并更新", () => {
			const configPath = join(tempDir, "mcp.toml");
			fs.writeFileSync(
				configPath,
				"[mcpServers.memorix]\ncommand = 'memorix'\nargs = ['serve']\n",
			);
			const platforms = [createTestPlatform(configPath, "toml")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");

			const content = fs.readFileSync(configPath, "utf-8");
			expect(content).toContain('args = ["serve", "--mode", "full"]');
		});
	});

	// ───────────────────────────────────────────────
	// 场景 C：边界情况
	// ───────────────────────────────────────────────
	describe("场景 C：边界情况", () => {
		test("C1: 多个候选配置文件，第一个不存在但第二个存在 → 应该处理第二个", () => {
			const firstPath = join(tempDir, "first.json");
			const secondPath = join(tempDir, "second.json");
			fs.writeFileSync(
				secondPath,
				JSON.stringify({ mcpServers: {} }, null, 2),
			);

			const platforms = [
				{
					name: "multi-candidate",
					configFiles: [firstPath, secondPath],
					format: "json" as const,
				},
			];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");
			expect(results[0].configFile).toBe(secondPath);

			const content = JSON.parse(fs.readFileSync(secondPath, "utf-8"));
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "full"]);
		});

		test("C2: JSON 解析错误 → 应该返回 error 状态", () => {
			const configPath = join(tempDir, "invalid.json");
			fs.writeFileSync(configPath, "{ invalid json content");
			const platforms = [createTestPlatform(configPath, "json")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("error");
			expect(results[0].error).toBeDefined();
		});

		test("C3: 空的 args 数组 → 应该更新为 full 模式", () => {
			const configPath = join(tempDir, "mcp.json");
			fs.writeFileSync(
				configPath,
				JSON.stringify(
					{
						mcpServers: {
							memorix: { command: "memorix", args: [] },
						},
					},
					null,
					2,
				),
			);
			const platforms = [createTestPlatform(configPath, "json")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");

			const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "full"]);
		});

		test("C4: 使用 extraConfigs 自定义路径 → 应该处理额外配置", () => {
			const customPath = join(tempDir, "custom-mcp.json");
			const platforms: typeof DEFAULT_MCP_PLATFORMS = [];

			const results = installMemorixMcp(platforms, { extraConfigs: [customPath] });

			expect(results).toHaveLength(1);
			expect(results[0].platform).toContain("custom-custom-mcp.json");
			expect(results[0].status).toBe("created");
		});
	});

	// ───────────────────────────────────────────────
	// DEFAULT_MCP_PLATFORMS 基础校验
	// ───────────────────────────────────────────────
	describe("DEFAULT_MCP_PLATFORMS", () => {
		test("应该导出非空的平台配置数组", () => {
			expect(DEFAULT_MCP_PLATFORMS).toBeDefined();
			expect(Array.isArray(DEFAULT_MCP_PLATFORMS)).toBe(true);
			expect(DEFAULT_MCP_PLATFORMS.length).toBeGreaterThan(0);
		});

		test("每个平台配置应该包含必要的字段", () => {
			for (const platform of DEFAULT_MCP_PLATFORMS) {
				expect(platform.name).toBeDefined();
				expect(typeof platform.name).toBe("string");
				expect(platform.configFiles).toBeDefined();
				expect(Array.isArray(platform.configFiles)).toBe(true);
				expect(platform.configFiles.length).toBeGreaterThan(0);
				expect(platform.format).toMatch(/^(json|toml)$/);
			}
		});
	});
});
