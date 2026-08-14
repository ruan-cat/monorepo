/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { SELF, env } from "cloudflare:test";
import { describe, expect, test } from "vitest";

describe("Stage 2 worker runtime", () => {
	test("serves health with configured source bindings", async () => {
		const response = await SELF.fetch("https://skill-router-mcp.test/health");
		expect(response.status).toBe(200);
		expect(env.GITHUB_OWNER).toBe("ruan-cat");
		expect(env.GITHUB_REPO).toBe("monorepo");
		expect(env.GITHUB_REF).toBe("dev");
	});

	test("initializes as version 0.2.0", async () => {
		const response = await SELF.fetch("https://skill-router-mcp.test/mcp", {
			method: "POST",
			headers: { accept: "application/json, text/event-stream", "content-type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "stage2-worker-test", version: "1" } },
			}),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as { result?: { serverInfo?: { version?: string } } };
		expect(body.result?.serverInfo?.version).toBe("0.2.0");
	});
});
