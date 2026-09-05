import { describe, expect, test } from "vitest";
import { GitHubSkillSource, type GitHubTransport } from "../repositories/github-skill-source.ts";
import { SkillRouter } from "../services/skill-router.ts";
import { SkillRouterError } from "../runtime/errors.ts";

const registry = JSON.stringify({
	schemaVersion: "1",
	roots: ["ai-plugins/common-tools/skills", "ai-plugins/dev-skills/skills", "ai-plugins/low-frequency-skill/skills"],
	skills: [
		{
			id: "demo",
			plugin: "common-tools",
			name: "Demo",
			description: "Nitro demo",
			version: "1.0.0",
			entry: "ai-plugins/common-tools/skills/demo/SKILL.md",
		},
	],
});

const base64 = (value: string) => Buffer.from(value).toString("base64");
const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

function fixtureTransport(statusFor?: (url: URL) => number | undefined): {
	transport: GitHubTransport;
	paths: string[];
} {
	const paths: string[] = [];
	const transport: GitHubTransport = async ({ url }) => {
		const parsed = new URL(url);
		paths.push(`${parsed.pathname}${parsed.search}`);
		const status = statusFor?.(parsed);
		if (status) return new Response(JSON.stringify({ message: "upstream" }), { status });
		if (parsed.pathname.endsWith("/commits/main")) return Response.json({ sha: SHA_A });
		if (parsed.pathname.endsWith("/skill-registry.json"))
			return Response.json({ content: base64(registry), encoding: "base64" });
		if (parsed.pathname.endsWith("/demo/SKILL.md"))
			return Response.json({ content: base64(`# Demo @ ${SHA_A}`), encoding: "base64" });
		if (parsed.pathname.endsWith("/demo/reference.md"))
			return Response.json({ content: base64(`reference @ ${SHA_A}`), encoding: "base64" });
		return new Response(JSON.stringify({ message: "not found" }), { status: 404 });
	};
	return { transport, paths };
}

