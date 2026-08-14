import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { describe, expect, test } from "vitest";
import { handleMcpRequest, MAX_REQUEST_BYTES, MAX_RESPONSE_BYTES } from "../server/api/mcp.post.ts";
import { toolNames } from "../mcp/tool-definitions.ts";

function makeClient() {
	const transport = new StreamableHTTPClientTransport(new URL("https://skill-router.test/mcp"), {
		fetch: async (input, init) => handleMcpRequest(new Request(input, init)),
	});
	return { client: new Client({ name: "contract-test-client", version: "0.0.1" }), transport };
}

describe("MCP Web Standard Streamable HTTP contract", () => {
	test("initializes and discovers tools through the SDK client", async () => {
		const { client, transport } = makeClient();
		try {
			await client.connect(transport);
			expect(client.getServerVersion()).toEqual({ name: "skill-router-mcp", version: "0.2.0" });
			const listed = await client.listTools();
			expect(listed.tools.map((tool) => tool.name)).toEqual(toolNames);
			expect(transport.sessionId).toBeUndefined();
			const info = await client.callTool({ name: "get_server_info", arguments: {} });
			expect(info.isError).not.toBe(true);
			const response = await handleMcpRequest(
				new Request("https://skill-router.test/mcp", {
					method: "POST",
					headers: { accept: "application/json, text/event-stream", "content-type": "application/json" },
					body: JSON.stringify({
						jsonrpc: "2.0",
						id: 1,
						method: "initialize",
						params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "raw", version: "0.0.1" } },
					}),
				}),
			);
			expect(response.headers.get("content-type")).toContain("application/json");
			expect(response.headers.get("mcp-session-id")).toBeNull();
		} finally {
			await client.close();
		}
	});

	test("keeps concurrent clients isolated and stateless", async () => {
		const first = makeClient();
		const second = makeClient();
		try {
			await Promise.all([first.client.connect(first.transport), second.client.connect(second.transport)]);
			const [firstTools, secondTools] = await Promise.all([first.client.listTools(), second.client.listTools()]);
			expect(firstTools.tools.map((tool) => tool.name)).toEqual(toolNames);
			expect(secondTools.tools.map((tool) => tool.name)).toEqual(toolNames);
			expect(first.transport.sessionId).toBeUndefined();
			expect(second.transport.sessionId).toBeUndefined();
		} finally {
			await Promise.all([first.client.close(), second.client.close()]);
		}
	});

	test("rejects oversized request and response bodies", async () => {
		const oversizedRequest = await handleMcpRequest(
			new Request("https://skill-router.test/mcp", {
				method: "POST",
				headers: {
					accept: "application/json, text/event-stream",
					"content-type": "application/json",
					"content-length": String(MAX_REQUEST_BYTES + 1),
				},
				body: "{}",
			}),
		);
		expect(oversizedRequest.status).toBe(413);
		expect(await oversizedRequest.json()).toEqual({ error: "REQUEST_TOO_LARGE" });

		const oversizedResponse = await handleMcpRequest(
			new Request("https://skill-router.test/mcp", {
				method: "POST",
				headers: { accept: "application/json, text/event-stream", "content-type": "application/json" },
				body: JSON.stringify({
					jsonrpc: "2.0",
					id: 3,
					method: "tools/call",
					params: { name: "get_server_info", arguments: {} },
				}),
			}),
			{
				serverOptions: { serverInfo: { payload: "x".repeat(MAX_RESPONSE_BYTES) } as never },
			},
		);
		expect(oversizedResponse.status).toBe(413);
		expect(await oversizedResponse.json()).toEqual({ error: "RESPONSE_TOO_LARGE" });
	});
});
