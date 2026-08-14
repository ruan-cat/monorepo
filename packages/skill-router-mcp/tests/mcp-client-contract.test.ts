import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { describe, expect, test } from "vitest";
import { handleMcpRequest } from "../server/api/mcp.post.ts";
import { toolNames } from "../mcp/tool-definitions.ts";

function makeClient() {
	const transport = new StreamableHTTPClientTransport(new URL("https://skill-router.test/mcp"), {
		fetch: async (input, init) => handleMcpRequest(new Request(input, init)),
	});
	return { client: new Client({ name: "contract-test-client", version: "0.0.1" }), transport };
}

describe("MCP Streamable HTTP contract", () => {
	test("initializes and discovers the Stage 2 tool catalog", async () => {
		const { client, transport } = makeClient();
		try {
			await client.connect(transport);
			expect(client.getServerVersion()).toEqual({ name: "skill-router-mcp", version: "0.2.0" });
			const listed = await client.listTools();
			expect(listed.tools.map((tool) => tool.name)).toEqual(toolNames);
			expect(transport.sessionId).toBeUndefined();
		} finally {
			await client.close();
		}
	});
});
