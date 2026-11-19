import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const BASELINE_PATHS = ["docs/prompts/release-ai-plugins/02.md"];
export const RUNTIME_PATH = "docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills/handoff.md";

export const CUTOVER_PATHS = [
	"ai-plugins/tsconfig.use-memorix.json",
	"ai-plugins/common-tools/skills/use-memorix/SKILL.md",
	"ai-plugins/common-tools/skills/use-memorix/fallback/install-mcp.ps1",
	"ai-plugins/common-tools/skills/use-memorix/fallback/install-mcp.sh",
	"ai-plugins/common-tools/skills/use-memorix/references/setup-and-hooks.md",
	"ai-plugins/common-tools/skills/use-memorix/references/platform-and-mcp.md",
	"ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md",
	"ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md",
	"ai-plugins/common-tools/skills/use-memorix/references/retention-and-archive.md",
	"ai-plugins/common-tools/skills/use-memorix/references/health-and-storage.md",
	"ai-plugins/common-tools/skills/use-memorix/references/retrieval-and-golden-set.md",
	"ai-plugins/common-tools/skills/use-memorix/scripts/install-mcp.ts",
	"ai-plugins/common-tools/skills/use-memorix/scripts/golden-set-operator.mjs",
	"ai-plugins/common-tools/skills/use-memorix/scripts/install-zcode-hook.mjs",
	"ai-plugins/common-tools/skills/use-memorix/scripts/capture-interactive.mjs",
	"ai-plugins/common-tools/skills/use-memorix/scripts/zcode-retrieval-capture.mjs",
	"ai-plugins/common-tools/skills/use-memorix/src/install-mcp.ts",
	"ai-plugins/common-tools/skills/use-memorix/src/platforms.ts",
	"ai-plugins/common-tools/skills/use-memorix/src/golden-set/contracts.mjs",
	"ai-plugins/common-tools/skills/use-memorix/src/golden-set/redaction.mjs",
	"ai-plugins/common-tools/skills/use-memorix/src/golden-set/capture.mjs",
	"ai-plugins/common-tools/skills/use-memorix/src/golden-set/operator.mjs",
	"ai-plugins/common-tools/skills/use-memorix/src/golden-set/zcode-install.mjs",
	"ai-plugins/common-tools/skills/use-memorix/templates/golden-set/README.md",
	"ai-plugins/common-tools/skills/use-memorix/templates/golden-set/cases.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/antigravity.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/claude-code.settings.local.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/cursor.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/gemini-cli.settings.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/kiro.memorix-file-save.kiro.hook",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/windsurf.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/antigravity.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/claude.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/codex.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/cursor.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/zcode/config.fragment.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/zcode/retrieval-capture-launcher.mjs",
	"ai-plugins/common-tools/skills/init-ai-md/SKILL.md",
	"ai-plugins/common-tools/skills/init-ai-md/references/execution-examples.md",
	"ai-plugins/common-tools/skills/init-ai-md/references/step-details.md",
	"ai-plugins/common-tools/skills/init-ai-md/templates/12.memorix-memory-governance.md",
	"ai-plugins/common-tools/skills/install-mcp/SKILL.md",
	"ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md",
	"ai-plugins/common-tools/skills/release-ai-plugins/README.md",
	"ai-plugins/common-tools/skills/release-ai-plugins/references/release-contract.md",
	"ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1",
	"ai-plugins/common-tools/skills/release-ai-plugins/scripts/skill-transitions.ps1",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/SKILL.md",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/README.md",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/sync.ts",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/audit-memorix-skills.ts",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix-audit.ts",
	"tests/vitest.config.ts",
	"tests/use-memorix/cutover-scope.mjs",
	...Array.from(
		{ length: 12 },
		(_, index) => `tests/use-memorix/commands/task-${String(index + 1).padStart(2, "0")}.txt`,
	),
	"tests/use-memorix/scope-gate.test.ts",
	"tests/use-memorix/install-mcp.test.ts",
	"tests/use-memorix/capability-matrix.test.ts",
	"tests/use-memorix/golden-set-contracts.test.ts",
	"tests/use-memorix/retrieval-capture.test.ts",
	"tests/use-memorix/zcode-install-operator.test.ts",
	"tests/use-memorix/release-surface.test.ts",
	"tests/init-ai-md/memorix-governance.test.ts",
	"tests/release-ai-plugins/skill-transitions.test.ts",
	"tests/sync-local-global-agents-skills/memorix.test.ts",
	"tests/sync-local-global-agents-skills/sync.test.ts",
	"ai-plugins/common-tools/README.md",
	"ai-plugins/dev-skills/README.md",
	"ai-plugins/low-frequency-skill/README.md",
	"ai-plugins/docs/README.md",
	"ai-plugins/docs/use-vercel-skills-install.md",
	"README.md",
	".claude-plugin/README.md",
	".cursor-plugin/README.md",
	".agents/plugins/README.md",
	"ai-plugins/common-tools/CHANGELOG.md",
	"ai-plugins/dev-skills/CHANGELOG.md",
	"ai-plugins/low-frequency-skill/CHANGELOG.md",
	".claude-plugin/marketplace.json",
	".cursor-plugin/marketplace.json",
	".agents/plugins/marketplace.json",
	...["common-tools", "dev-skills", "low-frequency-skill"].flatMap((plugin) =>
		["claude", "cursor", "codex"].map((host) => `ai-plugins/${plugin}/.${host}-plugin/plugin.json`),
	),
	"ai-plugins/skill-registry.json",
	"packages/skill-router-mcp/tests/real-skill-resources.test.ts",
	".github/workflows/ai-plugins-skill-registry-check.yml",
	"AGENTS.md",
	"docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills/spec.md",
	"docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills/plan.md",
	RUNTIME_PATH,
];

