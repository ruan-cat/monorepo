import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

describe("use-memorix release surface", () => {
	test("RELEASE-01 hard-cuts the old tree and registry id", () => {
		expect(existsSync(resolve(root, "ai-plugins/low-frequency-skill/skills/init-simple-memorix"))).toBe(false);
		const registry = json("ai-plugins/skill-registry.json");
		expect(registry.skills.find((item: { id: string }) => item.id === "init-simple-memorix")).toBeUndefined();
		expect(registry.skills.find((item: { id: string }) => item.id === "use-memorix")).toMatchObject({
			plugin: "common-tools",
			entry: "ai-plugins/common-tools/skills/use-memorix/SKILL.md",
		});
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
