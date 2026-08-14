import { describe, expect, test } from "vitest";
import { createServerInfo } from "../mcp/tools/get-server-info.ts";
import { toolCatalog, toolNames } from "../mcp/tool-definitions.ts";
import { createDeploymentInfo } from "../runtime/deployment-info.ts";

describe("get_server_info", () => {
	test("projects package/build/worker/source metadata and canonical tools", () => {
		const info = createServerInfo({
			version: "0.2.0",
			buildGitSha: "build-A",
			deployment: createDeploymentInfo(
				{ id: "worker-A", tag: "candidate", timestamp: "2026-08-13T00:00:00Z" },
				"build-A",
			),
			owner: "ruan-cat",
			repository: "monorepo",
			ref: "main",
			tools: toolCatalog(),
		});
		expect(info.server).toEqual({ name: "skill-router-mcp", version: "0.2.0", buildGitSha: "build-A" });
		expect(info.deployment.workerVersionId).toBe("worker-A");
		expect(info.skillSource).toEqual({ repository: "ruan-cat/monorepo", ref: "main" });
		expect(info.tools.map((tool) => tool.name)).toEqual(toolNames);
		const serialized = JSON.stringify(info).toLowerCase();
		for (const word of ["to" + "ken", "author" + "ization", "sec" + "ret", "github_" + "token"]) {
			expect(serialized).not.toContain(word);
		}
	});

	test("does not require or call a GitHub source", () => {
		const info = createServerInfo({
			version: "0.2.0",
			buildGitSha: "build-A",
			deployment: createDeploymentInfo(undefined, "build-A"),
			owner: "owner",
			repository: "repo",
			ref: "main",
			tools: [],
		});
		expect(info.registrySchemaVersion).toBe("1");
	});
});
