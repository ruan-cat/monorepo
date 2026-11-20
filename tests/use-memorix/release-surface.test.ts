import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const manifests = [
	"ai-plugins/common-tools/.claude-plugin/plugin.json",
	"ai-plugins/common-tools/.cursor-plugin/plugin.json",
	"ai-plugins/common-tools/.codex-plugin/plugin.json",
	"ai-plugins/dev-skills/.claude-plugin/plugin.json",
	"ai-plugins/dev-skills/.cursor-plugin/plugin.json",
	"ai-plugins/dev-skills/.codex-plugin/plugin.json",
	"ai-plugins/low-frequency-skill/.claude-plugin/plugin.json",
	"ai-plugins/low-frequency-skill/.cursor-plugin/plugin.json",
	"ai-plugins/low-frequency-skill/.codex-plugin/plugin.json",
];

describe("use-memorix release surface", () => {
	test("RELEASE-01 hard-cuts the old tree and registry id", () => {
		expect(existsSync(resolve(root, "ai-plugins/low-frequency-skill/skills/init-simple-memorix"))).toBe(false);
		const registry = json("ai-plugins/skill-registry.json");
		expect(registry.skills.find((item: any) => item.id === "init-simple-memorix")).toBeUndefined();
		expect(registry.skills.find((item: any) => item.id === "use-memorix")).toMatchObject({
			plugin: "common-tools",
			version: "3.0.1",
			entry: "ai-plugins/common-tools/skills/use-memorix/SKILL.md",
		});
	});

	test("RELEASE-02 synchronizes plugin versions and Codex schema", () => {
		for (const file of manifests) expect(json(file).version, file).toBe("14.0.1");
		for (const file of [".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json"]) {
			const value = json(file);
			expect(value.metadata.version).toBe("14.0.1");
			expect(value.plugins.every((item: any) => item.version === "14.0.1")).toBe(true);
		}
		expect(json(".agents/plugins/marketplace.json")).not.toHaveProperty("version");
	});

	test("RELEASE-03 removes the old name from active surfaces", () => {
		for (const file of [
			"ai-plugins/common-tools/README.md",
			"ai-plugins/dev-skills/README.md",
			"ai-plugins/low-frequency-skill/README.md",
			"ai-plugins/docs/README.md",
			"ai-plugins/docs/use-vercel-skills-install.md",
			"README.md",
			"ai-plugins/common-tools/skills/install-mcp/SKILL.md",
			"AGENTS.md",
		])
			expect(read(file), file).not.toContain("init-simple-memorix");
	});
});
