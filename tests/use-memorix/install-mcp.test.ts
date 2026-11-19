import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { join, resolve } from "node:path";
import * as fs from "node:fs";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import * as os from "node:os";
import { tmpdir } from "node:os";

import { installMemorixMcp } from "../../ai-plugins/common-tools/skills/use-memorix/src/install-mcp.ts";
import type { McpPlatform } from "../../ai-plugins/common-tools/skills/use-memorix/src/platforms.ts";
import { DEFAULT_MCP_PLATFORMS } from "../../ai-plugins/common-tools/skills/use-memorix/src/platforms.ts";

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
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "micro"]);
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
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "micro"]);
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
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "micro"]);
		});

		test('A4: 配置文件有 memorix 但 args 是 ["serve"]（等价 micro）→ 应该跳过', () => {
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
			expect(results[0].status).toBe("skipped");
			expect(results[0].previousArgs).toEqual(["serve"]);

			const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
			expect(content.mcpServers.memorix.args).toEqual(["serve"]);
			expect(content.mcpServers.memorix.command).toBe("memorix");
		});

		test('A5: 配置文件有 memorix 且 args 是 ["serve", "--mode", "full"] → 应该校准为 micro', () => {
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
			expect(results[0].status).toBe("updated");
			expect(results[0].previousArgs).toEqual(["serve", "--mode", "full"]);

			const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "micro"]);
		});

		test('A6: 配置文件有 memorix 且 args 是 ["serve", "--mode", "team"] → 应该更新为 ["serve", "--mode", "micro"]', () => {
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
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "micro"]);
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
							memorix: { command: "memorix", args: ["serve", "--mode", "team"] },
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
			expect(content).toContain('args = ["serve", "--mode", "micro"]');
		});

		test("B2: TOML 文件存在但没有 memorix 部分 → 应该追加，不覆盖已有内容", () => {
			const configPath = join(tempDir, "mcp.toml");
			fs.writeFileSync(configPath, '[other]\nkey = "value"\n');
			const platforms = [createTestPlatform(configPath, "toml")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");

			const content = fs.readFileSync(configPath, "utf-8");
			expect(content).toContain("[other]");
			expect(content).toContain("[mcpServers.memorix]");
			expect(content).toContain('args = ["serve", "--mode", "micro"]');
		});

		test("B3: TOML 文件有 memorix 但 args 需要更新 → 应该更新", () => {
			const configPath = join(tempDir, "mcp.toml");
			fs.writeFileSync(configPath, '[mcpServers.memorix]\ncommand = "memorix"\nargs = ["serve", "--mode", "team"]\n');
			const platforms = [createTestPlatform(configPath, "toml")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");
			expect(results[0].previousArgs).toEqual(["serve", "--mode", "team"]);

			const content = fs.readFileSync(configPath, "utf-8");
			expect(content).toContain('args = ["serve", "--mode", "micro"]');
		});

		test("B4: TOML 文件有 memorix 且已经是 micro 模式 → 应该跳过", () => {
			const configPath = join(tempDir, "mcp.toml");
			fs.writeFileSync(configPath, '[mcpServers.memorix]\ncommand = "memorix"\nargs = ["serve", "--mode", "micro"]\n');
			const platforms = [createTestPlatform(configPath, "toml")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("skipped");
			expect(results[0].previousArgs).toEqual(["serve", "--mode", "micro"]);
		});

		test("B5: TOML 文件使用单引号数组 → 应该正确解析并更新", () => {
			const configPath = join(tempDir, "mcp.toml");
			fs.writeFileSync(configPath, "[mcpServers.memorix]\ncommand = 'memorix'\nargs = ['serve', '--mode', 'team']\n");
			const platforms = [createTestPlatform(configPath, "toml")];

			const results = installMemorixMcp(platforms);

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe("updated");
			expect(results[0].previousArgs).toEqual(["serve", "--mode", "team"]);

			const content = fs.readFileSync(configPath, "utf-8");
			expect(content).toContain('args = ["serve", "--mode", "micro"]');
		});
	});

	// ───────────────────────────────────────────────
	// 场景 C：边界情况
	// ───────────────────────────────────────────────
	describe("场景 C：边界情况", () => {
		test("C1: 多个候选配置文件，第一个不存在但第二个存在 → 应该处理第二个", () => {
			const firstPath = join(tempDir, "first.json");
			const secondPath = join(tempDir, "second.json");
			fs.writeFileSync(secondPath, JSON.stringify({ mcpServers: {} }, null, 2));

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
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "micro"]);
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

		test("C3: 空的 args 数组 → 应该更新为 micro 模式", () => {
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
			expect(content.mcpServers.memorix.args).toEqual(["serve", "--mode", "micro"]);
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

// ───────────────────────────────────────────────
// 原字节迁移 characterization（MCP-01～MCP-04）
// ───────────────────────────────────────────────
const compatRoots: string[] = [];
const repoRoot = resolve(import.meta.dirname, "../..");
const psPath = resolve(repoRoot, "ai-plugins/common-tools/skills/use-memorix/fallback/install-mcp.ps1");
const shPath = resolve(repoRoot, "ai-plugins/common-tools/skills/use-memorix/fallback/install-mcp.sh");
const legacyRelative = "ai-plugins/low-frequency-skill/skills/init-simple-memorix/";

/**
 * 解析旧技能字节基线。
 *
 * 优先使用显式 PRE_CUTOVER_SHA；否则使用当前 HEAD（删除前），再否则用「删除该路径的提交的父提交」。
 * 后两条回退保证 cutover 删除旧目录后仍能复验原字节，而不是靠 `test.skip` 绕过。
 */
function resolveBaselineSha(): string {
	const fromEnv = process.env.PRE_CUTOVER_SHA;
	if (fromEnv && /^[a-f0-9]{40}$/.test(fromEnv)) return fromEnv;
	const atHead = spawnSync("git", ["cat-file", "-e", `HEAD:${legacyRelative}SKILL.md`], { cwd: repoRoot });
	if (atHead.status === 0) return "HEAD";
	const deletion = spawnSync(
		"git",
		["log", "-1", "--format=%H", "--diff-filter=D", "--", `${legacyRelative}SKILL.md`],
		{
			cwd: repoRoot,
			encoding: "utf8",
		},
	);
	const sha = (deletion.stdout ?? "").trim();
	if (sha) return `${sha}^`;
	throw new Error("PRE_CUTOVER_SHA required: 无法从 git 历史解析旧技能基线");
}
const baselineSha = resolveBaselineSha();

function compatTemp(prefix: string) {
	const dir = mkdtempSync(join(tmpdir(), prefix));
	compatRoots.push(dir);
	return dir;
}
function platform(path: string, format: "json" | "toml", serverPath?: string[]): McpPlatform {
	return { name: "fixture", configFiles: [path], format, serverPath };
}
afterEach(() => compatRoots.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function oldBytes(relative: string): Buffer {
	const path = `${legacyRelative}${relative}`;
	const result = spawnSync("git", ["show", `${baselineSha}:${path}`], { cwd: repoRoot });
	if (result.status !== 0) throw new Error(result.stderr.toString());
	return result.stdout;
}
function snapshot(dir: string, prefix = ""): Record<string, string> {
	return Object.fromEntries(
		readdirSync(dir, { withFileTypes: true }).flatMap((entry): Array<[string, string]> => {
			const name = `${prefix}${entry.name}`;
			return entry.isDirectory()
				? Object.entries(snapshot(join(dir, entry.name), `${name}/`))
				: [[name, readFileSync(join(dir, entry.name)).toString("base64")]];
		}),
	);
}
function isolatedRun(bytes: Buffer, ext: string, executable: string) {
	const root = compatTemp("compat-");
	const home = join(root, "home");
	mkdirSync(join(home, ".cursor"), { recursive: true });
	writeFileSync(
		join(home, ".cursor/mcp.json"),
		JSON.stringify({
			mcpServers: {
				other: { command: "keep" },
				memorix: { command: "cmd", args: ["/c", "memorix.cmd", "serve", "--mode", "full"] },
			},
		}),
	);
	const script = join(root, `install.${ext}`);
	writeFileSync(script, bytes);
	const args = ext === "ps1" ? ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script] : [script];
	const result = spawnSync(executable, args, {
		cwd: root,
		encoding: "utf8",
		timeout: 30000,
		env: { ...process.env, HOME: home, USERPROFILE: home },
	});
	if (result.error) throw result.error;
	return { status: result.status, files: snapshot(home) };
}

describe("legacy MCP installer characterization", () => {
	test("MCP-01 preserves JSON and TOML installer behavior", () => {
		const dir = compatTemp("memorix-mcp-");
		const json = join(dir, "mcp.json");
		const toml = join(dir, "mcp.toml");
		writeFileSync(
			json,
			JSON.stringify(
				{
					mcpServers: {
						other: { command: "x" },
						memorix: {
							command: "cmd",
							args: ["/c", "memorix.cmd", "serve", "--mode", "full"],
						},
					},
				},
				null,
				2,
			),
		);
		writeFileSync(
			toml,
			'[mcp_servers.memorix]\ncommand = "cmd"\nargs = ["/c", "memorix.cmd", "serve", "--mode", "team"]\n',
		);
		const results = installMemorixMcp([platform(json, "json"), platform(toml, "toml", ["mcp_servers"])]);
		expect(results.map((item) => item.status)).toEqual(["updated", "updated"]);
		const parsed = JSON.parse(readFileSync(json, "utf8"));
		expect(parsed.mcpServers.other).toEqual({ command: "x" });
		expect(parsed.mcpServers.memorix.command).toBe("cmd");
		expect(parsed.mcpServers.memorix.args).toEqual(["/c", "memorix.cmd", "serve", "--mode", "micro"]);
		expect(readFileSync(toml, "utf8")).toContain('["/c", "memorix.cmd", "serve", "--mode", "micro"]');
	});

	test("MCP-02 preserves PowerShell BOM targeted writes and status vocabulary", () => {
		const bytes = readFileSync(psPath);
		expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
		const source = bytes.toString("utf8");
		expect(source).toContain("Get-JsonBracketEnd");
		expect(source).toContain("Emit-Result");
		expect(source).toContain("-Status 'ok'");
		expect(bytes.equals(oldBytes("fallback/install-mcp.ps1"))).toBe(true);
		for (const exe of ["powershell.exe", "pwsh.exe"]) {
			const probe = spawnSync(exe, ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.Major"], {
				encoding: "utf8",
			});
			if (probe.error && (probe.error as NodeJS.ErrnoException).code === "ENOENT") {
				console.warn(`[MCP-02] 解释器不可用，跳过该链路: ${exe}`);
				continue;
			}
			const actual = isolatedRun(bytes, "ps1", exe);
			const legacy = isolatedRun(oldBytes("fallback/install-mcp.ps1"), "ps1", exe);
			expect(actual, exe).toEqual(legacy);
			expect(Object.keys(actual.files), exe).toContain(".cursor/mcp.json");
		}
	}, 180000);

	test("MCP-03 preserves jq and no-jq fallback behavior", () => {
		const source = readFileSync(shPath, "utf8");
		expect(source).toContain("process_json_jq");
		expect(source).toContain("process_json_fallback");
		expect(source).toContain("refusing to modify existing JSON");
		expect(source).toContain("setpath($mp;");
		const bytes = readFileSync(shPath);
		expect(bytes.equals(oldBytes("fallback/install-mcp.sh"))).toBe(true);
		const actual = isolatedRun(bytes, "sh", "bash");
		const legacy = isolatedRun(oldBytes("fallback/install-mcp.sh"), "sh", "bash");
		expect(actual).toEqual(legacy);
		expect(Object.keys(actual.files)).toContain(".cursor/mcp.json");
	}, 180000);

	test("MCP-04 handles only the first existing TypeScript candidate", () => {
		const dir = compatTemp("memorix-candidates-");
		const first = join(dir, "first.json");
		const second = join(dir, "second.json");
		mkdirSync(dir, { recursive: true });
		writeFileSync(second, JSON.stringify({ mcpServers: {} }));
		const result = installMemorixMcp([{ name: "multi", configFiles: [first, second], format: "json" }]);
		expect(result).toHaveLength(1);
		expect(result[0].configFile).toBe(second);
		expect(JSON.parse(readFileSync(second, "utf8")).mcpServers.memorix).toBeDefined();
	});
});
