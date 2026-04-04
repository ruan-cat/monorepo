import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import type { DeployTarget } from "../src/config/schema";

// ---------------------------------------------------------------------------
// filterTargetsByDiff — 纯函数，直接导入测试
// ---------------------------------------------------------------------------
import { filterTargetsByDiff } from "../src/core/git-diff-filter";

// ---------------------------------------------------------------------------
// getChangedFiles — 依赖 spawnSync，通过 vi.mock 隔离
// ---------------------------------------------------------------------------
import * as childProcess from "node:child_process";

vi.mock("node:child_process", async (importOriginal) => {
	const mod = await importOriginal<typeof import("node:child_process")>();
	return { ...mod, spawnSync: vi.fn() };
});

const spawnSyncMock = vi.mocked(childProcess.spawnSync);

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 测试数据工厂
// ---------------------------------------------------------------------------

function makeTarget(overrides: Partial<DeployTarget> = {}): DeployTarget {
	return {
		type: "static",
		targetCWD: "./packages/placeholder/dist",
		url: ["placeholder.example.com"],
		...overrides,
	} as DeployTarget;
}

// ---------------------------------------------------------------------------
// filterTargetsByDiff 测试组
// ---------------------------------------------------------------------------

describe("filterTargetsByDiff", () => {
	describe("向后兼容：未配置 watchPaths 的目标", () => {
		test("无论 changedFiles 内容如何，都纳入部署列表", () => {
			const targets = [makeTarget({ targetCWD: "./packages/a/dist" })];

			const { deploy, skipped } = filterTargetsByDiff(targets, []);
			expect(deploy).toHaveLength(1);
			expect(skipped).toHaveLength(0);
		});

		test("watchPaths 为空数组时，等同于未配置，始终部署", () => {
			const targets = [makeTarget({ targetCWD: "./packages/a/dist", watchPaths: [] })];

			const { deploy, skipped } = filterTargetsByDiff(targets, ["packages/b/index.ts"]);
			expect(deploy).toHaveLength(1);
			expect(skipped).toHaveLength(0);
		});
	});

	describe("配置了 watchPaths 的目标", () => {
		test("changedFiles 中有匹配 watchPaths 的文件时，纳入部署列表", () => {
			const target = makeTarget({
				targetCWD: "./packages/utils/dist",
				watchPaths: ["packages/utils/**"],
			});

			const { deploy, skipped } = filterTargetsByDiff(
				[target],
				["packages/utils/src/index.ts", "packages/other/README.md"],
			);

			expect(deploy).toHaveLength(1);
			expect(deploy[0]).toBe(target);
			expect(skipped).toHaveLength(0);
		});

		test("changedFiles 中无匹配 watchPaths 的文件时，纳入跳过列表", () => {
			const target = makeTarget({
				targetCWD: "./packages/utils/dist",
				watchPaths: ["packages/utils/**"],
			});

			const { deploy, skipped } = filterTargetsByDiff([target], ["packages/other/src/index.ts"]);

			expect(deploy).toHaveLength(0);
			expect(skipped).toHaveLength(1);
			expect(skipped[0]).toBe(target);
		});

		test("changedFiles 为空时，所有配置了 watchPaths 的目标均跳过", () => {
			const targets = [
				makeTarget({ targetCWD: "./packages/a/dist", watchPaths: ["packages/a/**"] }),
				makeTarget({ targetCWD: "./packages/b/dist", watchPaths: ["packages/b/**"] }),
			];

			const { deploy, skipped } = filterTargetsByDiff(targets, []);
			expect(deploy).toHaveLength(0);
			expect(skipped).toHaveLength(2);
		});

		test("watchPaths 配置多个 glob 模式，任意一个匹配即触发部署", () => {
			const target = makeTarget({
				targetCWD: "./packages/docs/dist",
				watchPaths: ["packages/docs/src/docs/**", "packages/docs/src/.vitepress/**", "packages/docs/README.md"],
			});

			const { deploy } = filterTargetsByDiff([target], ["packages/docs/src/.vitepress/config.mts"]);
			expect(deploy).toHaveLength(1);
		});
	});

	describe("混合场景：有 watchPaths 和无 watchPaths 的目标共存", () => {
		test("无 watchPaths 的目标始终部署，有 watchPaths 的目标按 diff 过滤", () => {
			const alwaysDeploy = makeTarget({ targetCWD: "./demos/landing/dist" });
			const conditionalA = makeTarget({
				targetCWD: "./packages/a/dist",
				watchPaths: ["packages/a/**"],
			});
			const conditionalB = makeTarget({
				targetCWD: "./packages/b/dist",
				watchPaths: ["packages/b/**"],
			});

			// 只有 packages/a 有变更
			const { deploy, skipped } = filterTargetsByDiff(
				[alwaysDeploy, conditionalA, conditionalB],
				["packages/a/src/index.ts"],
			);

			expect(deploy).toHaveLength(2);
			expect(deploy).toContain(alwaysDeploy);
			expect(deploy).toContain(conditionalA);

			expect(skipped).toHaveLength(1);
			expect(skipped).toContain(conditionalB);
		});

		test("5 个目标：2 个无 watchPaths + 3 个有 watchPaths，只有 1 个匹配", () => {
			const targets = [
				makeTarget({ targetCWD: "./demos/a/dist" }),
				makeTarget({ targetCWD: "./demos/b/dist" }),
				makeTarget({ targetCWD: "./packages/utils/dist", watchPaths: ["packages/utils/**"] }),
				makeTarget({ targetCWD: "./packages/docs/dist", watchPaths: ["packages/docs/**"] }),
				makeTarget({ targetCWD: "./packages/ui/dist", watchPaths: ["packages/ui/**"] }),
			];

			const { deploy, skipped } = filterTargetsByDiff(targets, ["packages/utils/src/index.ts"]);

			expect(deploy).toHaveLength(3); // 2 个无 watchPaths + utils
			expect(skipped).toHaveLength(2); // docs + ui
		});
	});
});

