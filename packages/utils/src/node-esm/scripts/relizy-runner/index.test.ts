import * as fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
	buildBootstrapInstructions,
	getRelizyRunnerHelpText,
	getWorkspacePackages,
	parseRelizyRunnerCliArgs,
	prepareRelizySpawnArgs,
	shouldCheckIndependentBootstrap,
} from "./index";

function createWorkspaceFixture() {
	const tempRoot = fs.mkdtempSync(path.join(tmpdir(), "relizy-runner-"));

	fs.writeFileSync(path.join(tempRoot, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*\n", "utf8");

	const appsDir = path.join(tempRoot, "apps");
	const packagesDir = path.join(tempRoot, "packages");
	fs.mkdirSync(appsDir, { recursive: true });
	fs.mkdirSync(packagesDir, { recursive: true });

	const adminDir = path.join(appsDir, "admin");
	fs.mkdirSync(adminDir, { recursive: true });
	fs.writeFileSync(
		path.join(adminDir, "package.json"),
		JSON.stringify({ name: "@my-project/admin", version: "1.0.0" }),
		"utf8",
	);

	const typeDir = path.join(appsDir, "type");
	fs.mkdirSync(typeDir, { recursive: true });
	fs.writeFileSync(
		path.join(typeDir, "package.json"),
		JSON.stringify({ name: "@my-project/type", version: "0.1.0" }),
		"utf8",
	);

	const utilsDir = path.join(packagesDir, "utils");
	fs.mkdirSync(utilsDir, { recursive: true });
	fs.writeFileSync(
		path.join(utilsDir, "package.json"),
		JSON.stringify({ name: "@my-project/utils", version: "2.0.0" }),
		"utf8",
	);

	return { tempRoot };
}

describe("relizy-runner", () => {
	const temporaryDirectories = new Set<string>();

	beforeEach(() => {
		temporaryDirectories.clear();
	});

	afterEach(() => {
		for (const tempDirectory of temporaryDirectories) {
			fs.rmSync(tempDirectory, { force: true, recursive: true });
		}
	});

	describe("shouldCheckIndependentBootstrap", () => {
		test("仅 release 与 bump 需要检查基线 tag", () => {
			expect(shouldCheckIndependentBootstrap(["release"])).toBe(true);
			expect(shouldCheckIndependentBootstrap(["bump"])).toBe(true);
			expect(shouldCheckIndependentBootstrap(["changelog"])).toBe(false);
			expect(shouldCheckIndependentBootstrap(["version"])).toBe(false);
		});

		test("空参数返回 false", () => {
			expect(shouldCheckIndependentBootstrap([])).toBe(false);
		});

		test("带额外参数时仍以第一个参数判断", () => {
			expect(shouldCheckIndependentBootstrap(["release", "--dry-run", "--no-publish"])).toBe(true);
			expect(shouldCheckIndependentBootstrap(["changelog", "--dry-run"])).toBe(false);
		});
	});

	describe("buildBootstrapInstructions", () => {
		test("缺少基线 tag 时生成明确提示", () => {
			const instructions = buildBootstrapInstructions([
				{ name: "@my-project/admin", version: "1.0.0" },
				{ name: "@my-project/type", version: "0.1.0" },
			]);

			expect(instructions).toContain(
				"[release:relizy] 检测到本仓库尚未为以下包建立基线 tag（independent 模式首次发版前需要）：",
			);
			expect(instructions).toContain("- @my-project/admin@1.0.0");
			expect(instructions).toContain("- @my-project/type@0.1.0");
			expect(instructions).toContain('git tag "@my-project/admin@1.0.0"');
			expect(instructions).toContain('git tag "@my-project/type@0.1.0"');
			expect(instructions).toContain('git push origin "@my-project/admin@1.0.0" "@my-project/type@0.1.0"');
		});

		test("单个包时仅生成一条 tag 命令", () => {
			const instructions = buildBootstrapInstructions([{ name: "@my-project/admin", version: "2.0.0" }]);

			expect(instructions).toContain('git tag "@my-project/admin@2.0.0"');
			expect(instructions).toContain('git push origin "@my-project/admin@2.0.0"');
			expect(instructions).not.toContain("@my-project/type");
		});

		test("空数组时仍包含提示前缀但无 tag 命令", () => {
			const instructions = buildBootstrapInstructions([]);

			expect(instructions).toContain(
				"[release:relizy] 检测到本仓库尚未为以下包建立基线 tag（independent 模式首次发版前需要）：",
			);
			expect(instructions).not.toContain("git tag");
		});
	});

	describe("getWorkspacePackages", () => {
		test("从 pnpm-workspace.yaml 解析子包信息", () => {
			const fixture = createWorkspaceFixture();
			temporaryDirectories.add(fixture.tempRoot);

			const packages = getWorkspacePackages(fixture.tempRoot);

			expect(packages).toHaveLength(3);

			const names = packages.map((pkg) => pkg.name);
			expect(names).toContain("@my-project/admin");
			expect(names).toContain("@my-project/type");
			expect(names).toContain("@my-project/utils");
		});

		test("不存在 pnpm-workspace.yaml 时返回空数组", () => {
			const tempRoot = fs.mkdtempSync(path.join(tmpdir(), "relizy-runner-no-yaml-"));
			temporaryDirectories.add(tempRoot);

			const packages = getWorkspacePackages(tempRoot);
			expect(packages).toEqual([]);
		});

		test("跳过没有 package.json 的子目录", () => {
			const fixture = createWorkspaceFixture();
			temporaryDirectories.add(fixture.tempRoot);

			const emptyDir = path.join(fixture.tempRoot, "apps", "empty-app");
			fs.mkdirSync(emptyDir, { recursive: true });

			const packages = getWorkspacePackages(fixture.tempRoot);
			expect(packages).toHaveLength(3);
		});

		test("跳过缺少 name 或 version 的子包", () => {
			const fixture = createWorkspaceFixture();
			temporaryDirectories.add(fixture.tempRoot);

			const noNameDir = path.join(fixture.tempRoot, "apps", "no-name");
			fs.mkdirSync(noNameDir, { recursive: true });
			fs.writeFileSync(path.join(noNameDir, "package.json"), JSON.stringify({ version: "1.0.0" }), "utf8");

			const noVersionDir = path.join(fixture.tempRoot, "apps", "no-version");
			fs.mkdirSync(noVersionDir, { recursive: true });
			fs.writeFileSync(
				path.join(noVersionDir, "package.json"),
				JSON.stringify({ name: "@my-project/no-version" }),
				"utf8",
			);

			const packages = getWorkspacePackages(fixture.tempRoot);
			expect(packages).toHaveLength(3);
			const names = packages.map((pkg) => pkg.name);
			expect(names).not.toContain("@my-project/no-version");
		});

		test("跳过 ! 开头的排除模式和非标准 glob", () => {
			const tempRoot = fs.mkdtempSync(path.join(tmpdir(), "relizy-runner-glob-"));
			temporaryDirectories.add(tempRoot);

			fs.writeFileSync(
				path.join(tempRoot, "pnpm-workspace.yaml"),
				"packages:\n  - apps/*\n  - '!apps/ignored'\n  - deep/**/*\n",
				"utf8",
			);

			const appsDir = path.join(tempRoot, "apps");
			fs.mkdirSync(appsDir, { recursive: true });

			const appDir = path.join(appsDir, "my-app");
			fs.mkdirSync(appDir, { recursive: true });
			fs.writeFileSync(
				path.join(appDir, "package.json"),
				JSON.stringify({ name: "@test/my-app", version: "1.0.0" }),
				"utf8",
			);

			const deepDir = path.join(tempRoot, "deep", "nested", "pkg");
			fs.mkdirSync(deepDir, { recursive: true });
			fs.writeFileSync(
				path.join(deepDir, "package.json"),
				JSON.stringify({ name: "@test/deep-pkg", version: "0.1.0" }),
				"utf8",
			);

			const packages = getWorkspacePackages(tempRoot);

			const names = packages.map((pkg) => pkg.name);
			expect(names).toContain("@test/my-app");
			expect(names).not.toContain("@test/deep-pkg");
		});

		test("workspace 目录不存在时静默跳过", () => {
			const tempRoot = fs.mkdtempSync(path.join(tmpdir(), "relizy-runner-nodir-"));
			temporaryDirectories.add(tempRoot);

			fs.writeFileSync(path.join(tempRoot, "pnpm-workspace.yaml"), "packages:\n  - nonexistent/*\n", "utf8");

			const packages = getWorkspacePackages(tempRoot);
			expect(packages).toEqual([]);
		});
	});

	describe("prepareRelizySpawnArgs", () => {
		test("release 未带 --yes 时自动追加", () => {
			expect(prepareRelizySpawnArgs(["release", "--no-publish"])).toEqual(["release", "--no-publish", "--yes"]);
		});

		test("bump 未带 --yes 时自动追加", () => {
			expect(prepareRelizySpawnArgs(["bump", "--patch"])).toEqual(["bump", "--patch", "--yes"]);
		});

		test("已包含 --yes 时不重复追加", () => {
			expect(prepareRelizySpawnArgs(["release", "--yes", "--dry-run"])).toEqual(["release", "--yes", "--dry-run"]);
		});

		test("--no-yes 时不再注入且不转发给 relizy", () => {
			expect(prepareRelizySpawnArgs(["release", "--no-publish", "--no-yes"])).toEqual(["release", "--no-publish"]);
		});

		test("changelog 不注入 --yes", () => {
			expect(prepareRelizySpawnArgs(["changelog", "--dry-run"])).toEqual(["changelog", "--dry-run"]);
		});

		test("changelog 显式传入 --yes 时兼容接受但不透传", () => {
			expect(prepareRelizySpawnArgs(["changelog", "--dry-run", "--yes"])).toEqual(["changelog", "--dry-run"]);
			expect(prepareRelizySpawnArgs(["changelog", "--yes"])).toEqual(["changelog"]);
		});

		test("bump 与 --no-yes 时不追加 --yes", () => {
			expect(prepareRelizySpawnArgs(["bump", "--no-yes"])).toEqual(["bump"]);
		});

		test("仅 --no-yes 时去掉后只剩子命令仍需能区分", () => {
			expect(prepareRelizySpawnArgs(["release", "--no-yes", "--dry-run"])).toEqual(["release", "--dry-run"]);
		});

		test("--no-yes 只关闭自动注入，不覆盖用户显式传入的 --yes", () => {
			expect(prepareRelizySpawnArgs(["release", "--no-yes", "--yes"])).toEqual(["release", "--yes"]);
		});
	});

	describe("parseRelizyRunnerCliArgs", () => {
		test("无参数时返回 help", () => {
			const result = parseRelizyRunnerCliArgs([]);
			expect(result.help).toBe(true);
			expect(result.relizyArgs).toEqual([]);
		});

		test("--help 返回 help", () => {
			const result = parseRelizyRunnerCliArgs(["--help"]);
			expect(result.help).toBe(true);
		});

		test("-h 返回 help", () => {
			const result = parseRelizyRunnerCliArgs(["-h"]);
			expect(result.help).toBe(true);
		});

		test("正常参数透传给 relizy", () => {
			const result = parseRelizyRunnerCliArgs(["release", "--no-publish", "--no-provider-release"]);
			expect(result.help).toBe(false);
			expect(result.relizyArgs).toEqual(["release", "--no-publish", "--no-provider-release"]);
		});

		test("changelog 子命令透传", () => {
			const result = parseRelizyRunnerCliArgs(["changelog", "--dry-run"]);
			expect(result.help).toBe(false);
			expect(result.relizyArgs).toEqual(["changelog", "--dry-run"]);
		});

		test("bump 子命令与多参数透传", () => {
			const result = parseRelizyRunnerCliArgs(["bump", "--patch", "--no-verify"]);
			expect(result.help).toBe(false);
			expect(result.relizyArgs).toEqual(["bump", "--patch", "--no-verify"]);
		});
	});

	describe("getRelizyRunnerHelpText", () => {
		test("帮助文本包含关键用法信息", () => {
			const helpText = getRelizyRunnerHelpText();

			expect(helpText).toContain("relizy-runner");
			expect(helpText).toContain("release");
			expect(helpText).toContain("changelog");
			expect(helpText).toContain("--dry-run");
			expect(helpText).toContain("--no-publish");
			expect(helpText).toContain("--no-provider-release");
		});

		test("帮助文本引导用户查阅 relizy 完整参数", () => {
			const helpText = getRelizyRunnerHelpText();

			expect(helpText).toContain("npx relizy --help");
			expect(helpText).toContain("npx relizy release --help");
		});

		test("帮助文本包含 --help 选项说明", () => {
			const helpText = getRelizyRunnerHelpText();

			expect(helpText).toContain("-h, --help");
		});

		test("帮助文本说明自动 --yes 与 --no-yes", () => {
			const helpText = getRelizyRunnerHelpText();

			expect(helpText).toContain("--no-yes");
			expect(helpText).toContain("release / bump");
		});
	});
});
