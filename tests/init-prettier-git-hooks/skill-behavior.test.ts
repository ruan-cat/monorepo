import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const skillRoot = resolve(root, "ai-plugins/common-tools/skills/init-prettier-git-hooks");
const skill = readFileSync(resolve(skillRoot, "SKILL.md"), "utf8");
const templateRoot = resolve(skillRoot, "templates");
const referencesRoot = resolve(skillRoot, "references");
const prettierTemplate = readFileSync(resolve(templateRoot, "prettier.config.mjs"), "utf8");
const lintStagedTemplate = readFileSync(resolve(templateRoot, "lint-staged.config.mjs"), "utf8");
const simpleGitHooksTemplate = readFileSync(resolve(templateRoot, "simple-git-hooks.mjs"), "utf8");

const distributedSources = () => [
	skill,
	...readdirSync(templateRoot).map((name) => readFileSync(resolve(templateRoot, name), "utf8")),
	...readdirSync(referencesRoot).map((name) => readFileSync(resolve(referencesRoot, name), "utf8")),
];

describe("init-prettier-git-hooks v3 分发边界", () => {
	test("只分发 AI 操作说明、五份纯配置模板和历史引用", () => {
		for (const directory of [
			resolve(skillRoot, "scripts"),
			resolve(skillRoot, "src"),
			resolve(root, "tests/init-prettier-git-hooks/fixtures"),
		]) {
			expect(existsSync(directory), directory).toBe(false);
		}
		expect(skill).not.toMatch(/\b(?:attestation|planDigest|runtime verifier|事务)\b/i);

		expect(readdirSync(templateRoot).sort()).toEqual([
			".editorconfig",
			".gitattributes",
			"lint-staged.config.mjs",
			"prettier.config.mjs",
			"simple-git-hooks.mjs",
		]);
		expect(readdirSync(referencesRoot).sort()).toEqual([
			"README.md",
			"crlf-and-hook-incidents.md",
			"decision-evolution.md",
			"pnpm-resolution.md",
			"runtime-loading-model.md",
			"verification-playbook.md",
			"version-matrix.md",
		]);
	});

	test("锁定 1.0.1 并使用顶层字符串插件", () => {
		expect(skill).toContain('version: "3.0.0"');
		expect(skill).toContain("prettier-plugin-lint-md@1.0.1");
		expect(skill).toMatch(/package\.json[\s\S]*lockfile[\s\S]*运行时解析/);
		expect(skill).toContain('plugins: ["prettier-plugin-lint-md"]');
		expect(prettierTemplate).toContain('plugins: ["prettier-plugin-lint-md"]');

		for (const source of [skill, prettierTemplate]) {
			expect(source).not.toContain('import prettierPluginLintMd from "prettier-plugin-lint-md";');
			expect(source).not.toContain("plugins: [prettierPluginLintMd]");
		}
		expect(prettierTemplate).not.toMatch(/import\s+.*lint-md/);
		expect(skill).toMatch(/禁止[\s\S]*顶层对象[\s\S]*禁止[\s\S]*override/);
	});

	test("模板用紧邻 plugins 的完整 JSDoc 保留错误历史", () => {
		const jsdoc = prettierTemplate.match(
			/\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*plugins: \["prettier-plugin-lint-md"\]/,
		)?.[1];

		expect(jsdoc).toBeDefined();
		expect(jsdoc).toMatch(/不要删除|禁止删除|不得删除/);
		expect(jsdoc).toMatch(/\^1\.0\.1[\s\S]*1\.0\.3[\s\S]*\.cjs/);
		expect(jsdoc).toMatch(/VSCode[\s\S]*require\.resolve[\s\S]*静默/);
		expect(jsdoc).toMatch(/对象[\s\S]*experimental CLI[\s\S]*字符串/);
		expect(jsdoc).toMatch(/override[\s\S]*resolveConfig\(\)\.plugins[\s\S]*顶层/);
		expect(jsdoc).toMatch(/精确锁定[\s\S]*1\.0\.1[\s\S]*顶层字符串/);
		expect(jsdoc).toMatch(/--plugin prettier-plugin-lint-md[\s\S]*不重复|不重复[\s\S]*--plugin/);
		expect(jsdoc).toMatch(/真实 Markdown 输出|实际 Markdown 输出/);
		expect(skill).toMatch(/完整 JSDoc[\s\S]*不得[\s\S]*(?:删除|压缩|简化)/);
	});

	test("保留完整错误演进并标明现行与废弃状态", () => {
		const references = distributedSources().slice(6).join("\n");

		expect(references).toMatch(/现行/);
		expect(references).toMatch(/已废弃/);
		expect(references).toMatch(/pnpm[\s\S]*严格隔离/);
		expect(references).toMatch(/CRLF[\s\S]*LF/);
		expect(references).toContain("WorkTankWorkerError");
		expect(references).toMatch(/对象[\s\S]*experimental CLI/);
		expect(references).toMatch(/override[\s\S]*VSCode/);
		expect(references).toMatch(/1\.0\.3[\s\S]*CJS/);
		expect(references).toMatch(/单条链路|单一链路/);
	});

	test("区分三条加载链路并保留 Hook 与 LF 安全规则", () => {
		const commandSources = [
			skill,
			...readdirSync(templateRoot).map((name) => readFileSync(resolve(templateRoot, name), "utf8")),
		];
		const activeCommands = commandSources.flatMap((source) =>
			[...source.matchAll(/^\s*(?:"[^"]+"|[A-Za-z_$][\w$-]*)\s*:\s*"([^"]*--experimental-cli[^"]*)"/gm)].map(
				(match) => match[1],
			),
		);

		expect(skill).toMatch(/普通 CLI[\s\S]*experimental CLI[\s\S]*VSCode/);
		expect(activeCommands).toHaveLength(2);
		for (const command of activeCommands) {
			expect(command.match(/--experimental-cli/g), command).toHaveLength(1);
			expect(command.match(/--no-parallel/g), command).toHaveLength(1);
			expect(command).not.toContain("--plugin prettier-plugin-lint-md");
		}
		expect(skill).toMatch(/诊断|隔离验证[\s\S]*--plugin prettier-plugin-lint-md/);
		expect(skill).toMatch(/`pnpm exec lint-staged --debug` 不是只读检查[\s\S]*只有用户授权后/);
		expect(simpleGitHooksTemplate).toMatch(/用户明确授权后执行一次 `pnpm exec simple-git-hooks` 命令/);
		expect(simpleGitHooksTemplate).toMatch(/用户明确授权后执行 `pnpm exec simple-git-hooks` 重新初始化钩子/);
		expect(simpleGitHooksTemplate).not.toContain("npx simple-git-hooks");
		expect(lintStagedTemplate).toContain("WorkTankWorkerError");
		expect(skill).toMatch(/\.gitattributes[\s\S]*\.editorconfig[\s\S]*endOfLine/);
	});

	test("禁止对外分发内容泄漏内部证据路径", () => {
		for (const source of distributedSources()) {
			expect(source).not.toMatch(
				/(?:^|[\s"'])(?:[A-Za-z]:[\\/]|\/Users\/|\/home\/)|docs\/reports|tests\/init-prettier-git-hooks|#(?:1495|2003|2011|4966|5017|5517|5526|5528|5529|5544|5545|5546)/m,
			);
		}
	});
});
