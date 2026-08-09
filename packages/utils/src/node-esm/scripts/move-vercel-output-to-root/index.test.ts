import * as fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("node:fs", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs")>();

	return {
		...actual,
		cpSync: vi.fn(actual.cpSync),
	};
});

import {
	getMoveVercelOutputToRootHelpText,
	moveVercelOutputToRoot,
	parseMoveVercelOutputToRootCliArgs,
	resolveMoveVercelOutputToRootOptions,
} from "./index";

function createMonorepoFixture() {
	const tempRoot = fs.mkdtempSync(path.join(tmpdir(), "move-vercel-output-to-root-"));
	const packageDir = path.join(tempRoot, "packages", "demo-app");
	const packageOutputDir = path.join(packageDir, ".vercel", "output");
	const rootOutputDir = path.join(tempRoot, ".vercel", "output");

	fs.mkdirSync(packageOutputDir, { recursive: true });
	fs.mkdirSync(rootOutputDir, { recursive: true });
	fs.writeFileSync(path.join(tempRoot, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n", "utf8");
	fs.writeFileSync(path.join(packageDir, "package.json"), '{"name":"demo-app"}', "utf8");
	fs.writeFileSync(path.join(packageOutputDir, "config.json"), '{"version":3}', "utf8");
	fs.mkdirSync(path.join(packageOutputDir, "functions"), { recursive: true });
	fs.writeFileSync(path.join(packageOutputDir, "functions", "index.func"), "hello", "utf8");
	fs.writeFileSync(path.join(rootOutputDir, "stale.txt"), "old", "utf8");

	return {
		tempRoot,
		packageDir,
		packageOutputDir,
		rootOutputDir,
	};
}

function createFunctionSymlinkFixture(packageOutputDir: string) {
	const serverFunctionDir = path.join(packageOutputDir, "functions", "__server.func");
	const chatFunctionDir = path.join(packageOutputDir, "functions", "v1", "chat.func");

	fs.mkdirSync(serverFunctionDir, { recursive: true });
	fs.writeFileSync(path.join(serverFunctionDir, "index.mjs"), 'export default "chat";\n', "utf8");
	fs.mkdirSync(path.dirname(chatFunctionDir), { recursive: true });
	fs.symlinkSync(serverFunctionDir, chatFunctionDir, process.platform === "win32" ? "junction" : "dir");

	return {
		chatFunctionDir,
		serverFunctionDir,
	};
}

describe("move-vercel-output-to-root", () => {
	const temporaryDirectories = new Set<string>();

	beforeEach(() => {
		temporaryDirectories.clear();
	});

	afterEach(() => {
		vi.clearAllMocks();

		for (const tempDirectory of temporaryDirectories) {
			fs.rmSync(tempDirectory, {
				force: true,
				recursive: true,
			});
		}
	});

	describe("resolveMoveVercelOutputToRootOptions", () => {
		test("应该能从子包目录自动解析 monorepo 根目录与默认路径", () => {
			const fixture = createMonorepoFixture();
			temporaryDirectories.add(fixture.tempRoot);

			const resolvedOptions = resolveMoveVercelOutputToRootOptions({
				cwd: fixture.packageDir,
			});

			expect(resolvedOptions.monorepoRoot).toBe(fixture.tempRoot);
			expect(resolvedOptions.sourceDir).toBe(path.join(fixture.packageDir, ".vercel", "output"));
			expect(resolvedOptions.targetDir).toBe(path.join(fixture.tempRoot, ".vercel", "output"));
			expect(resolvedOptions.skipClean).toBe(false);
			expect(resolvedOptions.dereference).toBe(false);
			expect(resolvedOptions.dryRun).toBe(false);
		});

		test("当 sourceDir 和 targetDir 解析到同一路径时应该抛出错误", () => {
			const fixture = createMonorepoFixture();
			temporaryDirectories.add(fixture.tempRoot);

			expect(() =>
				resolveMoveVercelOutputToRootOptions({
					cwd: fixture.packageDir,
					targetDir: path.relative(fixture.tempRoot, fixture.packageOutputDir),
				}),
			).toThrow("源目录和目标目录解析到了同一路径");
		});
	});

	describe("moveVercelOutputToRoot", () => {
		test("默认应该清空根目录旧产物并复制当前子包的 vercel 输出目录内容", () => {
			const fixture = createMonorepoFixture();
			temporaryDirectories.add(fixture.tempRoot);

			const result = moveVercelOutputToRoot({
				cwd: fixture.packageDir,
			});

			expect(result.copied).toBe(true);
			expect(fs.existsSync(path.join(fixture.rootOutputDir, "stale.txt"))).toBe(false);
			expect(fs.readFileSync(path.join(fixture.rootOutputDir, "config.json"), "utf8")).toBe('{"version":3}');
			expect(fs.readFileSync(path.join(fixture.rootOutputDir, "functions", "index.func"), "utf8")).toBe("hello");
		});

		test("dry-run 模式下不应该修改根目录内容", () => {
			const fixture = createMonorepoFixture();
			temporaryDirectories.add(fixture.tempRoot);

			const result = moveVercelOutputToRoot({
				cwd: fixture.packageDir,
				dryRun: true,
			});

			expect(result.copied).toBe(false);
			expect(fs.existsSync(path.join(fixture.rootOutputDir, "stale.txt"))).toBe(true);
			expect(fs.existsSync(path.join(fixture.rootOutputDir, "config.json"))).toBe(false);
		});

		test("应该支持自定义 sourceDir 与 targetDir", () => {
			const fixture = createMonorepoFixture();
			temporaryDirectories.add(fixture.tempRoot);

			const customSourceDir = path.join(fixture.packageDir, "custom-output");
			const customTargetDir = path.join(fixture.tempRoot, "deploy-output");
			fs.mkdirSync(customSourceDir, { recursive: true });
			fs.writeFileSync(path.join(customSourceDir, "routes.json"), '{"routes":[]}', "utf8");

			const result = moveVercelOutputToRoot({
				cwd: fixture.packageDir,
				sourceDir: "custom-output",
				targetDir: "deploy-output",
			});

			expect(result.sourceDir).toBe(customSourceDir);
			expect(result.targetDir).toBe(customTargetDir);
			expect(fs.readFileSync(path.join(customTargetDir, "routes.json"), "utf8")).toBe('{"routes":[]}');
		});

		test("默认应该将 false 解引用策略传给复制操作", () => {
			const fixture = createMonorepoFixture();
			temporaryDirectories.add(fixture.tempRoot);
			createFunctionSymlinkFixture(fixture.packageOutputDir);
			const copySpy = vi.mocked(fs.cpSync);

			const result = moveVercelOutputToRoot({
				cwd: fixture.packageDir,
			});

			expect(result.dereference).toBe(false);
			expect(copySpy).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.objectContaining({ dereference: false, force: true, recursive: true }),
			);
		});

		test("dereference 为 true 时应该将 Vercel 函数目录链接复制为实体目录", () => {
			const fixture = createMonorepoFixture();
			temporaryDirectories.add(fixture.tempRoot);
			createFunctionSymlinkFixture(fixture.packageOutputDir);
			const copySpy = vi.mocked(fs.cpSync);

			const result = moveVercelOutputToRoot({
				cwd: fixture.packageDir,
				dereference: true,
			});
			const copiedChatFunctionDir = path.join(fixture.rootOutputDir, "functions", "v1", "chat.func");

			expect(result.dereference).toBe(true);
			expect(copySpy).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.objectContaining({ dereference: true, force: true, recursive: true }),
			);
			expect(fs.lstatSync(copiedChatFunctionDir).isSymbolicLink()).toBe(false);
			expect(fs.readFileSync(path.join(copiedChatFunctionDir, "index.mjs"), "utf8")).toBe('export default "chat";\n');
		});
	});

	describe("parseMoveVercelOutputToRootCliArgs", () => {
		test("应该正确解析命令行参数", () => {
			const parsedOptions = parseMoveVercelOutputToRootCliArgs([
				"--root-dir",
				"../../..",
				"--source-dir",
				".vercel/output",
				"--target-dir",
				"deploy-output",
				"--skip-clean",
				"--dereference",
				"--dry-run",
			]);

			expect(parsedOptions).toEqual({
				rootDir: "../../..",
				sourceDir: ".vercel/output",
				targetDir: "deploy-output",
				skipClean: true,
				dereference: true,
				dryRun: true,
			});
		});

		test("帮助文本应该说明 dereference 参数", () => {
			expect(getMoveVercelOutputToRootHelpText()).toContain("--dereference");
		});
	});
});
