import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../../ai-plugins/common-tools/skills/use-memorix");
const read = (...parts: string[]) => readFileSync(resolve(root, ...parts), "utf8");
const contract = [
	[
		"CAP-03",
		"routes setup and upgrade to official Memorix with write confirmation",
		"references/setup-and-hooks.md",
		["官方", "setup", "升级", "确认"],
		["自动运行 setup"],
	],
	[
		"CAP-04",
		"keeps manual compatibility mode micro without rewriting official setup",
		"references/platform-and-mcp.md",
		["micro", "手工兼容器", "官方 setup"],
		["setup 后自动改 mode"],
	],
	[
		"CAP-05",
		"keeps ABI diagnosis and forbids same-major blind rebuild",
		"references/platform-and-mcp.md",
		["Node ABI", "同 major", "不"],
		[],
	],
	[
		"CAP-06",
		"keeps bare-command absolute-path and data-layer split",
		"references/platform-and-mcp.md",
		["裸命令", "绝对路径", "数据"],
		[],
	],
	[
		"CAP-07",
		"keeps NODE_OPTIONS trust hash restart and connected gates",
		"references/platform-and-mcp.md",
		["NODE_OPTIONS", "hash", "完全重启", "connected"],
		[],
	],
	[
		"CAP-08",
		"marks context search and detail as automatic reads",
		"references/memory-operations.md",
		["context", "search", "detail", "只读", "自动"],
		[],
	],
	[
		"CAP-09",
		"requires confirmation for store and resolve",
		"references/memory-operations.md",
		["store", "resolve", "确认"],
		["自动 store", "自动 resolve"],
	],
	[
		"CAP-10",
		"separates session reads from session and handoff writes",
		"references/session-and-reasoning.md",
		["session context", "start", "end", "handoff", "确认"],
		[],
	],
	[
		"CAP-11",
		"rejects weak archive signals and requires snapshot preview authorization successor",
		"references/retention-and-archive.md",
		["stale", "age", "low-evidence", "orphan", "successor", "快照", "预演", "授权"],
		[],
	],
	[
		"CAP-12",
		"keeps health reads automatic and gates WAL VACUUM and CodeGraph repair",
		"references/health-and-storage.md",
		["health", "WAL", "VACUUM", "CodeGraph", "确认"],
		[],
	],
	[
		"CAP-13",
		"requires authorization before dashboard start and records stop contract",
		"references/health-and-storage.md",
		["dashboard", "启动", "授权", "停止"],
		[],
	],
	[
		"CAP-14",
		"allows embedding diagnosis evaluation and gates repair",
		"references/retrieval-and-golden-set.md",
		["embedding", "诊断", "评测", "修复", "确认"],
		[],
	],
] as const;

describe("use-memorix capability matrix", () => {
	test("CAP-01 parses supported hook templates and excludes noisy events", () => {
		const jsonFiles = [
			"templates/hooks/antigravity.hooks.json",
			"templates/hooks/claude-code.settings.local.json",
			"templates/hooks/cursor.hooks.json",
			"templates/hooks/gemini-cli.settings.json",
			"templates/hooks-global/antigravity.hooks.json",
			"templates/hooks-global/claude.hooks.json",
			"templates/hooks-global/codex.hooks.json",
			"templates/hooks-global/cursor.hooks.json",
		];
		for (const file of jsonFiles) {
			const text = read(file);
			expect(() => JSON.parse(text), file).not.toThrow();
			expect(text, file).not.toMatch(/PreToolUse|PostToolUse|afterFileEdit|AfterTool/);
		}
		const windsurf = read("templates/hooks/windsurf.hooks.json");
		expect(windsurf).toContain("pre_user_prompt");
		expect(windsurf).toContain("post_cascade_response");
		expect(windsurf).not.toMatch(/post_write_code|post_run_command|post_mcp_tool_use/);
		const kiro = read("templates/hooks/kiro.memorix-file-save.kiro.hook");
		expect(kiro).toContain("enabled: false");
	});

	test("CAP-02 omits WorkBuddy hooks and legacy ZCode lifecycle template", () => {
		expect(existsSync(resolve(root, "templates/hooks/workbuddy.hooks.json"))).toBe(false);
		expect(existsSync(resolve(root, "templates/hooks/zcode.config.json"))).toBe(false);
	});

	test.each(contract)("%s %s", (_id, _name, file, required, forbidden) => {
		const text = read(file);
		for (const token of required) expect(text, `${file}: ${token}`).toContain(token);
		for (const token of forbidden) expect(text, `${file}: ${token}`).not.toContain(token);
	});

	test("CAP-15 keeps all seven official skills visible and routes v3 non-goals", () => {
		const text = read("SKILL.md");
		for (const skill of [
			"memorix-git-memory",
			"memorix-memory",
			"memorix-mini-skills",
			"memorix-orchestrate",
			"memorix-reasoning",
			"memorix-sessions",
			"memorix-troubleshooting",
		])
			expect(text).toContain(skill);
		for (const capability of ["long-term", "team", "orchestration", "transfer"])
			expect(text).toMatch(new RegExp(`${capability}.*官方|官方.*${capability}`, "i"));
	});
});