// ---------------------------------------------------------------------------
// getChangedFiles 测试组
// ---------------------------------------------------------------------------

describe("getChangedFiles", () => {
	// 延迟导入避免 mock 时序问题
	async function importGetChangedFiles() {
		const mod = await import("../src/core/git-diff-filter");
		return mod.getChangedFiles;
	}

	test("diffBase 为空字符串时，返回 null（降级）", async () => {
		const getChangedFiles = await importGetChangedFiles();
		const result = getChangedFiles("");
		expect(result).toBeNull();
	});

	test("spawnSync 抛出 error（git 不存在）时，返回 null（降级）", async () => {
		spawnSyncMock.mockReturnValue({
			pid: 0,
			output: [],
			stdout: "",
			stderr: "",
			status: null,
			signal: null,
			error: new Error("spawn git ENOENT"),
		});

		const getChangedFiles = await importGetChangedFiles();
		const result = getChangedFiles("HEAD~1");
		expect(result).toBeNull();
	});

	test("spawnSync 返回非零退出码（ref 无效）时，返回 null（降级）", async () => {
		spawnSyncMock.mockReturnValue({
			pid: 1,
			output: [],
			stdout: "",
			stderr: "fatal: bad object 'invalid-sha'",
			status: 128,
			signal: null,
		});

		const getChangedFiles = await importGetChangedFiles();
		const result = getChangedFiles("invalid-sha");
		expect(result).toBeNull();
	});

	test("spawnSync 成功但 stdout 为空时，返回空数组（确实无变更）", async () => {
		spawnSyncMock.mockReturnValue({
			pid: 1,
			output: [],
			stdout: "",
			stderr: "",
			status: 0,
			signal: null,
		});

		const getChangedFiles = await importGetChangedFiles();
		const result = getChangedFiles("HEAD~1");
		expect(result).toEqual([]);
	});

	test("spawnSync 成功且有输出时，返回解析后的文件列表", async () => {
		const stdout = ["packages/utils/src/index.ts", "packages/utils/README.md", "packages/domains/src/domains.ts"].join(
			"\n",
		);

		spawnSyncMock.mockReturnValue({
			pid: 1,
			output: [],
			stdout,
			stderr: "",
			status: 0,
			signal: null,
		});

		const getChangedFiles = await importGetChangedFiles();
		const result = getChangedFiles("HEAD~1");

		expect(result).toEqual([
			"packages/utils/src/index.ts",
			"packages/utils/README.md",
			"packages/domains/src/domains.ts",
		]);
	});

	test("stdout 包含多余空行时，过滤掉空行", async () => {
		spawnSyncMock.mockReturnValue({
			pid: 1,
			output: [],
			stdout: "packages/a/index.ts\n\npackages/b/index.ts\n",
			stderr: "",
			status: 0,
			signal: null,
		});

		const getChangedFiles = await importGetChangedFiles();
		const result = getChangedFiles("abc1234");

		expect(result).toEqual(["packages/a/index.ts", "packages/b/index.ts"]);
	});
});
