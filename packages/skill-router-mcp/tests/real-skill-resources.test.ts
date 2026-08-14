import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { GitHubSkillSource, type GitTreeEntry } from "../repositories/github-skill-source.ts";
import { ResourceResolver } from "../services/resource-resolver.ts";
import { SkillRegistry, type SkillRegistryEntry } from "../services/skill-registry.ts";
import type { SourceSnapshot } from "../services/source-snapshot.ts";

const REPO_ROOT = resolve(process.cwd(), "../..");
const SOURCE_SHA = "a".repeat(40);
const snapshot: SourceSnapshot = {
	owner: "ruan-cat",
	repository: "monorepo",
	ref: "dev",
	sourceCommitSha: SOURCE_SHA,
	pinned: true,
};

async function registry(): Promise<SkillRegistry> {
	const raw = await readFile(resolve(REPO_ROOT, "ai-plugins/skill-registry.json"), "utf8");
	return new SkillRegistry(JSON.parse(raw) as unknown);
}

function localSource() {
	const blobs = new Map<string, Uint8Array>();
	const source = new GitHubSkillSource({
		owner: "ruan-cat",
		repository: "monorepo",
		transport: async () => new Response("unused", { status: 500 }),
	});

	const walk = async (directory: string, prefix = ""): Promise<GitTreeEntry[]> => {
		const entries: GitTreeEntry[] = [];
		for (const item of await readdir(directory, { withFileTypes: true })) {
			const relativePath = prefix ? `${prefix}/${item.name}` : item.name;
			const absolutePath = resolve(directory, item.name);
			if (item.isDirectory()) {
				entries.push(...(await walk(absolutePath, relativePath)));
				continue;
			}
			if (!item.isFile()) continue;
			const bytes = await readFile(absolutePath);
			const sha = createHash("sha1").update(relativePath).digest("hex");
			blobs.set(sha, bytes);
			entries.push({ path: relativePath, mode: "100644", type: "blob", sha, size: bytes.byteLength });
		}
		return entries;
	};

	source.listTree = async (skillRoot: string) => walk(resolve(REPO_ROOT, skillRoot));
	source.readBlob = async (sha: string) => blobs.get(sha) ?? new Uint8Array();
	return source;
}

async function assertReference(skill: SkillRegistryEntry, referencePath: string) {
	const resolver = new ResourceResolver(localSource());
	const listed = await resolver.listResources(skill, snapshot, { prefix: "references/" });
	expect(listed.resources.map((resource) => resource.path)).toContain(referencePath);

	const loaded = await resolver.loadResource(skill, snapshot, { path: referencePath });
	expect(loaded.contentType).toBe("text");
	if (loaded.contentType !== "text") throw new Error("expected text resource");
	const expected = await readFile(resolve(REPO_ROOT, skill.entry.slice(0, skill.entry.lastIndexOf("/")), referencePath), "utf8");
	expect(loaded.content).toBe(expected);
	expect(loaded.sourceCommitSha).toBe(SOURCE_SHA);
	expect(loaded.uri).toContain(SOURCE_SHA);
}

describe("real Skill resource contracts", () => {
	test("loads git-commit commit-types reference from the checked-out repository", async () => {
		const skill = (await registry()).get("git-commit");
		await assertReference(skill, "references/commit-types.ts");
	});

	test("loads every pr-ruancat-repo reference independently", async () => {
		const skill = (await registry()).get("pr-ruancat-repo");
		for (const referencePath of [
			"references/batch-pr-script.ts",
			"references/target-repos.md",
			"references/workflow-and-template.md",
		]) {
			await assertReference(skill, referencePath);
		}
	});

	test("enumerates the expected pr-ruancat-repo reference set", async () => {
		const skill = (await registry()).get("pr-ruancat-repo");
		const listed = await new ResourceResolver(localSource()).listResources(skill, snapshot, { prefix: "references/" });
		expect(listed.resources.map((resource) => resource.path)).toEqual([
			"references/batch-pr-script.ts",
			"references/target-repos.md",
			"references/workflow-and-template.md",
		]);
	});
});
