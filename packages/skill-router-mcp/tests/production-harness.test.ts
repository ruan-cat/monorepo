import { createServer as createHttpServer, type Server } from "node:http";
import { createTestHarness, type TestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { toolNames } from "../mcp/tool-definitions.ts";

const SOURCE_SHA = "0123456789abcdef0123456789abcdef01234567";
const ROOT_TREE = "1".repeat(40);
const AI_TREE = "2".repeat(40);
const COMMON_TREE = "3".repeat(40);
const SKILLS_TREE = "4".repeat(40);
const FIXTURE_TREE = "5".repeat(40);
const SKILL_BLOB = "6".repeat(40);
const RULES_BLOB = "7".repeat(40);
const SKILL_CONTENT = "# Fixture Skill\n";
const RULES_CONTENT = "first\nsecond\nthird\n";
const registry = {
	schemaVersion: "1",
	roots: ["ai-plugins/common-tools/skills", "ai-plugins/dev-skills/skills"],
	skills: [
		{
			id: "fixture-skill",
			plugin: "common-tools",
			name: "Fixture Skill",
			description: "A mocked GitHub fixture",
			version: "1.0.0",
			entry: "ai-plugins/common-tools/skills/fixture-skill/SKILL.md",
		},
	],
};

let harness: TestHarness;
let upstream: Server;

function encoded(value: string): string {
	return Buffer.from(value, "utf8").toString("base64");
}

async function mcp(method: string, params: unknown, id = 1): Promise<Record<string, unknown>> {
	const response = await harness.fetch("http://skill-router-mcp.test/mcp", {
		method: "POST",
		headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
		body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
	});
	expect(response.status).toBe(200);
	return (await response.json()) as Record<string, unknown>;
}

function unpack<T>(message: Record<string, unknown>): T | undefined {
	const result = message.result as
		| { structuredContent?: T; content?: Array<{ type: string; text: string }> }
		| undefined;
	if (result?.structuredContent !== undefined) return result.structuredContent;
	const text = result?.content?.find((part) => part.type === "text")?.text;
	return text ? (JSON.parse(text) as T) : undefined;
}

function tree(path: string, sha: string) {
	return { path, mode: "040000", type: "tree", sha };
}

function blob(path: string, sha: string, size: number) {
	return { path, mode: "100644", type: "blob", sha, size };
}

beforeAll(async () => {
	upstream = createHttpServer((request, response) => {
		const url = new URL(request.url ?? "/", "http://127.0.0.1");
		const path = url.pathname;
		response.setHeader("content-type", "application/json");

		if (path.endsWith("/commits/dev")) {
			response.end(JSON.stringify({ sha: SOURCE_SHA }));
			return;
		}
		if (path.endsWith(`/git/commits/${SOURCE_SHA}`)) {
			response.end(JSON.stringify({ tree: { sha: ROOT_TREE } }));
			return;
		}
		if (path.endsWith(`/git/trees/${ROOT_TREE}`)) {
			response.end(JSON.stringify({ tree: [tree("ai-plugins", AI_TREE)], truncated: false }));
			return;
		}
		if (path.endsWith(`/git/trees/${AI_TREE}`)) {
			response.end(JSON.stringify({ tree: [tree("common-tools", COMMON_TREE)], truncated: false }));
			return;
		}
		if (path.endsWith(`/git/trees/${COMMON_TREE}`)) {
			response.end(JSON.stringify({ tree: [tree("skills", SKILLS_TREE)], truncated: false }));
			return;
		}
		if (path.endsWith(`/git/trees/${SKILLS_TREE}`)) {
			response.end(JSON.stringify({ tree: [tree("fixture-skill", FIXTURE_TREE)], truncated: false }));
			return;
		}
		if (path.endsWith(`/git/trees/${FIXTURE_TREE}`)) {
			response.end(
				JSON.stringify({
					tree: [
						blob("SKILL.md", SKILL_BLOB, Buffer.byteLength(SKILL_CONTENT)),
						tree("references", "8".repeat(40)),
						blob("references/rules.md", RULES_BLOB, Buffer.byteLength(RULES_CONTENT)),
					],
					truncated: false,
				}),
			);
			return;
		}
		if (path.endsWith(`/git/blobs/${RULES_BLOB}`)) {
			response.end(JSON.stringify({ content: encoded(RULES_CONTENT), encoding: "base64", size: Buffer.byteLength(RULES_CONTENT) }));
			return;
		}
		if (path.endsWith("/contents/ai-plugins/skill-registry.json")) {
			response.end(JSON.stringify({ content: encoded(JSON.stringify(registry)), encoding: "base64" }));
			return;
		}
		if (path.endsWith("/contents/ai-plugins/common-tools/skills/fixture-skill/SKILL.md")) {
			response.end(JSON.stringify({ content: encoded(SKILL_CONTENT), encoding: "base64" }));
			return;
		}
		response.statusCode = 404;
		response.end(JSON.stringify({ message: "missing" }));
	});
	await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
	const address = upstream.address();
	if (!address || typeof address === "string") throw new Error("mock GitHub server did not bind");
	const apiBaseUrl = `http://127.0.0.1:${address.port}`;
	harness = createTestHarness({
		workers: [{ configPath: "./.output/server/wrangler.json", vars: { GITHUB_API_BASE_URL: apiBaseUrl } }],
	});
	await harness.listen();
});

afterAll(async () => {
	await harness.close();
	await new Promise<void>((resolve, reject) => upstream.close((error) => (error ? reject(error) : resolve())));
});

describe("production Worker harness", () => {
	test("exercises Skill discovery and resource loading against the production build", async () => {
		const health = await harness.fetch("http://skill-router-mcp.test/health");
		expect(health.status).toBe(200);
		const initialized = await mcp("initialize", {
			protocolVersion: "2025-03-26",
			capabilities: {},
			clientInfo: { name: "harness", version: "1" },
		});
		expect((initialized.result as { serverInfo?: { name?: string } }).serverInfo?.name).toBe("skill-router-mcp");

		const tools = await mcp("tools/list", {});
		expect(((tools.result as { tools?: Array<{ name: string }> }).tools ?? []).map((tool) => tool.name)).toEqual(toolNames);

		const listed = unpack<Array<{ id?: string; sourceCommitSha?: string }>>(
			await mcp("tools/call", { name: "list_skills", arguments: {} }),
		);
		expect(listed).toEqual([{ ...registry.skills[0], sourceCommitSha: SOURCE_SHA }]);

		const latest = unpack<{ content?: string; sourceCommitSha?: string }>(
			await mcp("tools/call", { name: "load_skill", arguments: { skillId: "fixture-skill" } }),
		);
		expect(latest).toMatchObject({ content: SKILL_CONTENT, sourceCommitSha: SOURCE_SHA });

		const resources = unpack<{
			sourceCommitSha?: string;
			resources?: Array<{ path?: string; kind?: string; mimeType?: string }>;
		}>(
			await mcp("tools/call", {
				name: "list_skill_resources",
				arguments: { skillId: "fixture-skill", prefix: "references/" },
			}),
		);
		expect(resources).toMatchObject({ sourceCommitSha: SOURCE_SHA });
		expect(resources?.resources).toEqual([
			expect.objectContaining({ path: "references/rules.md", kind: "reference", mimeType: "text/markdown" }),
		]);

		const loadedResource = unpack<{ content?: string; sourceCommitSha?: string; path?: string }>(
			await mcp("tools/call", {
				name: "load_skill_resource",
				arguments: {
					skillId: "fixture-skill",
					path: "references/rules.md",
					sourceCommitSha: SOURCE_SHA,
					startLine: 2,
					endLine: 2,
				},
			}),
		);
		expect(loadedResource).toMatchObject({
			content: "second",
			sourceCommitSha: SOURCE_SHA,
			path: "references/rules.md",
		});

		const badPin = await mcp("tools/call", {
			name: "load_skill",
			arguments: { skillId: "fixture-skill", sourceCommitSha: "main" },
		});
		expect((badPin.result as { isError?: boolean }).isError).toBe(true);
	});

	test("keeps two harness requests independent", async () => {
		const [first, second] = await Promise.all([
			mcp("tools/call", { name: "search_skills", arguments: { query: "fixture" } }, 11),
			mcp("tools/call", { name: "search_skills", arguments: { query: "fixture" } }, 12),
		]);
		expect(unpack<Array<{ id?: string }>>(first)?.[0]?.id).toBe("fixture-skill");
		expect(unpack<Array<{ id?: string }>>(second)?.[0]?.id).toBe("fixture-skill");
	});
});
