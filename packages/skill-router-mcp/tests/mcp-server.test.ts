import { describe, expect, test } from "vitest";
import { createServer } from "../mcp/create-server.ts";
import { toolCatalog, toolDefinitions } from "../mcp/tool-definitions.ts";
import { MCP_PACKAGE_VERSION } from "../runtime/package-info.ts";

describe("MCP canonical server", () => {
	test("exposes the six canonical read-only definitions", () => {
		expect(toolDefinitions.map((tool) => tool.name)).toEqual([
			"get_server_info",
			"list_skills",
			"search_skills",
			"load_skill",
			"list_skill_resources",
			"load_skill_resource",
		]);
		expect(toolCatalog()).toHaveLength(6);
		expect(toolDefinitions.every((tool) => tool.annotations.readOnlyHint && !tool.annotations.destructiveHint)).toBe(
			true,
		);
	});
	test("creates isolated server instances", () => {
		const first = createServer({ version: MCP_PACKAGE_VERSION });
		const second = createServer({ version: MCP_PACKAGE_VERSION });
		expect(first).not.toBe(second);
	});
});
