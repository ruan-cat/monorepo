import { describe, expect, test, vi } from "vitest";
import { createSourceSnapshot } from "../services/source-snapshot.ts";

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

describe("SourceSnapshot", () => {
	test("resolves a mutable ref once and freezes the exact commit", async () => {
		let current = SHA_A;
		const resolveRef = vi.fn(async () => current);
		const source = {
			owner: "ruan-cat",
			repository: "monorepo",
			resolveRef,
			validateCommitSha: (sha: string) => sha,
		};
		const snapshot = await createSourceSnapshot({ source, ref: "main" });
		current = SHA_B;

		expect(snapshot.sourceCommitSha).toBe(SHA_A);
		expect(resolveRef).toHaveBeenCalledTimes(1);
		expect(Object.isFrozen(snapshot)).toBe(true);
		expect(snapshot.pinned).toBe(false);
	});

	test("validates a pin without resolving the configured ref", async () => {
		const resolveRef = vi.fn(async () => "branch-head");
		const validateCommitSha = vi.fn((sha: string) => sha);
		const snapshot = await createSourceSnapshot({
			source: { owner: "owner", repository: "repo", resolveRef, validateCommitSha },
			ref: "main",
			sourceCommitSha: SHA_A,
		});

		expect(snapshot).toMatchObject({
			owner: "owner",
			repository: "repo",
			ref: "main",
			sourceCommitSha: SHA_A,
			pinned: true,
		});
		expect(validateCommitSha).toHaveBeenCalledWith(SHA_A);
		expect(resolveRef).not.toHaveBeenCalled();
	});

	test("does not accept caller-controlled repository fields", async () => {
		const snapshot = await createSourceSnapshot({
			source: {
				owner: "configured-owner",
				repository: "configured-repo",
				resolveRef: async () => SHA_A,
				validateCommitSha: (sha: string) => sha,
			},
			ref: "main",
		});

		expect(snapshot.owner).toBe("configured-owner");
		expect(snapshot.repository).toBe("configured-repo");
	});
});
