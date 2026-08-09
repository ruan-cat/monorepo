import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const skillRoot = resolve(root, "ai-plugins/common-tools/skills/init-prettier-git-hooks");
const skill = readFileSync(resolve(skillRoot, "SKILL.md"), "utf8");
const templateRoot = resolve(skillRoot, "templates");
const lintStagedTemplate = readFileSync(resolve(templateRoot, "lint-staged.config.mjs"), "utf8");
const simpleGitHooksTemplate = readFileSync(resolve(templateRoot, "simple-git-hooks.mjs"), "utf8");

describe("init-prettier-git-hooks 分发边界", () => {
	test("只分发 AI 操作说明和五份纯配置模板", () => {
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
		expect(existsSync(resolve(skillRoot, "templates/lint-staged.config.js"))).toBe(false);
	});

	test("要求 AI 保护用户改动并仅迁移可证明安全的静态插件配置", () => {
		expect(skill).toContain('version: "2.0.0"');
		expect(skill).toMatch(/AI 按后续流程审计目标项目[\s\S]*直接、精准地修改目标配置/);
		expect(skill).toMatch(/不得创建或调用独立迁移程序[\s\S]*不得绕过审计批量覆盖或自动盲改/);
		expect(skill).not.toContain("不得自动修改目标项目");
		expect(skill).toMatch(/根 package\.json/);
		expect(skill).toMatch(/Git 状态/);
		expect(skill).toMatch(/已有改动/);
		expect(skill).toMatch(/逐文件|定点|精准/);
		expect(skill).toContain('import prettierPluginLintMd from "prettier-plugin-lint-md";');
		expect(skill).toContain("plugins: [prettierPluginLintMd]");
		expect(skill).toContain("根 `package.json` 的 `prettier` 字段、`prettier.config.*` 与 `.prettierrc*`");
		expect(skill).toMatch(/统计实际有效的配置来源[\s\S]*多个活跃来源[\s\S]*停止修改并请用户确认/);
		expect(skill).toMatch(
			/唯一有效旧配置是采用 ESM 的 JavaScript\/MJS 文件[\s\S]*合法加入上述 default import[\s\S]*顶层 `plugins`[\s\S]*静态数组[\s\S]*只把该字符串元素替换/,
		);
		expect(skill).toMatch(/同一数组可以包含其他字面量插件[\s\S]*保留其他元素、原有顺序和注释/);
		expect(skill).toMatch(
			/`package\.json#prettier`、JSON\/JSONC\/YAML `\.prettierrc\*`、CJS 配置[\s\S]*停止修改并请用户决定[\s\S]*迁移为 `prettier\.config\.mjs`[\s\S]*用户指定的人工方案/,
		);
		expect(skill).toMatch(/不得把 import 插入非 JavaScript 载体/);
		expect(skill).toMatch(
			/动态 plugins、spread、computed key、变量间接引用、多个 Prettier 配置[\s\S]*停止修改并请用户人工处理/,
		);
	});

	test("保留兼容性和 LF 事故规则，并禁止仓库内部路径泄漏", () => {
		const commandSources = [
			skill,
			...readdirSync(templateRoot).map((name) => readFileSync(resolve(templateRoot, name), "utf8")),
		];
		const activeCommands = commandSources.flatMap((source) =>
			[...source.matchAll(/^\s*(?:"[^"]+"|[A-Za-z_$][\w$-]*)\s*:\s*"([^"]*--experimental-cli[^"]*)"/gm)].map(
				(match) => match[1],
			),
		);

		expect(skill).toContain("prettier-plugin-lint-md@1.0.1");
		expect(activeCommands).toEqual([
			"prettier --experimental-cli --write --no-parallel .",
			"prettier --experimental-cli --write --no-parallel",
		]);
		for (const command of activeCommands) {
			expect(command).toBeDefined();
			expect(command.match(/--experimental-cli/g), command).toHaveLength(1);
			expect(command.match(/--no-parallel/g), command).toHaveLength(1);
		}
		expect(skill).toMatch(/`pnpm exec lint-staged --debug` 不是只读检查[\s\S]*只有用户授权后/);
		expect(simpleGitHooksTemplate).toMatch(/用户明确授权后执行一次 `pnpm exec simple-git-hooks` 命令/);
		expect(simpleGitHooksTemplate).toMatch(/用户明确授权后执行 `pnpm exec simple-git-hooks` 重新初始化钩子/);
		expect(simpleGitHooksTemplate).not.toContain("npx simple-git-hooks");
		expect(lintStagedTemplate).toContain("WorkTankWorkerError");
		expect(lintStagedTemplate).toContain("https://github.com/lint-staged/lint-staged/blob/main/README.md#typescript");
		expect(lintStagedTemplate).toContain(
			"https://github.com/lint-staged/lint-staged/blob/main/README.md#automatically-fix-code-style-with-prettier-for-any-format-prettier-supports",
		);
		expect(lintStagedTemplate).toMatch(/worker pool[\s\S]*CPU 核心数[\s\S]*1\.x 背景[\s\S]*当前 v2/);
		expect(skill).toMatch(/\.gitattributes[\s\S]*\.editorconfig[\s\S]*endOfLine/);
		expect(skill).not.toMatch(/[A-Za-z]:\\\\|\/Users\/|\/home\/|docs\/reports|tests\/init-prettier-git-hooks/);
	});
});
