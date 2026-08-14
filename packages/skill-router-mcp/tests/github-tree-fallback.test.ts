import { describe, expect, test } from "vitest";
import { GitHubSkillSource, type GitHubTransport } from "../repositories/github-skill-source.ts";

const COMMIT = "a".repeat(40);
const ROOT = "1".repeat(40);
const SKILLS = "2".repeat(40);
const DEMO = "3".repeat(40);
const REFERENCES = "4".repeat(40);
const SKILL_BLOB = "5".repeat(40);
const REFERENCE_BLOB = "6".repeat(40);

const tree = (path: string, sha: string) => ({ path, mode: "040000", type: "tree", sha });
const blob = (path: string, sha: string, size: number) => ({ path, mode: "100644", type: "blob", sha, size });

describe("GitHubSkillSource tree enumeration", () => {
	test("falls back to subtree traversal when recursive Git tree is truncated", async () => {
		const requests: string[] = [];
		const transport: GitHubTransport = async ({ url }) => {
			const parsed = new URL(url);
			requests.push(`${parsed.pathname}${parsed.search}`);
			if (parsed.pathname.endsWith(`/git/commits/${COMMIT}`)) {
				return Response.json({ tree: { sha: ROOT } });
			}
			if (parsed.pathname.endsWith(`/git/trees/${ROOT}`)) {
				return Response.json({ tree: [tree("skills", SKILLS)], truncated: false });
			}
			if (parsed.pathname.endsWith(`/git/trees/${SKILLS}`)) {
				return Response.json({ tree: [tree("demo", DEMO)], truncated: false });
			}
			if (parsed.pathname.endsWith(`/git/trees/${DEMO}`) && parsed.searchParams.get("recursive") === "1") {
				return Response.json({ tree: [blob("SKILL.md", SKILL_BLOB, 10)], truncated: true });
			}
			if (parsed.pathname.endsWith(`/git/trees/${DEMO}`)) {
				return Response.json({
					tree: [blob("SKILL.md", SKILL_BLOB, 10), tree("references", REFERENCES)],
					truncated: false,
				});
			}
			if (parsed.pathname.endsWith(`/git/trees/${REFERENCES}`)) {
				return Response.json({ tree: [blob("rules.md", REFERENCE_BLOB, 20)], truncated: false });
			}
			return new Response("missing", { status: 404 });
		};

		const source = new GitHubSkillSource({ owner: "owner", repository: "repo", transport });
		const entries = await source.listTree("skills/demo", COMMIT);
		expect(entries.map((entry) => entry.path)).toEqual(["SKILL.md", "references/rules.md"]);
		expect(requests.some((request) => request.includes(`/git/trees/${DEMO}?recursive=1`))).toBe(true);
		expect(requests.filter((request) => request.endsWith(`/git/trees/${DEMO}`))).toHaveLength(1);
		expect(requests.some((request) => request.endsWith(`/git/trees/${REFERENCES}`))).toBe(true);
	});
});
