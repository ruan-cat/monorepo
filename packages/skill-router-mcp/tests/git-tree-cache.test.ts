import { describe, expect, test } from "vitest";
import { GitHubSkillSource, type GitHubTransport } from "../repositories/github-skill-source.ts";

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);
const ROOT_TREE = "1".repeat(40);
const AI_TREE = "2".repeat(40);
const COMMON_TREE = "3".repeat(40);
const SKILLS_TREE = "4".repeat(40);
const DEMO_TREE = "5".repeat(40);
const FILE_BLOB = "6".repeat(40);
const SKILL_ROOT = "ai-plugins/common-tools/skills/cache-demo";

function tree(path: string, sha: string) {
	return { path, mode: "040000", type: "tree", sha };
}

function blob(path: string, sha: string) {
	return { path, mode: "100644", type: "blob", sha, size: 1 };
}

describe("GitHubSkillSource exact-tree isolate cache", () => {
	test("shares one cold subtree traversal across request-local source instances and isolates commits", async () => {
		const requests: string[] = [];
		const transport: GitHubTransport = async ({ url }) => {
			const parsed = new URL(url);
			requests.push(`${parsed.pathname}${parsed.search}`);
			if (parsed.pathname.endsWith(`/git/commits/${SHA_A}`) || parsed.pathname.endsWith(`/git/commits/${SHA_B}`)) {
				return Response.json({ tree: { sha: ROOT_TREE } });
			}
			if (parsed.pathname.endsWith(`/git/trees/${ROOT_TREE}`)) {
				return Response.json({ tree: [tree("ai-plugins", AI_TREE)], truncated: false });
			}
			if (parsed.pathname.endsWith(`/git/trees/${AI_TREE}`)) {
				return Response.json({ tree: [tree("common-tools", COMMON_TREE)], truncated: false });
			}
			if (parsed.pathname.endsWith(`/git/trees/${COMMON_TREE}`)) {
				return Response.json({ tree: [tree("skills", SKILLS_TREE)], truncated: false });
			}
			if (parsed.pathname.endsWith(`/git/trees/${SKILLS_TREE}`)) {
				return Response.json({ tree: [tree("cache-demo", DEMO_TREE)], truncated: false });
			}
			if (parsed.pathname.endsWith(`/git/trees/${DEMO_TREE}`) && parsed.searchParams.get("recursive") === "1") {
				return Response.json({ tree: [blob("references/rules.md", FILE_BLOB)], truncated: false });
			}
			return new Response(JSON.stringify({ message: "missing" }), { status: 404 });
		};
		const first = new GitHubSkillSource({ owner: "cache-owner", repository: "cache-repo", transport });
		const second = new GitHubSkillSource({ owner: "cache-owner", repository: "cache-repo", transport });

		const [coldA, concurrentA] = await Promise.all([
			first.listTree(SKILL_ROOT, SHA_A),
			second.listTree(SKILL_ROOT, SHA_A),
		]);
		expect(coldA).toEqual(concurrentA);
		expect(coldA).toEqual([blob("references/rules.md", FILE_BLOB)]);
		expect(requests).toHaveLength(6);

		await second.listTree(SKILL_ROOT, SHA_A);
		expect(requests).toHaveLength(6);

		await second.listTree(SKILL_ROOT, SHA_B);
		expect(requests).toHaveLength(12);
	});
});
