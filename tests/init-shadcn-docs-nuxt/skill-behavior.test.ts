import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const skillRoot = resolve(root, "ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt");
const referencesRoot = resolve(skillRoot, "references");
const templateRoot = resolve(skillRoot, "templates");
const skill = readFileSync(resolve(skillRoot, "SKILL.md"), "utf8");
const fullNuxtConfig = readFileSync(resolve(templateRoot, "nuxt.config.full.ts"), "utf8");
const windowsReference = readFileSync(resolve(referencesRoot, "windows.md"), "utf8");
const mdcReference = readFileSync(resolve(referencesRoot, "mdc-prettier.md"), "utf8");

function listRelativeFiles(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(directory, entry.name);
		if (entry.isSymbolicLink()) return [];
		if (entry.isFile()) return [entry.name];
		if (entry.isDirectory()) return listRelativeFiles(path).map((child) => `${entry.name}/${child}`);
		return [];
	});
}

const distributedSources = () => [
	skill,
	...listRelativeFiles(referencesRoot).map((file) => readFileSync(resolve(referencesRoot, file), "utf8")),
	...listRelativeFiles(templateRoot)
		.filter((file) => !file.startsWith(".nuxt/"))
		.map((file) => readFileSync(resolve(templateRoot, file), "utf8")),
];

describe("init-shadcn-docs-nuxt 分发与生产边界", () => {
	test("不分发 Nuxt 生成物", () => {
		expect(existsSync(resolve(templateRoot, ".nuxt"))).toBe(false);
	});

	test("workspace 源码仅能开发期 opt-in，Windows 与 MDC 示例不扩大风险", () => {
		expect(fullNuxtConfig).toMatch(
			/process\.env\.NODE_ENV === "development"[\s\S]*SHADCN_DOCS_USE_WORKSPACE_SOURCE === "1"/,
		);
		expect(fullNuxtConfig).toMatch(
			/const useWorkspaceSourceAliases =\s*process\.env\.NODE_ENV === "development" && process\.env\.SHADCN_DOCS_USE_WORKSPACE_SOURCE === "1";/,
		);
		expect(fullNuxtConfig).toMatch(
			/const workspaceAliases = useWorkspaceSourceAliases \? getYourLibAliases\(\) : \{\};/,
		);
		expect(fullNuxtConfig).toMatch(/^\talias: workspaceAliases,$/m);
		expect(fullNuxtConfig).not.toContain("alias: getYourLibAliases(),");
		expect(fullNuxtConfig.match(/noExternal:\s*\[\s*"debug"\s*\]/g)).toHaveLength(1);
		expect(fullNuxtConfig).not.toMatch(/nitro\s*:\s*\{[\s\S]*?\binline\s*:/);
		expect(windowsReference).toContain("pnpm exec nuxi build --logLevel=verbose");
		expect(windowsReference).not.toContain("Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force");
		expect(mdcReference).toMatch(/✅ 正确：行首直接写[\s\S]*\n::demo-playground/);
	});

	test("现行 reference 完整且分发内容无内部泄漏", () => {
		expect(listRelativeFiles(referencesRoot).sort()).toEqual([
			"README.md",
			"compat.md",
			"incident-repair.md",
			"mdc-prettier.md",
			"nuxt-config.md",
			"production-graph-and-runtime-closure.md",
			"tailwind-css.md",
			"windows.md",
			"workspace.md",
		]);
		for (const source of distributedSources()) {
			expect(source).not.toMatch(
				/(?:^|[^A-Za-z])(?:[A-Za-z]:[\\/]|[\\/](?:Users|home|tmp|workspace|mnt)[\\/]|docs[\\/]reports|tests[\\/]init-shadcn-docs-nuxt|@eams-monorepo)/,
			);
		}
	});

	test("将 Element Plus alias、externalization、Turbo 与 artifact 验收限定在正确边界", () => {
		const productionReferencePath = resolve(referencesRoot, "production-graph-and-runtime-closure.md");
		expect(existsSync(productionReferencePath)).toBe(true);
		const productionReference = readFileSync(productionReferencePath, "utf8");
		expect(productionReference).toContain('"@popperjs/core": "npm:@sxzz/popperjs-es@^2.11.7"');
		expect(productionReference).toMatch(/element-plus[\s\S]*ERR_MODULE_NOT_FOUND[\s\S]*部署文档包/);
		expect(productionReference).toMatch(/noExternal[\s\S]*exact error[\s\S]*删除条件/);
		expect(productionReference).toMatch(/turbo run <task> --force[\s\S]*\.output[\s\S]*HTTP smoke/);
		expect(readFileSync(resolve(templateRoot, "package.json"), "utf8")).not.toMatch(
			/@popperjs\/core|@sxzz\/popperjs-es/,
		);
	});

	test("生产 reference 将 artifact、inline 和 cache 契约限定在独立条件", () => {
		const productionReference = readFileSync(
			resolve(referencesRoot, "production-graph-and-runtime-closure.md"),
			"utf8",
		);
		expect(productionReference).toMatch(
			/element-plus[\s\S]*importer[\s\S]*部署文档包[\s\S]*ERR_MODULE_NOT_FOUND[\s\S]*启动.*\.output[\s\S]*HTTP 请求/,
		);
		expect(productionReference).toMatch(
			/nitro\.externals\.inline[\s\S]*Nitro Rollup 独立阶段[\s\S]*exact error[\s\S]*不能替代[\s\S]*删除条件/,
		);
		expect(productionReference).toMatch(
			/只有[\s\S]*(?:cache 可信度|cache\/artifact 证据冲突)[\s\S]*turbo run <task> --force[\s\S]*常规生产验证不执行/,
		);
		expect(productionReference).not.toMatch(
			/SmallAliceWeb|EAMS|@eams-monorepo|docs[\\/]reports|reports[\\/]|https?:\/\/|[A-Za-z]:\\\\/i,
		);
	});

	test("SKILL 将 Turbo 强制重跑限制为诊断，并保留常规产物 HTTP 验收", () => {
		expect(skill).toMatch(
			/只有诊断 cache 可信度或 cache\/artifact 证据冲突时[\s\S]*turbo run <task> --force[\s\S]*常规生产验收不执行/,
		);
		expect(skill).toMatch(/产物\s*\| 必须启动 `\.output` server[\s\S]*HTTP smoke/);
	});
});
