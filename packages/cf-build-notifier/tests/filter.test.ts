import { describe, expect, test } from "vitest";
import { buildEventSummary, isNotifiableOutcome, isValidBuildEvent } from "../server/notifier/filter";
import type { CloudflareBuildEvent } from "../server/notifier/types";

function makeEvent(overrides: Partial<CloudflareBuildEvent> = {}): CloudflareBuildEvent {
	return {
		type: "cf.workersBuilds.worker.build.failed",
		source: {
			type: "workersBuilds.worker",
			workerName: "demo-worker",
		},
		payload: {
			buildUuid: "build-uuid-001",
			status: "failed",
			buildOutcome: "failure",
			createdAt: "2026-10-18T10:00:00Z",
			buildTriggerMetadata: {
				buildTriggerSource: "git",
				branch: "dev",
				commitHash: "abc1234",
				commitMessage: "fix: something",
				author: "ruan-cat",
				buildCommand: "pnpm build",
				deployCommand: "npx wrangler deploy",
				rootDirectory: "packages/demo",
				repoName: "ruan-cat/monorepo",
				providerAccountName: "ruan-cat",
				providerType: "github",
			},
		},
		metadata: {
			accountId: "account-001",
			eventSubscriptionId: "sub-001",
			eventSchemaVersion: 1,
			eventTimestamp: "2026-10-18T10:05:00Z",
		},
		...overrides,
	};
}

describe("isValidBuildEvent", () => {
	test("合法事件通过校验", () => {
		expect(isValidBuildEvent(makeEvent())).toBe(true);
	});

	test("null 与基础类型不通过校验", () => {
		expect(isValidBuildEvent(null)).toBe(false);
		expect(isValidBuildEvent(undefined)).toBe(false);
		expect(isValidBuildEvent("failed")).toBe(false);
		expect(isValidBuildEvent(42)).toBe(false);
	});

	test("缺少 type 字段不通过校验", () => {
		const event = makeEvent();
		delete (event as Partial<CloudflareBuildEvent>).type;
		expect(isValidBuildEvent(event)).toBe(false);
	});

	test("缺少 payload.buildUuid 不通过校验", () => {
		const event = makeEvent();
		delete (event as { payload?: { buildUuid?: string } }).payload?.buildUuid;
		expect(isValidBuildEvent(event)).toBe(false);
	});

	test("缺少 metadata.accountId 不通过校验", () => {
		const event = makeEvent();
		delete (event as { metadata?: { accountId?: string } }).metadata?.accountId;
		expect(isValidBuildEvent(event)).toBe(false);
	});
});

describe("isNotifiableOutcome", () => {
	test("type 含 failed 可通知", () => {
		expect(isNotifiableOutcome(makeEvent())).toBe(true);
	});

	test("type 含 canceled 可通知（官方拼写）", () => {
		const event = makeEvent({
			type: "cf.workersBuilds.worker.build.canceled",
			payload: {
				buildUuid: "build-uuid-002",
				status: "canceled",
				buildOutcome: "canceled",
				createdAt: "2026-10-18T10:00:00Z",
			},
		});
		expect(isNotifiableOutcome(event)).toBe(true);
	});

	test("type 含 cancelled 可通知（社区历史拼写兜底）", () => {
		const event = makeEvent({
			type: "cf.workersBuilds.worker.build.cancelled",
			payload: {
				buildUuid: "build-uuid-003",
				status: "cancelled",
				buildOutcome: "cancelled",
				createdAt: "2026-10-18T10:00:00Z",
			},
		});
		expect(isNotifiableOutcome(event)).toBe(true);
	});

	test("type 含 started 且 buildOutcome 为 null 不可通知", () => {
		const event = makeEvent({
			type: "cf.workersBuilds.worker.build.started",
			payload: {
				buildUuid: "build-uuid-004",
				status: "running",
				buildOutcome: null,
				createdAt: "2026-10-18T10:00:00Z",
			},
		});
		expect(isNotifiableOutcome(event)).toBe(false);
	});

	test("started 事件即使 buildOutcome 为 failure 也以 type 为准不可通知", () => {
		const event = makeEvent({
			type: "cf.workersBuilds.worker.build.started",
			payload: {
				buildUuid: "build-uuid-004",
				status: "running",
				buildOutcome: "failure",
				createdAt: "2026-10-18T10:00:00Z",
			},
		});
		expect(isNotifiableOutcome(event)).toBe(false);
	});

	test("type 语义异常但 buildOutcome 为 canceled 时不可通知（type 权威制）", () => {
		const event = makeEvent({
			type: "cf.workersBuilds.worker.build.updated",
			payload: {
				buildUuid: "build-uuid-007",
				status: "canceled",
				buildOutcome: "canceled",
				createdAt: "2026-10-18T10:00:00Z",
			},
		});
		expect(isNotifiableOutcome(event)).toBe(false);
	});
});

describe("buildEventSummary", () => {
	test("完整元数据正确提取", () => {
		const summary = buildEventSummary(makeEvent());
		expect(summary.workerName).toBe("demo-worker");
		expect(summary.statusLabel).toBe("构建失败");
		expect(summary.branch).toBe("dev");
		expect(summary.commitHash).toBe("abc1234");
		expect(summary.author).toBe("ruan-cat");
		expect(summary.repoName).toBe("ruan-cat/monorepo");
		expect(summary.buildUuid).toBe("build-uuid-001");
		expect(summary.accountId).toBe("account-001");
	});

	test("canceled 事件状态标签为构建取消", () => {
		const event = makeEvent({
			type: "cf.workersBuilds.worker.build.canceled",
			payload: {
				buildUuid: "build-uuid-005",
				status: "canceled",
				buildOutcome: "canceled",
				createdAt: "2026-10-18T10:00:00Z",
			},
		});
		expect(buildEventSummary(event).statusLabel).toBe("构建取消");
	});

	test("缺少 buildTriggerMetadata 与 source.workerName 时字段全部兜底不抛错", () => {
		const event = makeEvent({
			source: { type: "workersBuilds.worker" },
			payload: {
				buildUuid: "build-uuid-006",
				status: "failed",
				buildOutcome: "failure",
				createdAt: "2026-10-18T10:00:00Z",
			},
		});
		const summary = buildEventSummary(event);
		expect(summary.workerName).toBe("unknown-worker");
		expect(summary.branch).toBe("unknown-branch");
		expect(summary.commitMessage).toBe("");
	});

	test("缺少 source.workerName 时回退 repoName", () => {
		const event = makeEvent();
		delete (event.source as { workerName?: string }).workerName;
		expect(buildEventSummary(event).workerName).toBe("ruan-cat/monorepo");
	});
});
