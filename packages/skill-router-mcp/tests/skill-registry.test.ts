import { describe, expect, test } from "vitest";
import { SkillRouterError } from "../runtime/errors.ts";
import { SkillRegistry, isSafeSkillEntry, parseSkillRegistry } from "../services/skill-registry.ts";

const entry = (id = "demo") => ({
	id,
	plugin: "common-tools",
	name: "Demo",
	description: "A deterministic demo skill",
	version: "1.0.0",
	entry: `ai-plugins/common-tools/skills/${id}/SKILL.md`,
});

const valid = (skills = [entry()]) => ({
	schemaVersion: "1",
	roots: ["ai-plugins/common-tools/skills", "ai-plugins/dev-skills/skills"],
	skills,
});

function expectCode(fn: () => unknown, code: SkillRouterError["code"]): void {
	try {
		fn();
		throw new Error("expected function to throw");
	} catch (error) {
		expect(error).toBeInstanceOf(SkillRouterError);
		expect((error as SkillRouterError).code).toBe(code);
	}
}

describe("SkillRegistry validation", () => {
	test("accepts v1 and returns immutable, registry-only summaries", () => {
		const registry = new SkillRegistry(valid());
		expect(registry.list()).toHaveLength(1);
		expect(registry.list()[0]).not.toHaveProperty("files");
		expect(registry.get("demo").entry).toBe("ai-plugins/common-tools/skills/demo/SKILL.md");
	});

	test("rejects missing, unsupported, roots-invalid and malformed registry documents", () => {
		expectCode(() => parseSkillRegistry(undefined), "REGISTRY_NOT_FOUND");
		expectCode(() => parseSkillRegistry({ schemaVersion: "2", roots: [], skills: [] }), "REGISTRY_SCHEMA_UNSUPPORTED");
		expectCode(() => parseSkillRegistry({ schemaVersion: "1", roots: [], skills: [] }), "REGISTRY_ENTRY_INVALID");
		expectCode(
			() =>
				parseSkillRegistry({
					...valid(),
					skills: [{ ...entry(), entry: "ai-plugins/common-tools/skills/demo/README.md" }],
				}),
			"REGISTRY_ENTRY_INVALID",
		);
	});

	test("rejects duplicate ids and path traversal", () => {
		expectCode(() => parseSkillRegistry(valid([entry("same"), entry("same")])), "REGISTRY_ENTRY_INVALID");
		expect(isSafeSkillEntry("ai-plugins/common-tools/skills/demo/SKILL.md")).toBe(true);
		expect(isSafeSkillEntry("ai-plugins/common-tools/skills/demo/../other/SKILL.md")).toBe(false);
		expect(isSafeSkillEntry("ai-plugins/common-tools/skills/demo\\SKILL.md")).toBe(false);
		expect(isSafeSkillEntry("/ai-plugins/common-tools/skills/demo/SKILL.md")).toBe(false);
	});

	test("returns explicit unknown skill error", () => {
		const registry = new SkillRegistry(valid());
		expectCode(() => registry.get("missing"), "SKILL_NOT_FOUND");
	});
});
