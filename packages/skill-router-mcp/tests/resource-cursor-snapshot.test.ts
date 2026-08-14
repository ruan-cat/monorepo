import { describe, expect, test } from "vitest";
import { GitHubSkillSource, type GitTreeEntry } from "../repositories/github-skill-source.ts";
import { SkillRouter } from "../services/skill-router.ts";

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);
const registry = JSON.stringify({
	schemaVersion: "1",
	roots: ["ai-plugins/common-tools/skills", "ai-plugins/dev-skills/skills"],
	skills: [{
		id: "demo",
		plugin: "common-tools",
		name: "Demo",
		description: "Cursor snapshot fixture",
		version: "1.0.0",
		entry: "ai-plugins/common-tools/skills/demo/SKILL.md",
	}],
});

class FixtureSource extends GitHubSkillSource {
	head = SHA_A;
	resolves = 0;
	readonly entries: GitTreeEntry[] = [
		{ path: "references/a.md", mode: "100644", type: "blob", sha: "c".repeat(40), size: 1 },
		{ path: "references/b.md", mode: "100644", type: "blob", sha: "d".repeat(40), size: 1 },
	];

	constructor() {
		super({ owner: "ruan-cat", repository: "monorepo" });
	}

	override async resolveRef(): Promise<string> {
		this.resolves += 1;
		return this.head;
	}

	override async readFile(): Promise<string> {
		return registry;
	}

	override async listTree(): Promise<GitTreeEntry[]> {
		return this.entries;
	}
}

describe("resource cursor snapshot", () => {
	test("continues the first commit after the mutable ref advances", async () => {
		const source = new FixtureSource();
		const router = new SkillRouter({ source, ref: "dev" });
		const first = await router.listSkillResources({ skillId: "demo", prefix: "references/", limit: 1 });
		expect(first.sourceCommitSha).toBe(SHA_A);
		expect(first.resources[0].path).toBe("references/a.md");

		source.head = SHA_B;
		const second = await router.listSkillResources({ skillId: "demo", cursor: first.nextCursor, limit: 1 });
		expect(second.sourceCommitSha).toBe(SHA_A);
		expect(second.resources[0].path).toBe("references/b.md");
		expect(source.resolves).toBe(1);

		const latest = await router.listSkillResources({ skillId: "demo", limit: 1 });
		expect(latest.sourceCommitSha).toBe(SHA_B);
		expect(source.resolves).toBe(2);
	});
});
