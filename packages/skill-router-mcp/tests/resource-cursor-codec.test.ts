import { describe, expect, test } from "vitest";
import { decodeResourceCursor, encodeResourceCursor } from "../services/resource-resolver.ts";

const SHA = "a".repeat(40);

describe("resource cursor codec", () => {
	test("round-trips the snapshot identity and offset", () => {
		const encoded = encodeResourceCursor({
			v: 1,
			skillId: "git-commit",
			sourceCommitSha: SHA,
			prefix: "references/",
			offset: 7,
		});
		expect(decodeResourceCursor(encoded)).toEqual({
			v: 1,
			skillId: "git-commit",
			sourceCommitSha: SHA,
			prefix: "references/",
			offset: 7,
		});
	});

	test("maps malformed cursors to the stable domain error", () => {
		expect(() => decodeResourceCursor("invalid-cursor")).toThrowError(
			expect.objectContaining({ code: "RESOURCE_CURSOR_INVALID" }),
		);
	});
});
