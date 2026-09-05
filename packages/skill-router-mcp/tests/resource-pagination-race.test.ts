import { describe, expect, test } from "vitest";
import { GitHubSkillSource, type GitTreeEntry } from "../repositories/github-skill-source.ts";
import { encodeResourceCursor } from "../services/resource-resolver.ts";
import { REGISTRY_PATH, SkillRouter } from "../services/skill-router.ts";

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

const registry = JSON.stringify({
	schemaVersion: "1",
	roots: ["ai-plugins/common-tools/skills", "ai-plugins/dev-skills/skills", "ai-plugins/low-frequency-skill/skills"],
	skills: [
		{
			id: "demo",
			plugin: "common-tools",
			name: "Demo",
			description: "Demo resource pagination fixture",
			version: "1.0.0",
			entry: "ai-plugins/common-tools/skills/demo/SKILL.md",
		},
		{
			id: "other",
			plugin: "common-tools",
			name: "Other",
			description: "Cursor mismatch fixture",
			version: "1.0.0",
			entry: "ai-plugins/common-tools/skills/other/SKILL.md",
		},
	],
});

function file(path: string, sha: string): GitTreeEntry {
	return { path, mode: "100644", type: "blob", sha, size: 1 };
}

function routerFixture() {
	let head = SHA_A;
	let resolves = 0;
	const treeCalls: string[] = [];
	const source = new GitHubSkillSource({
		owner: "ruan-cat",
		repository: "monorepo",
		transport: async () => new Response("unused", { status: 500 }),
	});

	source.resolveRef = async () => {
		resolves += 1;
		return head;
	};
	source.readFile = async (path: string) => {
		if (path === REGISTRY_PATH) return registry;
		throw new Error(`unexpected readFile path: ${path}`);
	};
	source.listTree = async (_path: string, commitSha: string) => {
		treeCalls.push(commitSha);
		return commitSha === SHA_A
			? [file("references/a.md", "1".repeat(40)), file("references/b.md", "2".repeat(40))]
			: [file("references/b.md", "3".repeat(40)), file("references/c.md", "4".repeat(40))];
	};

	return {
		router: new SkillRouter({ source, ref: "dev" }),
		setHead: (sha: string) => {
			head = sha;
		},
		resolveCount: () => resolves,
		treeCalls,
	};
}

describe("SkillRouter resource pagination snapshot semantics", () => {
	test("keeps cursor pagination pinned when the mutable ref advances", async () => {
		const fixture = routerFixture();
		const first = await fixture.router.listSkillResources({
			skillId: "demo",
			prefix: "references/",
			limit: 1,
		});

		expect(first.sourceCommitSha).toBe(SHA_A);
		expect(first.resources.map((resource) => resource.path)).toEqual(["references/a.md"]);
		expect(first.nextCursor).toBeDefined();
		expect(fixture.resolveCount()).toBe(1);

		fixture.setHead(SHA_B);
		const second = await fixture.router.listSkillResources({
			skillId: "demo",
			cursor: first.nextCursor!,
			limit: 1,
		});

		expect(second.sourceCommitSha).toBe(SHA_A);
		expect(second.resources.map((resource) => resource.path)).toEqual(["references/b.md"]);
		expect(second.nextCursor).toBeUndefined();
		expect(fixture.resolveCount()).toBe(1);

		const latest = await fixture.router.listSkillResources({
			skillId: "demo",
			prefix: "references/",
			limit: 10,
		});
		expect(latest.sourceCommitSha).toBe(SHA_B);
		expect(latest.resources.map((resource) => resource.path)).toEqual(["references/b.md", "references/c.md"]);
		expect(fixture.resolveCount()).toBe(2);
		expect(fixture.treeCalls).toEqual([SHA_A, SHA_B]);
	});

	test("rejects cursor reuse with a different skill, source snapshot, or prefix", async () => {
		const fixture = routerFixture();
		const first = await fixture.router.listSkillResources({ skillId: "demo", prefix: "references/", limit: 1 });
		const cursor = first.nextCursor!;

		await expect(fixture.router.listSkillResources({ skillId: "other", cursor })).rejects.toMatchObject({
			code: "RESOURCE_CURSOR_INVALID",
		});
		await expect(
			fixture.router.listSkillResources({ skillId: "demo", cursor, sourceCommitSha: SHA_B }),
		).rejects.toMatchObject({ code: "RESOURCE_CURSOR_INVALID" });
		await expect(
			fixture.router.listSkillResources({ skillId: "demo", cursor, prefix: "scripts/" }),
		).rejects.toMatchObject({ code: "RESOURCE_CURSOR_INVALID" });
	});

	test("rejects malformed opaque cursors before touching the source", async () => {
		const fixture = routerFixture();
		await expect(fixture.router.listSkillResources({ skillId: "demo", cursor: "not-a-cursor" })).rejects.toMatchObject({
			code: "RESOURCE_CURSOR_INVALID",
		});
		expect(fixture.resolveCount()).toBe(0);
		expect(fixture.treeCalls).toEqual([]);
	});

	test("maps tampered cursor snapshot and prefix fields to RESOURCE_CURSOR_INVALID", async () => {
		const fixture = routerFixture();
		const mutableSnapshot = encodeResourceCursor({
			v: 1,
			skillId: "demo",
			sourceCommitSha: "dev",
			prefix: "references/",
			offset: 0,
		});
		const invalidPrefix = encodeResourceCursor({
			v: 1,
			skillId: "demo",
			sourceCommitSha: SHA_A,
			prefix: "references//",
			offset: 0,
		});

		await expect(fixture.router.listSkillResources({ skillId: "demo", cursor: mutableSnapshot })).rejects.toMatchObject(
			{
				code: "RESOURCE_CURSOR_INVALID",
			},
		);
		await expect(fixture.router.listSkillResources({ skillId: "demo", cursor: invalidPrefix })).rejects.toMatchObject({
			code: "RESOURCE_CURSOR_INVALID",
		});
		expect(fixture.resolveCount()).toBe(0);
		expect(fixture.treeCalls).toEqual([]);
	});
});
