import { createServer as createHttpServer, type Server } from "node:http";
import { createTestHarness, type TestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { toolCatalog } from "../mcp/tool-definitions.ts";

const SOURCE_SHA = "0123456789abcdef0123456789abcdef01234567";
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
		{ structuredContent?: T; content?: Array<{ type: string; text: string }> } | undefined;
	if (result?.structuredContent !== undefined) return result.structuredContent;
	const text = result?.content?.find((part) => part.type === "text")?.text;
	return text ? (JSON.parse(text) as T) : undefined;
}

beforeAll(async () => {
	upstream = createHttpServer((request, response) => {
		const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
		response.setHeader("content-type", "application/json");
		if (path.endsWith("/commits/dev")) {
			response.end(JSON.stringify({ sha: SOURCE_SHA }));
			return;
		}
		if (path.endsWith("/contents/ai-plugins/skill-registry.json")) {
			response.end(JSON.stringify({ content: encoded(JSON.stringify(registry)), encoding: "base64" }));
			return;
		}
		if (path.endsWith("/contents/ai-plugins/common-tools/skills/fixture-skill/SKILL.md")) {
			response.end(JSON.stringify({ content: encoded("# Fixture Skill\n"), encoding: "base64" }));
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
	test("exercises the complete MCP read-only flow against the production build", async () => {
		const health = await harness.fetch("http://skill-router-mcp.test/health");
		expect(health.status).toBe(200);
		const initialized = await mcp("initialize", {
			protocolVersion: "2025-03-26",
			capabilities: {},
			clientInfo: { name: "harness", version: "1" },
		});
		expect((initialized.result as { serverInfo?: { name?: string } }).serverInfo?.name).toBe("skill-router-mcp");
		const tools = await mcp("tools/list", {});
		expect(((tools.result as { tools?: Array<{ name: string }> }).tools ?? []).map((tool) => tool.name)).toEqual([
			"get_server_info",
			"list_skills",
			"search_skills",
			"load_skill",
		]);
		const info = unpack<{ skillSource?: { repository?: string } }>(
			await mcp("tools/call", { name: "get_server_info", arguments: {} }),
		);
		expect(info?.skillSource?.repository).toBe("ruan-cat/monorepo");
		const listed = unpack<Array<{ id?: string; sourceCommitSha?: string }>>(
			await mcp("tools/call", { name: "list_skills", arguments: {} }),
		);
		expect(listed).toEqual([{ ...registry.skills[0], sourceCommitSha: SOURCE_SHA }]);
		const searched = unpack<Array<{ id?: string; sourceCommitSha?: string }>>(
			await mcp("tools/call", { name: "search_skills", arguments: { query: "fixture" } }),
		);
		expect(searched?.[0]).toMatchObject({ id: "fixture-skill", sourceCommitSha: SOURCE_SHA });
		const latest = unpack<{ content?: string; sourceCommitSha?: string }>(
			await mcp("tools/call", { name: "load_skill", arguments: { skillId: "fixture-skill" } }),
		);
		expect(latest).toMatchObject({ content: "# Fixture Skill\n", sourceCommitSha: SOURCE_SHA });
		const pinned = unpack<{ sourceCommitSha?: string }>(
			await mcp("tools/call", {
				name: "load_skill",
				arguments: { skillId: "fixture-skill", sourceCommitSha: SOURCE_SHA },
			}),
		);
		expect(pinned?.sourceCommitSha).toBe(SOURCE_SHA);
		const badPin = await mcp("tools/call", {
			name: "load_skill",
			arguments: { skillId: "fixture-skill", sourceCommitSha: "main" },
		});
		expect((badPin.result as { isError?: boolean }).isError).toBe(true);
		expect(JSON.stringify(badPin)).not.toMatch(/authorization|github_token|secret/i);
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
