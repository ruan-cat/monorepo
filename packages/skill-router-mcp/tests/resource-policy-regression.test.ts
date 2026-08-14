import { describe, expect, test } from "vitest";
import { GitHubSkillSource, type GitTreeEntry } from "../repositories/github-skill-source.ts";
import { ResourceResolver, RESOURCE_BINARY_MAX_BYTES } from "../services/resource-resolver.ts";
import type { SkillRegistryEntry } from "../services/skill-registry.ts";
import type { SourceSnapshot } from "../services/source-snapshot.ts";

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);
const skill: SkillRegistryEntry = {
	id: "demo",
	plugin: "common-tools",
	name: "Demo",
	description: "Resource policy fixture",
	version: "1.0.0",
	entry: "ai-plugins/common-tools/skills/demo/SKILL.md",
};

function snapshot(sourceCommitSha: string): SourceSnapshot {
	return {
		owner: "ruan-cat",
		repository: "monorepo",
		ref: "dev",
		sourceCommitSha,
		pinned: true,
	};
}

function file(path: string, sha: string, size: number): GitTreeEntry {
	return { path, mode: "100644", type: "blob", sha, size };
}

function sourceFixture(entries: GitTreeEntry[], blobs: Record<string, Uint8Array>) {
	const source = new GitHubSkillSource({
		owner: "ruan-cat",
		repository: "monorepo",
		transport: async () => new Response("unused", { status: 500 }),
	});
	source.listTree = async () => entries;
	source.readBlob = async (sha: string) => blobs[sha] ?? new Uint8Array();
	return source;
}

describe("Stage 2 resource policy regressions", () => {
	test("classifies and loads script, text asset, binary asset, and other resources", async () => {
		const scriptSha = "1".repeat(40);
		const templateSha = "2".repeat(40);
		const iconSha = "3".repeat(40);
		const otherSha = "4".repeat(40);
		const script = new TextEncoder().encode("console.log('ok');\n");
		const template = new TextEncoder().encode('{"ok":true}\n');
		const icon = Uint8Array.from([0, 1, 2]);
		const other = Uint8Array.from([3, 4, 5]);
		const resolver = new ResourceResolver(
			sourceFixture(
				[
					file("scripts/run.ts", scriptSha, script.byteLength),
					file("assets/template.json", templateSha, template.byteLength),
					file("assets/icon.png", iconSha, icon.byteLength),
					file("notes/custom.bin", otherSha, other.byteLength),
				],
				{
					[scriptSha]: script,
					[templateSha]: template,
					[iconSha]: icon,
					[otherSha]: other,
				},
			),
		);

		const listed = await resolver.listResources(skill, snapshot(SHA_A));
		expect(listed.resources).toEqual([
			expect.objectContaining({
				path: "assets/icon.png",
				kind: "asset",
				mimeType: "image/png",
				textReadable: false,
			}),
			expect.objectContaining({
				path: "assets/template.json",
				kind: "asset",
				mimeType: "application/json",
				textReadable: true,
			}),
			expect.objectContaining({
				path: "notes/custom.bin",
				kind: "other",
				mimeType: "application/octet-stream",
				textReadable: false,
			}),
			expect.objectContaining({
				path: "scripts/run.ts",
				kind: "script",
				mimeType: "text/typescript",
				textReadable: true,
			}),
		]);

		const loadedScript = await resolver.loadResource(skill, snapshot(SHA_A), { path: "scripts/run.ts" });
		expect(loadedScript).toMatchObject({
			contentType: "text",
			kind: "script",
			content: "console.log('ok');\n",
		});
		const loadedTemplate = await resolver.loadResource(skill, snapshot(SHA_A), { path: "assets/template.json" });
		expect(loadedTemplate).toMatchObject({
			contentType: "text",
			kind: "asset",
			content: '{"ok":true}\n',
		});
	});

	test("rejects binary inline content above the hard cap without reading the blob", async () => {
		const blobSha = "5".repeat(40);
		let reads = 0;
		const source = sourceFixture(
			[file("assets/large.png", blobSha, RESOURCE_BINARY_MAX_BYTES + 1)],
			{ [blobSha]: new Uint8Array() },
		);
		const original = source.readBlob.bind(source);
		source.readBlob = async (sha: string) => {
			reads += 1;
			return original(sha);
		};
		const resolver = new ResourceResolver(source);

		await expect(
			resolver.loadResource(skill, snapshot(SHA_A), {
				path: "assets/large.png",
				binaryMode: "base64",
			}),
		).rejects.toMatchObject({ code: "RESOURCE_TOO_LARGE" });
		expect(reads).toBe(0);
	});

	test("keeps resource content, inventory cache, and URI isolated by source snapshot", async () => {
		const objectA = "6".repeat(40);
		const objectB = "7".repeat(40);
		const treeCalls: string[] = [];
		const source = new GitHubSkillSource({
			owner: "ruan-cat",
			repository: "monorepo",
			transport: async () => new Response("unused", { status: 500 }),
		});
		source.listTree = async (_path: string, commitSha: string) => {
			treeCalls.push(commitSha);
			return [file("references/version.txt", commitSha === SHA_A ? objectA : objectB, 1)];
		};
		source.readBlob = async (sha: string) => new TextEncoder().encode(sha === objectA ? "A" : "B");
		const resolver = new ResourceResolver(source);

		const loadedA = await resolver.loadResource(skill, snapshot(SHA_A), { path: "references/version.txt" });
		const loadedB = await resolver.loadResource(skill, snapshot(SHA_B), { path: "references/version.txt" });
		expect(loadedA).toMatchObject({ contentType: "text", content: "A", sourceCommitSha: SHA_A });
		expect(loadedB).toMatchObject({ contentType: "text", content: "B", sourceCommitSha: SHA_B });
		expect(loadedA.uri).toContain(SHA_A);
		expect(loadedB.uri).toContain(SHA_B);
		expect(loadedA.uri).not.toBe(loadedB.uri);
		expect(treeCalls).toEqual([SHA_A, SHA_B]);
	});
});
