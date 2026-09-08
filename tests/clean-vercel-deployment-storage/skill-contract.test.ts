import { describe, test, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = "ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage";
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skill = (...p: string[]) => join(repoRoot, ROOT, ...p);

describe("clean-vercel-deployment-storage 技能契约", () => {
	test("C1: SKILL.md 存在且 frontmatter 含 name/version 1.0.0/user-invocable", () => {
		const md = readFileSync(skill("SKILL.md"), "utf8");
		expect(md).toContain("name: clean-vercel-deployment-storage");
		expect(md).toContain('"1.0.0"');
		expect(md).toContain("user-invocable: true");
		expect(md).toMatch(/description: *使用时机/);
	});

	test("C2: 三份 references 全部存在", () => {
		for (const f of ["tool-landscape.md", "rest-api-playbook.md", "incident-2026-09-08.md"]) {
			expect(existsSync(skill("references", f)), `missing ${f}`).toBe(true);
		}
	});

	test("C3: src 三层文件存在且无第三方 import", () => {
		for (const f of ["core.ts", "api.ts", "cli.ts"]) {
			const src = readFileSync(skill("src", f), "utf8");
			const imports = [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
			for (const i of imports) {
				expect(i.startsWith("node:") || i.startsWith(".") || i.startsWith("/"), `非白名单 import: ${i}`).toBe(true);
			}
		}
	});

	test("C4: 外发正文无内部绝对路径泄漏", () => {
		for (const f of [
			"SKILL.md",
			"references/tool-landscape.md",
			"references/rest-api-playbook.md",
			"references/incident-2026-09-08.md",
		]) {
			const text = readFileSync(skill(f), "utf8");
			expect(text.includes("C:\\Users") || text.includes("D:\\code"), `${f} 疑似内部路径泄漏`).toBe(false);
			expect(text).not.toContain("SmallAliceWeb");
		}
	});

	test("C5: 插件 README 与 CHANGELOG 已收录本技能", () => {
		const readme = readFileSync(join(repoRoot, "ai-plugins/low-frequency-skill/README.md"), "utf8");
		const changelog = readFileSync(join(repoRoot, "ai-plugins/low-frequency-skill/CHANGELOG.md"), "utf8");
		expect(readme).toContain("clean-vercel-deployment-storage");
		expect(changelog).toContain("clean-vercel-deployment-storage");
	});

	test("C6: SKILL.md 含权限预检流程描述，execute 有 preflight 门控", () => {
		const md = readFileSync(skill("SKILL.md"), "utf8");
		expect(md).toContain("预检");
		const cliSrc = readFileSync(skill("src", "cli.ts"), "utf8");
		expect(cliSrc).toContain("preflight");
	});
});
