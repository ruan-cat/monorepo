import { describe, expect, test } from "vitest";
import { GitHubSkillSource, type GitTreeEntry } from "../repositories/github-skill-source.ts";
import {
	decodeResourceCursor,
	ResourceResolver,
	RESOURCE_BINARY_MAX_BYTES,
	RESOURCE_TEXT_DEFAULT_BYTES,
} from "../services/resource-resolver.ts";
import type { SkillRegistryEntry } from "../services/skill-registry.ts";
import type { SourceSnapshot } from "../services/source-snapshot.ts";

const SHA = "a".repeat(40);
const skill: SkillRegistryEntry = {
	id: "demo",
	plugin: "common-tools",
	name: "Demo",
	description: "Demo skill",
	version: "1.0.0",
	entry: "ai-plugins/common-tools/skills/demo/SKILL.md",
};
const snapshot: SourceSnapshot = {
	owner: "ruan-cat",
	repository: "monorepo",
	ref: "dev",
	sourceCommitSha: SHA,
	pinned: true,
};

const file = (path: string, sha: string, size: number, mode = "100644"): GitTreeEntry => ({
	path,
	mode,
	type: "blob",
	sha,
	size,
});

function sourceWith(entries: GitTreeEntry[], blobs: Record<string, Uint8Array>) {
	const source = new GitHubSkillSource({
		owner: "ruan-cat",
		repository: "monorepo",
		transport: async () => new Response("unused", { status: 500 }),
	});
	source.listTree = async () => entries;
	source.readBlob = async (sha: string) => blobs[sha] ?? new Uint8Array();
	return source;
}

describe("ResourceResolver", () => {
	test("lists deterministically and binds pagination to the exact snapshot", async () => {
		const source = sourceWith(
			[
				file("references/z.md", "b".repeat(40), 1),
				file("SKILL.md", "c".repeat(40), 1),
				file("references/a.ts", "d".repeat(40), 1),
			],
			{},
		);
		const resolver = new ResourceResolver(source);
		const first = await resolver.listResources(skill, snapshot, { prefix: "references/", limit: 1 });
		expect(first.resources).toHaveLength(1);
		expect(first.resources[0]).toMatchObject({
			path: "references/a.ts",
			kind: "reference",
			mimeType: "text/typescript",
			textReadable: true,
		});
		expect(first.sourceCommitSha).toBe(SHA);
		expect(first.nextCursor).toBeDefined();
		expect(decodeResourceCursor(first.nextCursor!)).toEqual({
			v: 1,
			skillId: "demo",
			sourceCommitSha: SHA,
			prefix: "references/",
			offset: 1,
		});

		const second = await resolver.listResources(skill, snapshot, { prefix: "references/", offset: 1, limit: 1 });
		expect(second.resources[0].path).toBe("references/z.md");
		expect(second.nextCursor).toBeUndefined();
	});

	test("loads UTF-8 text with an inclusive line range", async () => {
		const blobSha = "b".repeat(40);
		const bytes = new TextEncoder().encode("one\ntwo\nthree\n");
		const resolver = new ResourceResolver(
			sourceWith([file("references/rules.md", blobSha, bytes.byteLength)], { [blobSha]: bytes }),
		);
		const loaded = await resolver.loadResource(skill, snapshot, {
			path: "references/rules.md",
			startLine: 2,
			endLine: 3,
		});
		expect(loaded).toMatchObject({
			contentType: "text",
			content: "two\nthree",
			kind: "reference",
			mimeType: "text/markdown",
			range: { startLine: 2, endLine: 3, totalLines: 4 },
		});
		expect(loaded.uri).toContain(SHA);
	});

	test("returns binary metadata by default and base64 only on explicit request", async () => {
		const blobSha = "c".repeat(40);
		const bytes = Uint8Array.from([0, 1, 2]);
		let reads = 0;
		const source = sourceWith([file("assets/icon.png", blobSha, bytes.byteLength)], { [blobSha]: bytes });
		const original = source.readBlob.bind(source);
		source.readBlob = async (sha: string) => {
			reads += 1;
			return original(sha);
		};
		const resolver = new ResourceResolver(source);
		const metadata = await resolver.loadResource(skill, snapshot, { path: "assets/icon.png" });
		expect(metadata).toMatchObject({
			contentType: "blob",
			contentIncluded: false,
			mimeType: "image/png",
			size: 3,
		});
		expect(reads).toBe(0);

		const inline = await resolver.loadResource(skill, snapshot, {
			path: "assets/icon.png",
			binaryMode: "base64",
		});
		expect(inline).toMatchObject({ contentType: "blob", contentIncluded: true, content: "AAEC" });
		expect(reads).toBe(1);
	});

	test("does not load symlink or submodule entries", async () => {
		const resolver = new ResourceResolver(
			sourceWith(
				[
					{ path: "assets/link", mode: "120000", type: "blob", sha: "d".repeat(40), size: 4 },
					{ path: "scripts/external", mode: "160000", type: "commit", sha: "e".repeat(40) },
				],
				{},
			),
		);
		await expect(resolver.loadResource(skill, snapshot, { path: "assets/link" })).rejects.toMatchObject({
			code: "RESOURCE_TYPE_UNSUPPORTED",
		});
		await expect(resolver.loadResource(skill, snapshot, { path: "scripts/external" })).rejects.toMatchObject({
			code: "RESOURCE_TYPE_UNSUPPORTED",
		});
	});

	test("enforces range and byte budgets", async () => {
		const blobSha = "f".repeat(40);
		const bytes = new TextEncoder().encode("hello");
		const resolver = new ResourceResolver(
			sourceWith([file("references/a.txt", blobSha, bytes.byteLength)], { [blobSha]: bytes }),
		);
		await expect(
			resolver.loadResource(skill, snapshot, { path: "references/a.txt", startLine: 2, endLine: 1 }),
		).rejects.toMatchObject({ code: "RESOURCE_RANGE_INVALID" });
		await expect(
			resolver.loadResource(skill, snapshot, { path: "references/a.txt", maxBytes: 2 }),
		).rejects.toMatchObject({ code: "RESOURCE_TOO_LARGE" });
		expect(RESOURCE_TEXT_DEFAULT_BYTES).toBe(262_144);
		expect(RESOURCE_BINARY_MAX_BYTES).toBe(65_536);
	});
});
