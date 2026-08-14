import { describe, expect, test } from "vitest";
import { createServerInfo } from "../mcp/tools/get-server-info.ts";
import { toolCatalog, toolNames } from "../mcp/tool-definitions.ts";

describe("get_server_info Stage 2", () => {
	test("reports version and canonical tools", () => {
		const info = createServerInfo({
			version: "0.2.0",
			buildGitSha: "build-A",
			deployment: { buildGitSha: "build-A" },
			owner: "ruan-cat",
			repository: "monorepo",
			ref: "main",
			tools: toolCatalog(),
		});
		expect(info.server.version).toBe("0.2.0");
		expect(info.tools.map((tool) => tool.name)).toEqual(toolNames);
	});
});
