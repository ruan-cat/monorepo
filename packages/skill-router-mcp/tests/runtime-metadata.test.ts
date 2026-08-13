import { describe, expect, test } from "vitest";
import { extractRuntimeBindings } from "../runtime/bindings.ts";
import { createDeploymentInfo } from "../runtime/deployment-info.ts";

describe("runtime bindings and deployment metadata", () => {
	test("extracts nested Nitro env bindings and keeps token in adapter-only context", () => {
		const result = extractRuntimeBindings({
			env: {
				GITHUB_OWNER: " owner ",
				GITHUB_REPO: " repo ",
				GITHUB_REF: " main ",
				GITHUB_TOKEN: "secret",
				CF_VERSION_METADATA: { id: "worker-1" },
			},
		});
		expect(result).toMatchObject({ owner: "owner", repository: "repo", ref: "main", token: "secret" });
		expect(result.versionMetadata).toEqual({ id: "worker-1" });
	});

	test("supports direct bindings and rejects missing public vars", () => {
		expect(extractRuntimeBindings({ GITHUB_OWNER: "owner", GITHUB_REPO: "repo", GITHUB_REF: "main" })).toMatchObject({
			owner: "owner",
			repository: "repo",
			ref: "main",
		});
		expect(() => extractRuntimeBindings({ GITHUB_REPO: "repo", GITHUB_REF: "main" })).toThrow(
			"GITHUB_OWNER is required",
		);
		expect(() => extractRuntimeBindings({ GITHUB_OWNER: "owner", GITHUB_REF: "main" })).toThrow(
			"GITHUB_REPO is required",
		);
		expect(() => extractRuntimeBindings({ GITHUB_OWNER: "owner", GITHUB_REPO: "repo" })).toThrow(
			"GITHUB_REF is required",
		);
	});

	test("keeps worker version metadata, build SHA and MCP version separate", () => {
		const deployment = createDeploymentInfo(
			{ id: "worker-1", tag: "release", timestamp: "2026-08-13T00:00:00Z" },
			"build-1",
		);
		expect(deployment).toEqual({
			workerVersionId: "worker-1",
			workerVersionTag: "release",
			workerVersionTimestamp: "2026-08-13T00:00:00Z",
			buildGitSha: "build-1",
		});
		expect(createDeploymentInfo({ id: "  ", tag: null, timestamp: 1 }, "build-2")).toEqual({ buildGitSha: "build-2" });
	});
});