describe("SkillRouter source consistency and safety", () => {
	test("list/search/load use the exact snapshot SHA", async () => {
		const { transport, paths } = fixtureTransport();
		const source = new GitHubSkillSource({
			owner: "ruan-cat",
			repository: "monorepo",
			token: "secret-token",
			transport,
		});
		const router = new SkillRouter({ source, ref: "main" });
		const snapshot = await router.snapshot();
		const listed = await router.listSkills(snapshot);
		const searched = await router.searchSkills("Nitro", snapshot);
		const loaded = await router.loadSkill("demo", undefined, snapshot);
		const related = await router.readRelatedFile("demo", "reference.md", snapshot);

		expect(listed[0].sourceCommitSha).toBe(SHA_A);
		expect(searched[0].sourceCommitSha).toBe(SHA_A);
		expect(loaded.content).toContain(`Demo @ ${SHA_A}`);
		expect(related).toContain(`reference @ ${SHA_A}`);
		// Each router operation reads the registry at A; load/related then read
		// their selected file at the same exact SHA.
		expect(paths.filter((path) => path.includes(`ref=${SHA_A}`))).toHaveLength(6);
		expect(paths.some((path) => path.endsWith("/commits/main"))).toBe(true);
	});

	test("pinned calls validate without resolving the mutable ref", async () => {
		let resolves = 0;
		const { transport } = fixtureTransport();
		const source = new GitHubSkillSource({ owner: "owner", repository: "repo", transport });
		const original = source.resolveRef.bind(source);
		source.resolveRef = async (ref: string) => {
			resolves += 1;
			return original(ref);
		};
		const router = new SkillRouter({ source, ref: "main" });
		const loaded = await router.loadSkill("demo", SHA_A);
		expect(loaded.sourceCommitSha).toBe(SHA_A);
		expect(resolves).toBe(0);
	});

	test("rejects mutable branch names as source commit pins", () => {
		const source = new GitHubSkillSource({
			owner: "owner",
			repository: "repo",
			transport: fixtureTransport().transport,
		});
		for (const value of ["main", "feature/demo"]) {
			try {
				source.validateCommitSha(value);
				throw new Error("expected mutable ref to be rejected");
			} catch (error) {
				expect(error).toMatchObject({ code: "SOURCE_COMMIT_INVALID" });
			}
		}
		expect(source.validateCommitSha(SHA_A)).toBe(SHA_A);
		expect(source.validateCommitSha("0123456789abcdef0123456789abcdef01234567")).toContain("0123");
	});

	test("keeps an in-flight call on A while the next unpinned call sees B", async () => {
		let head = SHA_A;
		const transport: GitHubTransport = async ({ url }) => {
			const parsed = new URL(url);
			if (parsed.pathname.endsWith("/commits/main")) return Response.json({ sha: head });
			const commit = parsed.searchParams.get("ref") ?? SHA_A;
			if (parsed.pathname.endsWith("/skill-registry.json"))
				return Response.json({ content: base64(registry), encoding: "base64" });
			if (parsed.pathname.endsWith("/demo/SKILL.md"))
				return Response.json({ content: base64(`# Demo @ ${commit}`), encoding: "base64" });
			return new Response("not found", { status: 404 });
		};
		const router = new SkillRouter({
			source: new GitHubSkillSource({ owner: "owner", repository: "repo", transport }),
			ref: "main",
		});
		const first = await router.snapshot();
		head = SHA_B;
		const firstLoaded = await router.loadSkill("demo", undefined, first);
		const secondLoaded = await router.loadSkill("demo");
		expect(firstLoaded.sourceCommitSha).toBe(SHA_A);
		expect(firstLoaded.content).toContain(`@ ${SHA_A}`);
		expect(secondLoaded.sourceCommitSha).toBe(SHA_B);
		expect(secondLoaded.content).toContain(`@ ${SHA_B}`);
	});

	test("rejects unknown skills and paths outside the selected skill root", async () => {
		const { transport } = fixtureTransport();
		const router = new SkillRouter({
			source: new GitHubSkillSource({ owner: "owner", repository: "repo", transport }),
			ref: "main",
		});
		await expect(router.loadSkill("missing", SHA_A)).rejects.toMatchObject({ code: "SKILL_NOT_FOUND" });
		const snapshot = await router.snapshot(SHA_A);
		await expect(router.readRelatedFile("demo", "../other.md", snapshot)).rejects.toMatchObject({
			code: "INVALID_PATH",
		});
		await expect(router.readRelatedFile("demo", "nested/../../other.md", snapshot)).rejects.toMatchObject({
			code: "INVALID_PATH",
		});
	});

	test("maps upstream auth/not-found/rate errors without leaking credentials", async () => {
		for (const [status, code] of [
			[401, "GITHUB_AUTH_FAILED"],
			[403, "GITHUB_RATE_LIMITED"],
			[404, "GITHUB_NOT_FOUND"],
		] as const) {
			const { transport } = fixtureTransport(() => status);
			const source = new GitHubSkillSource({
				owner: "owner",
				repository: "repo",
				token: "super-secret-token",
				transport,
			});
			await expect(source.resolveRef("main")).rejects.toMatchObject({ code });
			try {
				await source.resolveRef("main");
			} catch (error) {
				expect(String((error as Error).message)).not.toContain("super-secret-token");
				expect(String((error as Error).stack)).not.toContain("super-secret-token");
			}
		}
	});

	test("rejects empty search input as a stable domain error", async () => {
		const { transport } = fixtureTransport();
		const router = new SkillRouter({
			source: new GitHubSkillSource({ owner: "owner", repository: "repo", transport }),
			ref: "main",
		});
		await expect(router.searchSkills("   ", await router.snapshot(SHA_A))).rejects.toMatchObject({
			code: "INVALID_QUERY",
		});
	});
});
