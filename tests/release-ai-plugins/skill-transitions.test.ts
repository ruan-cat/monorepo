import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.setConfig({ testTimeout: 300000 });

const dirs: string[] = [];
const repoRoot = resolve(import.meta.dirname, "../..");
const script = resolve(repoRoot, "ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1");
const helper = resolve(repoRoot, "ai-plugins/common-tools/skills/release-ai-plugins/scripts/skill-transitions.ps1");
const psExe = process.env.USE_MEMORIX_PS_EXE ?? (process.platform === "win32" ? "pwsh.exe" : "pwsh");
const powershellTest = process.platform === "win32" || process.env.USE_MEMORIX_ALLOW_PWSH === "1" ? test : test.skip;
function run(command: string, args: string[], cwd: string) {
	return spawnSync(command, args, { cwd, encoding: "utf8", env: process.env });
}
function json(path: string, value: unknown) {
	mkdirSync(resolve(path, ".."), { recursive: true });
	writeFileSync(path, JSON.stringify(value, null, 2));
}
function text(path: string, value: string) {
	mkdirSync(resolve(path, ".."), { recursive: true });
	writeFileSync(path, value);
}
function fixture() {
	const root = mkdtempSync(join(tmpdir(), "release-transition-"));
	dirs.push(root);
	run("git", ["init"], root);
	run("git", ["config", "user.email", "fixture@example.invalid"], root);
	run("git", ["config", "user.name", "Fixture"], root);
	text(join(root, "pnpm-workspace.yaml"), "packages: []\n");
	for (const plugin of ["common-tools", "dev-skills", "low-frequency-skill"]) {
		const old = plugin === "low-frequency-skill" ? "init-simple-memorix" : `fixture-${plugin}`;
		text(
			join(root, `ai-plugins/${plugin}/skills/${old}/SKILL.md`),
			`---\nname: ${old}\ndescription: fixture\nmetadata:\n  version: "1.0.0"\n---\n`,
		);
		text(join(root, `ai-plugins/${plugin}/README.md`), `# ${plugin}\n${old}\n`);
		text(join(root, `ai-plugins/${plugin}/CHANGELOG.md`), "# Changelog\n\n## [Unreleased]\n");
		for (const host of ["claude", "cursor", "codex"])
			json(join(root, `ai-plugins/${plugin}/.${host}-plugin/plugin.json`), {
				name: plugin,
				version: "13.4.0",
				skills: "./skills",
				description: "中文描述",
				interface: {
					displayName: "中文",
					shortDescription: "中文",
					longDescription: "中文",
					developerName: "中文",
					category: "工具",
					capabilities: ["技能"],
					defaultPrompt: ["中文"],
				},
			});
	}
	json(join(root, ".claude-plugin/marketplace.json"), { metadata: { version: "13.4.0" }, plugins: [] });
	json(join(root, ".cursor-plugin/marketplace.json"), { metadata: { version: "13.4.0" }, plugins: [] });
	json(join(root, ".agents/plugins/marketplace.json"), {
		plugins: [
			...["common-tools", "dev-skills", "low-frequency-skill"].map((name) => ({
				name,
				source: { source: "local", path: `./ai-plugins/${name}` },
				policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
				category: "tools",
			})),
		],
	});
	for (const file of [
		"ai-plugins/docs/README.md",
		"ai-plugins/docs/use-vercel-skills-install.md",
		".claude-plugin/README.md",
		".cursor-plugin/README.md",
		".agents/plugins/README.md",
		"README.md",
	])
		text(join(root, file), "ai-plugins/common-tools\n");
	text(
		join(root, ".github/workflows/ai-plugins-skill-registry-check.yml"),
		[
			"ai-plugins/common-tools/skills/**",
			"ai-plugins/dev-skills/skills/**",
			"ai-plugins/low-frequency-skill/skills/**",
			"ai-plugins/skill-registry.json",
			"generate-skill-registry.ps1",
			"skill-transitions.ps1",
			"tests/release-ai-plugins",
			"-Check",
			"contents: read",
		].join("\n"),
	);
	const generator = join(root, "ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1");
	text(
		generator,
		[
			"param([switch]$Apply,[switch]$Check)",
			`$calls = Join-Path '${root.replaceAll("'", "''")}' 'calls.log'`,
			"Add-Content -Path $calls -Value $(if($Apply){'Apply'}else{'Check'})",
			`if($Apply){Set-Content -Path (Join-Path '${root.replaceAll("'", "''")}' 'ai-plugins/skill-registry.json') -Value '{\"schemaVersion\":\"1\",\"roots\":[],\"skills\":[]}'}`,
		].join("\n"),
	);
	cpSync(resolve(script, "../skill-transitions.ps1"), resolve(generator, "../skill-transitions.ps1"));
	run("git", ["add", "."], root);
	run("git", ["commit", "-m", "fixture"], root);
	rmSync(join(root, "ai-plugins/low-frequency-skill/skills/init-simple-memorix"), { recursive: true });
	text(
		join(root, "ai-plugins/common-tools/skills/use-memorix/SKILL.md"),
		'---\nname: use-memorix\ndescription: fixture\nmetadata:\n  version: "3.0.0"\n---\n',
	);
	return root;
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe("release skill transitions", () => {
	test("PS-01 ships UTF-8 BOM so Windows PowerShell 5.1 can parse Chinese messages", () => {
		for (const file of [script, helper])
			expect([...readFileSync(file).subarray(0, 3)], file).toEqual([0xef, 0xbb, 0xbf]);
	});

	powershellTest("TRANSITION-01 resolves rename-move and keeps DryRun byte-identical", () => {
		const root = fixture();
		const before = readFileSync(join(root, ".claude-plugin/marketplace.json"), "utf8");
		const result = run(
			psExe,
			[
				"-NoProfile",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				script,
				"-RepositoryRoot",
				root,
				"-Version",
				"14.0.0",
				"-RenameSkill",
				"init-simple-memorix=use-memorix",
				"-SkillVersion",
				"use-memorix=3.0.0",
				"-DryRun",
			],
			root,
		);
		expect(result.status, result.stdout + result.stderr).toBe(0);
		expect(result.stdout).toContain("rename-move");
		expect(readFileSync(join(root, ".claude-plugin/marketplace.json"), "utf8")).toBe(before);
	});

	powershellTest("TRANSITION-02 rejects conflicts missing targets and old-directory residue", () => {
		const root = fixture();
		for (const args of [
			["-RenameSkill", "missing=use-memorix"],
			["-RenameSkill", "init-simple-memorix=use-memorix", "-MoveSkill", "use-memorix=dev-skills"],
		]) {
			const result = run(
				psExe,
				["-NoProfile", "-File", script, "-RepositoryRoot", root, "-Version", "14.0.0", ...args, "-DryRun"],
				root,
			);
			expect(result.status).not.toBe(0);
		}
		const residueArgs = ["-RenameSkill", "init-simple-memorix=use-memorix"];
		text(
			join(root, "ai-plugins/low-frequency-skill/skills/init-simple-memorix/SKILL.md"),
			'---\nname: init-simple-memorix\ndescription: fixture\nmetadata:\n  version: "1.0.0"\n---\n',
		);
		const residueResult = run(
			psExe,
			["-NoProfile", "-File", script, "-RepositoryRoot", root, "-Version", "14.0.0", ...residueArgs, "-DryRun"],
			root,
		);
		expect(residueResult.status, residueResult.stdout + residueResult.stderr).not.toBe(0);
	});

	powershellTest("TRANSITION-03 Apply calls registry Apply and Check exactly once", () => {
		const root = fixture();
		const result = run(
			psExe,
			[
				"-NoProfile",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				script,
				"-RepositoryRoot",
				root,
				"-Version",
				"14.0.0",
				"-RenameSkill",
				"init-simple-memorix=use-memorix",
				"-SkillVersion",
				"use-memorix=3.0.0",
				"-Apply",
			],
			root,
		);
		expect(result.status, result.stdout + result.stderr).toBe(0);
		expect(readFileSync(join(root, "calls.log"), "utf8").trim().split(/\r?\n/)).toEqual(["Apply", "Check"]);
		expect(JSON.parse(readFileSync(join(root, ".claude-plugin/marketplace.json"), "utf8")).metadata.version).toBe(
			"14.0.0",
		);
		const tmpResidue: string[] = [];
		const walk = (dir: string) => {
			for (const entry of readdirSync(dir, { withFileTypes: true })) {
				if (entry.name === ".git" || entry.name === "node_modules") continue;
				const full = join(dir, entry.name);
				if (entry.isDirectory()) walk(full);
				else if (entry.name.endsWith(".tmp")) tmpResidue.push(full);
			}
		};
		walk(root);
		expect(tmpResidue).toEqual([]);
	});

	powershellTest("TRANSITION-04 applies move keeping id and updates both plugins", () => {
		const root = fixture();
		const result = run(
			psExe,
			[
				"-NoProfile",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				script,
				"-RepositoryRoot",
				root,
				"-Version",
				"14.0.0",
				"-MoveSkill",
				"fixture-common-tools=dev-skills",
				"-Apply",
			],
			root,
		);
		expect(result.status, result.stdout + result.stderr).toBe(0);
		expect(result.stdout).toContain("move");
		expect(existsSync(join(root, "ai-plugins/dev-skills/skills/fixture-common-tools/SKILL.md"))).toBe(true);
		expect(existsSync(join(root, "ai-plugins/common-tools/skills/fixture-common-tools"))).toBe(false);
	});

	powershellTest("TRANSITION-05 applies remove and leaves no old directory", () => {
		const root = fixture();
		const result = run(
			psExe,
			[
				"-NoProfile",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				script,
				"-RepositoryRoot",
				root,
				"-Version",
				"14.0.0",
				"-RemoveSkill",
				"fixture-dev-skills",
				"-Apply",
			],
			root,
		);
		expect(result.status, result.stdout + result.stderr).toBe(0);
		expect(result.stdout).toContain("remove");
		for (const plugin of ["common-tools", "dev-skills", "low-frequency-skill"])
			expect(existsSync(join(root, `ai-plugins/${plugin}/skills/fixture-dev-skills`))).toBe(false);
	});
});
