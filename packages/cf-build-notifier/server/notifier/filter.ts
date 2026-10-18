/**
 * 事件结构校验、可通知性判定与摘要提取。
 *
 * 全部为纯函数，便于 vitest 单测覆盖。
 */

import type { BuildEventSummary, BuildStatusLabel, CloudflareBuildEvent } from "./types";

/**
 * 订阅仅关注 failed / canceled，此处做代码侧兜底过滤。
 *
 * 以 event.type 为权威依据：订阅侧 --events 已限定投递类型，
 * 代码侧过滤的防御目标是「投递了不该投递的类型」，
 * payload.buildOutcome 存在陈旧/矛盾的可能，不作为判定依据。
 */
export function isNotifiableOutcome(event: CloudflareBuildEvent): boolean {
	const type = event.type ?? "";
	// 官方 payload 中 canceled / cancelled 两种拼写均出现过，双兜底
	if (/cancell?ed/i.test(type)) {
		return true;
	}
	return /failed/i.test(type);
}

/** 事件结构合法性校验（队列消息体不可信，必须先验证再使用） */
export function isValidBuildEvent(value: unknown): value is CloudflareBuildEvent {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const event = value as Partial<CloudflareBuildEvent>;
	return (
		typeof event.type === "string" &&
		typeof event.payload === "object" &&
		event.payload !== null &&
		typeof event.payload.buildUuid === "string" &&
		typeof event.metadata === "object" &&
		event.metadata !== null &&
		typeof event.metadata.accountId === "string"
	);
}

function resolveStatusLabel(event: CloudflareBuildEvent): BuildStatusLabel {
	// 与 isNotifiableOutcome 同口径：type 权威制
	if (/cancell?ed/i.test(event.type ?? "")) {
		return "构建取消";
	}
	return "构建失败";
}

/** 从事件中提取人可读摘要，字段全部带兜底，缺省不阻塞通知发送 */
export function buildEventSummary(event: CloudflareBuildEvent): BuildEventSummary {
	const meta = event.payload?.buildTriggerMetadata;
	return {
		workerName: event.source?.workerName ?? meta?.repoName ?? "unknown-worker",
		statusLabel: resolveStatusLabel(event),
		branch: meta?.branch ?? "unknown-branch",
		commitHash: meta?.commitHash ?? "unknown-commit",
		commitMessage: meta?.commitMessage ?? "",
		author: meta?.author ?? "unknown-author",
		repoName: meta?.repoName ?? "unknown-repo",
		rootDirectory: meta?.rootDirectory ?? "",
		buildCommand: meta?.buildCommand ?? "",
		buildUuid: event.payload?.buildUuid ?? "",
		accountId: event.metadata?.accountId ?? "",
		eventTimestamp: event.metadata?.eventTimestamp ?? event.payload?.createdAt ?? "",
	};
}
