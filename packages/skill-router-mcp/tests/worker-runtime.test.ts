/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { SELF, env } from "cloudflare:test";
import { describe, expect, test } from "vitest";
import { healthPayload } from "../server/api/health.get.ts";

describe("worker runtime boundaries", () => {
	test("executes the health endpoint through the real workerd fetcher", async () => {
		const response = await SELF.fetch("https://skill-router-mcp.test/health");
		expect(response.status).toBe(200);
		const payload = (await response.json()) as {
			ok?: boolean;
			service?: string;
			deployment?: {
				buildGitSha?: string;
				workerVersionId?: string;
				workerVersionTag?: string;
				workerVersionTimestamp?: string;
			};
		};
		expect(payload.ok).toBe(true);
		expect(payload.service).toBe("skill-router-mcp");
		expect(payload.deployment?.buildGitSha).toMatch(/^[a-f0-9]{40}$/);
		expect(payload.deployment?.buildGitSha).not.toBe("__BUILD_GIT_SHA__");
		const metadata = env.CF_VERSION_METADATA as { id?: string; tag?: string; timestamp?: string } | undefined;
		expect(payload.deployment?.workerVersionId).toBe(metadata?.id || undefined);
		expect(payload.deployment?.workerVersionTag).toBe(metadata?.tag || undefined);
		expect(payload.deployment?.workerVersionTimestamp).toBe(metadata?.timestamp || undefined);
	});

	test("exposes configured public vars as Worker bindings, not process env", () => {
		expect(env.GITHUB_OWNER).toBe("ruan-cat");
		expect(env.GITHUB_REPO).toBe("monorepo");
		expect(env.GITHUB_REF).toBe("dev");
		expect(env.CF_VERSION_METADATA).toBeDefined();
		expect("GITHUB_TOKEN" in env).toBe(false);
	});

	test("handles MCP initialization and malformed requests inside workerd", async () => {
		const initialized = await SELF.fetch("https://skill-router-mcp.test/mcp", {
			method: "POST",
			headers: { accept: "application/json, text/event-stream", "content-type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2025-06-18",
					capabilities: {},
					clientInfo: { name: "workerd-test", version: "1.0.0" },
				},
			}),
		});
		expect(initialized.status).toBe(200);
		const body = (await initialized.json()) as { result?: { serverInfo?: { name?: string; version?: string } } };
		expect(body.result?.serverInfo).toEqual({ name: "@ruan-cat/skill-router-mcp", version: "0.2.0" });

		const malformed = await SELF.fetch("https://skill-router-mcp.test/mcp", {
			method: "POST",
			headers: { accept: "application/json, text/event-stream", "content-type": "application/json" },
			body: "not-json",
		});
		expect([400, 415]).toContain(malformed.status);
		expect(await malformed.text()).not.toMatch(/GITHUB_TOKEN|Authorization|super-secret|stack/i);
	});

	test("keeps concurrent MCP transports request-local", async () => {
		const request = (id: number) =>
			SELF.fetch("https://skill-router-mcp.test/mcp", {
				method: "POST",
				headers: { accept: "application/json, text/event-stream", "content-type": "application/json" },
				body: JSON.stringify({
					jsonrpc: "2.0",
					id,
					method: "initialize",
					params: {
						protocolVersion: "2025-06-18",
						capabilities: {},
						clientInfo: { name: `workerd-${id}`, version: "1" },
					},
				}),
			});
		const [first, second] = await Promise.all([request(11), request(12)]);
		expect(first.headers.get("mcp-session-id")).toBeNull();
		expect(second.headers.get("mcp-session-id")).toBeNull();
		expect(((await first.json()) as { id?: number }).id).toBe(11);
		expect(((await second.json()) as { id?: number }).id).toBe(12);
	});

	test("keeps the pure health projection safe when called directly", () => {
		const value = healthPayload({ version: "0.1.0" });
		expect(value.ok).toBe(true);
		expect(JSON.stringify(value)).not.toMatch(/token|authorization|secret/i);
	});
});
