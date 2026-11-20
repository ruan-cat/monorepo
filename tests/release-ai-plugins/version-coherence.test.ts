import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const semver = /^\d+\.\d+\.\d+$/;
const pluginNames = ["common-tools", "dev-skills", "low-frequency-skill"];
const manifests = pluginNames.flatMap((plugin) =>
	["claude", "cursor", "codex"].map((host) => `ai-plugins/${plugin}/.${host}-plugin/plugin.json`),
);

type RegistrySkill = { id: string; version: string; entry: string };

function frontmatterVersion(markdown: string): string | undefined {
	const fence = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	return fence?.[1].match(/^[ \t]*version:\s*"(\d+\.\d+\.\d+)"\s*$/m)?.[1];
}

describe("ai-plugins release version coherence", () => {
	test("plugin manifests and Claude/Cursor marketplaces share one semver", () => {
		const versions = manifests.map((file) => {
			const version = json(file).version as string;
			expect(version, file).toMatch(semver);
			return version;
		});
		const [canonical] = versions;
		expect(new Set(versions).size, manifests.join("\n")).toBe(1);

		for (const file of [".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json"]) {
			const value = json(file);
			expect(value.metadata.version, file).toBe(canonical);
			expect(value.plugins.map((item: { name: string }) => item.name).sort(), file).toEqual([...pluginNames].sort());
			for (const plugin of value.plugins) expect(plugin.version, `${file}#${plugin.name}`).toBe(canonical);
		}
	});

	test("Codex marketplace keeps its version-free schema", () => {
		const value = json(".agents/plugins/marketplace.json");
		expect(value).not.toHaveProperty("version");
		expect(value.plugins.map((item: { name: string }) => item.name).sort()).toEqual([...pluginNames].sort());
		for (const plugin of value.plugins) {
			expect(plugin, plugin.name).not.toHaveProperty("version");
			expect(plugin.source).toEqual({ source: "local", path: `./ai-plugins/${plugin.name}` });
		}
	});

	test("registry skill versions match SKILL.md frontmatter", () => {
		const skills = json("ai-plugins/skill-registry.json").skills as RegistrySkill[];
		expect(skills.length).toBeGreaterThan(0);
		for (const skill of skills) {
			expect(skill.version, skill.id).toMatch(semver);
			expect(frontmatterVersion(read(skill.entry)), skill.entry).toBe(skill.version);
		}
	});
});