const oldRoot = "ai-plugins/low-frequency-skill/skills/init-simple-memorix/";
export const DELETE_PATHS = [
	...[
		"SKILL.md",
		"fallback/install-mcp.ps1",
		"fallback/install-mcp.sh",
		"references/hooks-reference.md",
		"references/memorix-setup-notes.md",
		"references/workbuddy-mcp-notes.md",
		"scripts/install-mcp.ts",
		"src/install-mcp.ts",
		"src/platforms.ts",
		"templates-global/antigravity.hooks.json",
		"templates-global/claude.hooks.json",
		"templates-global/codex.hooks.json",
		"templates-global/cursor.hooks.json",
		"templates/antigravity.hooks.json",
		"templates/claude-code.settings.local.json",
		"templates/cursor.hooks.json",
		"templates/gemini-cli.settings.json",
		"templates/kiro.memorix-file-save.kiro.hook",
		"templates/windsurf.hooks.json",
		"templates/workbuddy.hooks.json",
		"templates/zcode.config.json",
	].map((file) => oldRoot + file),
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/fetch-memorix-skills.ts",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts",
	"tests/init-simple-memorix/install-mcp.test.ts",
];

function runGit(repoRoot, args) {
	const result = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" });
	if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
	return result.stdout;
}

export function parseStatus(raw) {
	const parts = raw.split("\0");
	const rows = [];
	for (let i = 0; i < parts.length; i++) {
		if (!parts[i]) continue;
		const xy = parts[i].slice(0, 2);
		const path = parts[i].slice(3);
		if (/[RC]/.test(xy)) throw new Error("rename-status-rejected: use --no-renames");
		rows.push({ xy, path });
	}
	return rows;
}
export function statusPaths(repoRoot) {
	return parseStatus(runGit(repoRoot, ["status", "--porcelain=v1", "--untracked-files=all", "--no-renames", "-z"]));
}
export function unexpectedRows(rows, mode = "implementation") {
	return rows.filter(({ path, xy }) => {
		if (BASELINE_PATHS.includes(path)) return xy !== " M";
		if (mode === "runtime") return path !== RUNTIME_PATH || ![" M", "M "].includes(xy);
		if (DELETE_PATHS.includes(path)) return ![" D", "D "].includes(xy);
		return !CUTOVER_PATHS.includes(path) || !["??", " M", "M ", "A ", "AM"].includes(xy);
	});
}
export function unexpectedPaths(repoRoot, mode = "implementation") {
	return unexpectedRows(statusPaths(repoRoot), mode);
}
export function assertStagedEqual(rows, expected) {
	const actual = rows
		.filter(({ xy }) => xy[0] !== " " && xy !== "??")
		.map(({ path }) => path)
		.sort();
	if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) throw new Error("staged-set-mismatch");
	if (rows.some(({ path, xy }) => !BASELINE_PATHS.includes(path) && xy[1] !== " "))
		throw new Error("unstaged-cutover-change");
}
export function writePathspec(cwd) {
	const rows = statusPaths(cwd);
	if (unexpectedRows(rows).length) throw new Error("unexpected-status");
	const changed = rows.filter(({ path }) => !BASELINE_PATHS.includes(path)).map(({ path }) => path);
	for (const path of DELETE_PATHS) {
		if (!changed.includes(path)) throw new Error(`missing-required-deletion: ${path}`);
	}
	const target = resolve(cwd, ".git/use-memorix-cutover.pathspec");
	writeFileSync(target, `${changed.join("\0")}\0`, "utf8");
	return target;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const [action = "verify", mode = "implementation"] = process.argv.slice(2);
	const cwd = process.cwd();
	if (action === "pathspec") console.log(writePathspec(cwd));
	else if (action === "staged") {
		const expected = readFileSync(resolve(cwd, ".git/use-memorix-cutover.pathspec"), "utf8")
			.split("\0")
			.filter(Boolean);
		assertStagedEqual(statusPaths(cwd), expected);
		console.log("staged-equal");
	} else {
		const unexpected = unexpectedPaths(cwd, mode);
		if (unexpected.length) throw new Error(JSON.stringify(unexpected));
		console.log("scope-ok");
	}
}
