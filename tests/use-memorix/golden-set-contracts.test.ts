import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
	computeCandidateId,
	validateFederatedBundle,
	validateGoldenSetFile,
	validateRetrievalCandidate,
} from "../../ai-plugins/common-tools/skills/use-memorix/src/golden-set/contracts.mjs";
import { redactQuery } from "../../ai-plugins/common-tools/skills/use-memorix/src/golden-set/redaction.mjs";

const kinds = ["zero-candidate", "fuzzy-only", "fallback-generation"] as const;
const sourceProject = "owner/repository";
const captureDate = "2026-11-17";
const query = "find shim regression";
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

function candidate() {
	return {
		schemaVersion: "memorix-retrieval-candidate/v1",
		candidateId: computeCandidateId(sourceProject, captureDate, query),
		sourceProject,
		host: "zcode",
		captureMode: "automatic-hook",
		toolName: "memorix_search",
		captureDate,
		capturedAt: "2026-11-17T01:02:03.000Z",
		query: { redactedOriginal: query, sha256: sha(query) },
		signals: [{ kind: "zero-candidate", reasons: ["candidateCount=0"] }],
		resultSummary: { candidateCount: 0, topN: [] },
		contract: { structuredContent: true, enabledRules: [...kinds], disabledRules: [] },
	};
}

function goldenSet() {
	return {
		schemaVersion: "memorix-golden-set-case/v1",
		project: { repository: sourceProject },
		cases: [
			{
				id: "shim-regression",
				query,
				capturedAt: "2026-11-17T01:02:03.000Z",
				failureKinds: ["zero-candidate"],
				expected: { mustMatch: [{ titleIncludes: ["shim"] }] },
				localHints: { observationIds: [42] },
			},
		],
	};
}

describe("golden set contracts", () => {
	test("GOLD-01 validates cases candidates bundles and redaction boundaries", () => {
		expect(validateGoldenSetFile(goldenSet()).ok).toBe(true);
		expect(validateRetrievalCandidate(candidate()).ok).toBe(true);
		const bundle = {
			schemaVersion: "memorix-golden-set-bundle/v1",
			sourceProject,
			projectId: "project-1",
			sourceCommit: "a".repeat(40),
			capturedAt: "2026-11-17T01:02:03.000Z",
			exportedAt: "2026-11-17T02:03:04.000Z",
			upstreamCaseId: "shim-regression",
			case: { ...goldenSet().cases[0], localHints: undefined },
		};
		expect(validateFederatedBundle(bundle).ok).toBe(true);
	});

	test("GOLD-02 redacts Windows POSIX and worktree paths deterministically", () => {
		expect(
			redactQuery("C:/Users/alice/token.txt", {
				homeDir: "C:/Users/alice",
				projectRoot: "D:/code/repo",
			}),
		).toBe("~/token.txt");
		expect(
			redactQuery("/home/alice/repo/src/a.ts", {
				homeDir: "/home/alice",
				projectRoot: "/home/alice/repo",
			}),
		).toBe("<project-root>/src/a.ts");
		expect(
			redactQuery("/Users/alice/worktrees/x/src/a.ts", {
				homeDir: "/Users/alice",
				projectRoot: "/Users/alice/worktrees/x",
			}),
		).toBe("<project-root>/src/a.ts");
	});

	test.each([
		[
			"candidate id",
			(value: any) => {
				value.candidateId = "0".repeat(64);
			},
		],
		[
			"signals order",
			(value: any) => {
				value.signals = [
					{ kind: "fallback-generation", reasons: ["x"] },
					{ kind: "fuzzy-only", reasons: ["y"] },
				];
			},
		],
		[
			"rule overlap",
			(value: any) => {
				value.contract.disabledRules = ["zero-candidate"];
			},
		],
		[
			"structuredContent",
			(value: any) => {
				value.contract.structuredContent = false;
			},
		],
		[
			"capture time",
			(value: any) => {
				value.capturedAt = "2026-11-18T00:00:00.000Z";
			},
		],
		[
			"GitHub identity",
			(value: any) => {
				value.sourceProject = "https://github.com/owner/repo";
			},
		],
	])("GOLD-03 rejects invalid %s", (_name, mutate) => {
		const value = candidate();
		mutate(value);
		expect(validateRetrievalCandidate(value).ok).toBe(false);
	});

	test("GOLD-04 rejects local hints and observation ids in bundles", () => {
		const value = goldenSet().cases[0] as any;
		const bundle = {
			schemaVersion: "memorix-golden-set-bundle/v1",
			sourceProject,
			projectId: "p",
			sourceCommit: "a".repeat(40),
			capturedAt: value.capturedAt,
			exportedAt: value.capturedAt,
			upstreamCaseId: value.id,
			case: value,
		};
		expect(validateFederatedBundle(bundle).ok).toBe(false);
	});
});
