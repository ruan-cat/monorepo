/**
 * Workers Builds 构建日志 API 拉取与尾部截取。
 *
 * 端点与分页协议来自官方通知模板的第一手实现：
 * GET /accounts/{accountId}/builds/builds/{buildUuid}/logs?cursor=...
 * 响应 result.lines 为 [行号, 内容] 数组，truncated + cursor 支持翻页。
 *
 * @see https://github.com/cloudflare/templates/tree/main/workers-builds-notifications-template
 */

import type { BuildLogsResponse, CloudflareBuildEvent } from "./types";

/** 分页拉取上限，防止异常 cursor 造成死循环 */
export const MAX_LOG_PAGES = 20;

/** 邮件中携带的日志尾部行数 */
export const LOG_TAIL_LINES = 40;

/** 截取日志尾部 N 行；空日志返回空串 */
export function extractLogTail(lines: string[], maxLines = LOG_TAIL_LINES): string {
	if (lines.length === 0) {
		return "";
	}
	const tail = lines.slice(-maxLines);
	const omitted = lines.length - tail.length;
	const body = tail.join("\n");
	return omitted > 0 ? `（前 ${omitted} 行已省略）\n${body}` : body;
}

/**
 * 拉取失败构建的日志尾部。
 *
 * 未配置 token、请求失败均返回空串——日志提取是增强能力，
 * 绝不允许它的失败阻塞通知邮件的发送。
 */
export async function fetchBuildLogTail(
	event: CloudflareBuildEvent,
	apiToken: string | undefined,
	maxLines = LOG_TAIL_LINES,
): Promise<string> {
	if (!apiToken || !event.metadata?.accountId || !event.payload?.buildUuid) {
		return "";
	}

	const lines: string[] = [];
	try {
		let cursor: string | null = null;
		let pageCount = 0;

		do {
			const endpoint =
				`https://api.cloudflare.com/client/v4/accounts/${event.metadata.accountId}` +
				`/builds/builds/${event.payload.buildUuid}/logs` +
				(cursor ? `?cursor=${encodeURIComponent(cursor)}` : "");

			const res = await fetch(endpoint, {
				headers: { Authorization: `Bearer ${apiToken}` },
			});
			const data = (await res.json()) as BuildLogsResponse;

			if (data.result?.lines?.length) {
				for (const line of data.result.lines) {
					lines.push(line[1]);
				}
			}

			cursor = data.result?.truncated ? (data.result.cursor ?? null) : null;
			pageCount++;
		} while (cursor && pageCount < MAX_LOG_PAGES);
	} catch (error) {
		console.warn("[cf-build-notifier] 拉取构建日志失败（不影响通知发送）:", error);
	}

	return extractLogTail(lines, maxLines);
}
