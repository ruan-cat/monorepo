import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../../ai-plugins/common-tools/skills/init-ai-md");
const skill = readFileSync(resolve(root, "SKILL.md"), "utf8");
const template = readFileSync(resolve(root, "templates/12.memorix-memory-governance.md"), "utf8");
const examples = readFileSync(resolve(root, "references/execution-examples.md"), "utf8");
const details = readFileSync(resolve(root, "references/step-details.md"), "utf8");

describe("init-ai-md Memorix governance", () => {
	test("INIT-01 makes template 12 mandatory outside multi-select", () => {
		expect(skill).toContain("12.memorix-memory-governance.md");
		expect(skill).toMatch(/12.*不进入.*多选/s);
		expect(skill).toMatch(/每次.*强制.*增量/s);
		expect(details).toMatch(/AskUserQuestion.*排除.*12/s);
	});

	test("INIT-02 keeps the template short and points to use-memorix", () => {
		expect(template.match(/^## .+$/gm)).toEqual(["## Memorix 记忆治理"]);
		expect(template).toContain("use-memorix");
		expect(template).toContain(".memorix/golden-set/");
		expect(template).toContain(".memorix/hooks.json");
		expect(template).toContain("MEMORIX_DATA_DIR");
		expect(template).not.toContain("memorix serve");
	});

	test("INIT-03 documents custom-content preservation with concrete fixtures", () => {
		expect(examples).toContain("自定义 retention 规则保留");
		expect(examples).toContain("用户未选择任何可选模板");
		expect(skill).toMatch(/只补.*缺失.*不覆盖.*自定义/s);
	});
});
