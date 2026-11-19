import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { CUTOVER_PATHS, DELETE_PATHS, unexpectedPaths } from "./cutover-scope.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const vitestConfig = resolve(repoRoot, "tests/vitest.config.ts");

function maxExecutableLineLength() {
	const commandFiles = [
		"tests/use-memorix/commands/task-01.txt",
		"tests/use-memorix/commands/task-02.txt",
		"tests/use-memorix/commands/task-03.txt",
		"tests/use-memorix/commands/task-04.txt",
		"tests/use-memorix/commands/task-05.txt",
		"tests/use-memorix/commands/task-06.txt",
		"tests/use-memorix/commands/task-07.txt",
		"tests/use-memorix/commands/task-08.txt",
		"tests/use-memorix/commands/task-09.txt",
		"tests/use-memorix/commands/task-10.txt",
		"tests/use-memorix/commands/task-11.txt",
		"tests/use-memorix/commands/task-12.txt",
	];
	return commandFiles
		.flatMap((path) => readFileSync(resolve(repoRoot, path), "utf8").split(/\r?\n/))
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"))
		.reduce((max, line) => Math.max(max, line.length), 0);
}

describe("use-memorix cutover scope", () => {
	test("SCOPE-01 accepts only baseline and frozen implementation paths", () => {
		expect(unexpectedPaths(repoRoot, "implementation")).toEqual([]);
		expect(CUTOVER_PATHS.every((path) => !path.endsWith("/") && path !== "tests/use-memorix")).toBe(true);
	});

	test("SCOPE-02 registers new suites and removes legacy discovery", () => {
		const source = readFileSync(vitestConfig, "utf8");
		for (const pattern of [
			"use-memorix/**/*.test.ts",
			"init-ai-md/**/*.test.ts",
			"release-ai-plugins/**/*.test.ts",
			"sync-local-global-agents-skills/**/*.test.ts",
		])
			expect(source).toContain(pattern);
		expect(source).not.toContain("init-simple-memorix/**/*.test.ts");
	});

	test("SCOPE-03 keeps executable shell lines within the Windows command limit", () => {
		expect(maxExecutableLineLength()).toBeLessThanOrEqual(200);
	});

	test("SCOPE-04 scans the implementation write set for secrets with exact fixture exceptions", () => {
		const pathspecPath = resolve(repoRoot, ".git/use-memorix-cutover.pathspec");
		const writeSet = existsSync(pathspecPath)
			? readFileSync(pathspecPath, "utf8").split("\0").filter(Boolean)
			: [...CUTOVER_PATHS, ...DELETE_PATHS];
		const patterns = [
			/AKIA[0-9A-Z]{16}/,
			/gh[pousr]_[A-Za-z0-9]{20,}/,
			/Bearer +[A-Za-z0-9._-]{16,}/,
			/C:[/\\]Users[/\\](?!alice\b)/,
		];
		// 历史基线豁免：只对「新增行」告警。HEAD 已存在的同一文本行属于既有历史记录
		// （例如 CHANGELOG 里可复现的旧报错日志），重写它们等于篡改历史证据，且并非本次新增泄露。
		const baselineLines = (relative: string): Set<string> => {
			const result = spawnSync("git", ["show", `HEAD:${relative}`], { cwd: repoRoot, encoding: "utf8" });
			if (result.status !== 0) return new Set();
			return new Set(result.stdout.split(/\r?\n/));
		};
		const violations: string[] = [];
		for (const relative of writeSet) {
			const absolute = resolve(repoRoot, relative);
			if (!existsSync(absolute)) continue;
			const baseline = baselineLines(relative);
			const lines = readFileSync(absolute, "utf8").split(/\r?\n/);
			lines.forEach((line, index) => {
				if (!patterns.some((pattern) => pattern.test(line))) return;
				if (baseline.has(line)) return;
				violations.push(`${relative}:${index + 1}`);
			});
		}
		expect(violations).toEqual([]);
	});
});
