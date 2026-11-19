import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
	OFFICIAL_MEMORIX_SKILLS,
	auditOfficialMemorixSkills,
} from "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix-audit.ts";

const dirs: string[] = [];
function temp() {
	const dir = mkdtempSync(join(tmpdir(), "memorix-audit-"));
	dirs.push(dir);
	return dir;
}
function writeSkill(root: string, name: string, declared = name) {
	const dir = join(root, name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "SKILL.md"), `---\nname: ${declared}\ndescription: fixture\n---\n`);
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe("official Memorix skill audit", () => {
	test("AUDIT-01 reports present missing and invalid without writes", () => {
		const root = temp();
		writeSkill(root, OFFICIAL_MEMORIX_SKILLS[0]);
		writeSkill(root, OFFICIAL_MEMORIX_SKILLS[1], "wrong-name");
		writeSkill(root, "user-custom-skill");
		const before = readFileSync(join(root, "user-custom-skill/SKILL.md"), "utf8");
		const result = auditOfficialMemorixSkills(root);
		expect(result.find((item) => item.skill === OFFICIAL_MEMORIX_SKILLS[0])?.status).toBe("present");
		expect(result.find((item) => item.skill === OFFICIAL_MEMORIX_SKILLS[1])?.status).toBe("invalid");
		expect(result.find((item) => item.skill === OFFICIAL_MEMORIX_SKILLS[2])?.status).toBe("missing");
		expect(readFileSync(join(root, "user-custom-skill/SKILL.md"), "utf8")).toBe(before);
	});

	test("AUDIT-02 contains no network process or write primitive", () => {
		const source = readFileSync(
			new URL(
				"../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix-audit.ts",
				import.meta.url,
			),
			"utf8",
		);
		for (const token of ["fetch(", "execSync", "writeFile", "rename", "rmSync", "githubToken"])
			expect(source).not.toContain(token);
	});
});
