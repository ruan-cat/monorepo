import { describe, expect, test } from "vitest";
import { createServer } from "../mcp/create-server.ts";
import { toolCatalog, toolNames } from "../mcp/tool-definitions.ts";
import { MCP_PACKAGE_VERSION } from "../runtime/package-info.ts";

describe("MCP canonical server", () => {
	test("exposes the Stage 2 tool catalog", () => {
		expect(toolCatalog().map((tool) => tool.name)).toEqual(toolNames);
		expect(toolCatalog()).toHaveLength(6);
	});
	test("creates isolated server instances", () => {
		expect(createServer({ version: MCP_PACKAGE_VERSION })).not.toBe(createServer({ version: MCP_PACKAGE_VERSION }));
	});
});
