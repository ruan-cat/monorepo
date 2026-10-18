/**
 * Cloudflare Queue 消费插件。
 *
 * 通过 Nitro v3 官方 `cloudflare:queue` runtime hook 接收 Workers Builds
 * 事件订阅投递的消息批次，过滤 failed/canceled 事件后发送邮件通知。
 *
 * 注意：Miniflare 本地环境不支持 queue consumer，本插件只能真机验证。
 *
 * @see https://nitro.build/deploy/providers/cloudflare
 */

import { definePlugin } from "nitro";
import { useNitroHooks } from "nitro/app";
import { fetchBuildLogTail } from "../notifier/builds-api";
import { buildEmailContent, checkEmailConfig, sendBuildFailureEmail } from "../notifier/email";
import { buildEventSummary, isNotifiableOutcome, isValidBuildEvent } from "../notifier/filter";
import type { CloudflareBuildEvent, NotifierEnv } from "../notifier/types";

export default definePlugin(() => {
	const hooks = useNitroHooks();

	hooks.hook("cloudflare:queue", async ({ batch, env }) => {
		const notifierEnv = env as NotifierEnv | undefined;
		const configError = checkEmailConfig(notifierEnv);
		if (configError) {
			// 配置缺失属于永久性错误，重试无意义：记录日志后 ack 丢弃，避免无效重试
			console.error(`[cf-build-notifier] ${configError}，本批次 ${batch.messages.length} 条消息将被丢弃`);
			for (const message of batch.messages) {
				message.ack();
			}
			return;
		}

		for (const message of batch.messages) {
			const event = message.body as unknown;

			if (!isValidBuildEvent(event)) {
				console.error("[cf-build-notifier] 非法事件结构，直接 ack:", JSON.stringify(event)?.slice(0, 500));
				message.ack();
				continue;
			}

			if (!isNotifiableOutcome(event)) {
				// 订阅侧仅投递 failed/canceled，此处为代码侧兜底
				message.ack();
				continue;
			}

			const buildEvent: CloudflareBuildEvent = event;
			try {
				const summary = buildEventSummary(buildEvent);
				const logTail = await fetchBuildLogTail(buildEvent, notifierEnv?.CF_BUILDS_API_TOKEN);
				const content = buildEmailContent(summary, logTail);
				await sendBuildFailureEmail(notifierEnv!, content);
				console.log(`[cf-build-notifier] 已发送通知: ${summary.workerName} ${summary.statusLabel} (${summary.branch})`);
				message.ack();
			} catch (error) {
				// 发送失败属瞬时错误，走队列自动重试（默认 max_retries 后丢弃）
				console.error("[cf-build-notifier] 通知发送失败，触发消息重试:", error);
				message.retry();
			}
		}
	});
});
