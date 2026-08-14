import { describe, expect, test } from "vitest";
import { normalizeResourcePath, normalizeResourcePrefix } from "../services/resource-resolver.ts";

const parent = ".".repeat(2);
const backslash = String.fromCharCode(92);
const percent = String.fromCharCode(37);
const nul = String.fromCharCode(0);
const colon = String.fromCharCode(58);

describe("Skill resource path isolation", () => {
	test("accepts raw Skill-root relative POSIX paths", () => {
		expect(normalizeResourcePath("references/commit-types.ts")).toBe("references/commit-types.ts");
		expect(normalizeResourcePrefix("references/")).toBe("references/");
	});

	test("rejects paths that need normalization or decoding", () => {
		const invalid = [
			"/outside",
			`references${backslash}file.md`,
			`references/${parent}/outside`,
			"references/./file.md",
			"references//file.md",
			`C${colon}/outside`,
			`${backslash}${backslash}host${backslash}share`,
			`references/${percent}2e${percent}2e/outside`,
			`references/${percent}252e/outside`,
			`references/${nul}file.md`,
		];
		for (const value of invalid) {
			expect(() => normalizeResourcePath(value)).toThrowError(expect.objectContaining({ code: "INVALID_RESOURCE_PATH" }));
		}
	});
});
