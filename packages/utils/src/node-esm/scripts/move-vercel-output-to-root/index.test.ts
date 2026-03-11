import * as fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
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

describe("move-vercel-output-to-root", () => {
	const temporaryDirectories = new Set<string>();

	beforeEach(() => {
		temporaryDirectories.clear();
	});

	afterEach(() => {
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
				"--dry-run",
			]);

			expect(parsedOptions).toEqual({
				rootDir: "../../..",
				sourceDir: ".vercel/output",
				targetDir: "deploy-output",
				skipClean: true,
				dryRun: true,
			});
		});
	});
});
