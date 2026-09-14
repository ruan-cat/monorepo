import { deepStrictEqual, strictEqual, throws } from "node:assert";
import { describe, test } from "vitest";
import {
	SKIP_BUILDING_STATES,
	buildCleanupPlan,
	chunkUrls,
	parseDeploymentsJson,
} from "@ruan-cat/vercel-deploy-tool/src/core/cleanup-plan.ts";

describe("解析部署列表 JSON", () => {
	test("解析 ls --format json 的标准 .deployments 包裹", () => {
		const raw = JSON.stringify({
			deployments: [
				{ url: "a.vercel.app", state: "READY", target: "production", createdAt: 3 },
				{ url: "b.vercel.app", state: "READY", target: "preview", createdAt: 1 },
			],
		});

		const result = parseDeploymentsJson(raw);

		strictEqual(result.length, 2);
		strictEqual(result[0].url, "a.vercel.app");
		strictEqual(result[1].url, "b.vercel.app");
	});

	test("解析裸数组形态的部署列表", () => {
		const raw = JSON.stringify([
			{ url: "a.vercel.app", createdAt: 1 },
			{ url: "b.vercel.app", createdAt: 2 },
		]);

		const result = parseDeploymentsJson(raw);

		strictEqual(result.length, 2);
		strictEqual(result[0].url, "a.vercel.app");
		strictEqual(result[1].url, "b.vercel.app");
	});

	test("deployments 缺失或非数组时返回空数组", () => {
		strictEqual(parseDeploymentsJson(JSON.stringify({})).length, 0);
		strictEqual(parseDeploymentsJson(JSON.stringify({ deployments: "not-array" })).length, 0);
		strictEqual(parseDeploymentsJson(JSON.stringify({ other: 1 })).length, 0);
	});

	test("JSON 语法错误时抛出 Error", () => {
		throws(() => parseDeploymentsJson("{ not valid json"), Error);
	});

	test("丢弃无 url 字段的条目", () => {
		const raw = JSON.stringify({
			deployments: [{ url: "a.vercel.app", createdAt: 1 }, { state: "READY", createdAt: 2 }, { url: "c.vercel.app" }],
		});

		const result = parseDeploymentsJson(raw);

		strictEqual(result.length, 2);
		strictEqual(result[0].url, "a.vercel.app");
		strictEqual(result[1].url, "c.vercel.app");
	});
});

describe("构建清理保留策略", () => {
	test("production 组按 createdAt 降序保留前 N", () => {
		const deployments = [
			{ url: "old.vercel.app", target: "production", createdAt: 1 },
			{ url: "mid.vercel.app", target: "production", createdAt: 2 },
			{ url: "new.vercel.app", target: "production", createdAt: 3 },
		];

		const { entries } = buildCleanupPlan(deployments, {
			keepProductionCount: 2,
			keepPreviewCount: 0,
		});

		const actions = entries.map((entry) => entry.url + ":" + entry.action);
		deepStrictEqual(actions, ["old.vercel.app:DELETE", "mid.vercel.app:KEEP", "new.vercel.app:KEEP"]);
	});

	test("preview 组（含 target 缺失）按 createdAt 降序保留前 N", () => {
		const deployments = [
			{ url: "p1.vercel.app", target: "preview", createdAt: 1 },
			{ url: "p2.vercel.app", createdAt: 2 },
			{ url: "p3.vercel.app", target: "preview", createdAt: 3 },
		];

		const { entries } = buildCleanupPlan(deployments, {
			keepProductionCount: 0,
			keepPreviewCount: 1,
		});

		const actions = entries.map((entry) => entry.url + ":" + entry.action);
		deepStrictEqual(actions, ["p1.vercel.app:DELETE", "p2.vercel.app:DELETE", "p3.vercel.app:KEEP"]);
	});

	test("BUILDING 状态强制标记为 SKIP-BUILDING 且不占保留名额", () => {
		const deployments = [
			{ url: "building.vercel.app", target: "production", state: "BUILDING", createdAt: 99 },
			{ url: "new.vercel.app", target: "production", createdAt: 3 },
			{ url: "old.vercel.app", target: "production", createdAt: 1 },
		];

		const { entries, summary } = buildCleanupPlan(deployments, {
			keepProductionCount: 1,
			keepPreviewCount: 0,
		});

		const building = entries.find((entry) => entry.url === "building.vercel.app");
		strictEqual(building?.action, "SKIP-BUILDING");
		// 保留名额不被 BUILDING 占用：new 仍应保留
		strictEqual(entries.find((entry) => entry.url === "new.vercel.app")?.action, "KEEP");
		strictEqual(entries.find((entry) => entry.url === "old.vercel.app")?.action, "DELETE");
		strictEqual(summary.skipBuilding, 1);
		strictEqual(summary.keepProduction, 1);
	});

	test("createdAt 缺失按 0 处理，降序排至最后", () => {
		const deployments = [
			{ url: "no-date.vercel.app", target: "production" },
			{ url: "dated.vercel.app", target: "production", createdAt: 5 },
		];

		const { entries } = buildCleanupPlan(deployments, {
			keepProductionCount: 1,
			keepPreviewCount: 0,
		});

		// dated 有 createdAt，优先保留；no-date 排最后被删
		strictEqual(entries.find((entry) => entry.url === "dated.vercel.app")?.action, "KEEP");
		strictEqual(entries.find((entry) => entry.url === "no-date.vercel.app")?.action, "DELETE");
	});

	test("production 与 preview 分组统计，summary 字段正确", () => {
		const deployments = [
			{ url: "prod-new.vercel.app", target: "production", createdAt: 3 },
			{ url: "prod-old.vercel.app", target: "production", createdAt: 1 },
			{ url: "prev-new.vercel.app", target: "preview", createdAt: 3 },
			{ url: "prev-old.vercel.app", createdAt: 1 },
			{ url: "queue.vercel.app", target: "production", state: "QUEUED", createdAt: 99 },
		];

		const { summary } = buildCleanupPlan(deployments, {
			keepProductionCount: 1,
			keepPreviewCount: 1,
		});

		deepStrictEqual(summary, {
			total: 5,
			keepProduction: 1,
			keepPreview: 1,
			deleteCount: 2,
			skipBuilding: 1,
		});
	});

	test("保留名额为 0 时非 SKIP 条目全部 DELETE", () => {
		const deployments = [
			{ url: "a.vercel.app", target: "production", createdAt: 3, state: "READY" },
			{ url: "b.vercel.app", target: "production", createdAt: 1, state: "QUEUED" },
		];

		const { entries, summary } = buildCleanupPlan(deployments, {
			keepProductionCount: 0,
			keepPreviewCount: 0,
		});

		strictEqual(entries.find((entry) => entry.url === "a.vercel.app")?.action, "DELETE");
		strictEqual(entries.find((entry) => entry.url === "b.vercel.app")?.action, "SKIP-BUILDING");
		strictEqual(summary.deleteCount, 1);
		strictEqual(summary.skipBuilding, 1);
	});

	test("SKIP_BUILDING_STATES 常量覆盖 BUILDING/QUEUED/INITIALIZING", () => {
		deepStrictEqual(SKIP_BUILDING_STATES, ["BUILDING", "QUEUED", "INITIALIZING"]);
	});
});

describe("分批切分 url", () => {
	test("默认每批 20 个，正确切分余数", () => {
		const urls = Array.from({ length: 25 }, (_, index) => `u${index}.vercel.app`);

		const chunks = chunkUrls(urls);

		strictEqual(chunks.length, 2);
		strictEqual(chunks[0].length, 20);
		strictEqual(chunks[1].length, 5);
	});

	test("空数组返回空数组", () => {
		deepStrictEqual(chunkUrls([]), []);
	});

	test("数量恰好等于批次大小时返回单批", () => {
		const urls = Array.from({ length: 20 }, (_, index) => `u${index}.vercel.app`);

		const chunks = chunkUrls(urls, 20);

		strictEqual(chunks.length, 1);
		strictEqual(chunks[0].length, 20);
	});

	test("自定义批次大小正确切分", () => {
		const urls = Array.from({ length: 10 }, (_, index) => `u${index}.vercel.app`);

		const chunks = chunkUrls(urls, 3);

		strictEqual(chunks.length, 4);
		deepStrictEqual(
			chunks.map((chunk) => chunk.length),
			[3, 3, 3, 1],
		);
	});

	test("数量不足一批时返回单批全量", () => {
		const urls = ["a.vercel.app", "b.vercel.app", "c.vercel.app", "d.vercel.app", "e.vercel.app"];

		const chunks = chunkUrls(urls, 20);

		strictEqual(chunks.length, 1);
		strictEqual(chunks[0].length, 5);
	});
});
