/**
 * 邮件内容拼装与 send_email binding（MIME 形态）发送。
 *
 * 免费路径说明：restricted send_email binding 仅能发送到已验证目标地址
 * （verified destination addresses），官方明文免费、不占 Workers Paid 配额。
 * 发送 API 为 MIME 形态：env.EMAIL.send(new EmailMessage(from, to, raw))。
 *
 * @see https://developers.cloudflare.com/email-routing/email-workers/
 */

import { createMimeMessage } from "mimetext";
import type { BuildEventSummary, EmailContent, NotifierEnv } from "./types";

/** 默认发件地址，发送域 ruan-cat.com 已是 Email Routing 托管域（MX 实证） */
export const DEFAULT_FROM_ADDRESS = "builds@ruan-cat.com";

/** 发送前置检查，返回错误描述；null 表示配置齐备 */
export function checkEmailConfig(env: NotifierEnv | undefined | null): string | null {
	if (!env) {
		return "Worker env 不可用";
	}
	if (!env.EMAIL) {
		return "缺少 send_email binding（EMAIL），请检查 wrangler.toml 与 Email Routing 状态";
	}
	if (!env.NOTIFY_EMAIL_TO) {
		return "缺少收件邮箱 NOTIFY_EMAIL_TO，请通过 wrangler secret/var 配置（须为已验证目标地址）";
	}
	return null;
}

export function buildEmailContent(summary: BuildEventSummary, logTail: string): EmailContent {
	const icon = summary.statusLabel === "构建取消" ? "⚪" : "❌";
	const subject = `${icon} [CF Builds] ${summary.workerName} ${summary.statusLabel}（${summary.branch}）`;

	const sections = [
		`Worker: ${summary.workerName}`,
		`结果: ${summary.statusLabel}`,
		`仓库: ${summary.repoName}`,
		`分支: ${summary.branch}`,
		`提交: ${summary.commitHash}`,
		`提交信息: ${summary.commitMessage || "（无）"}`,
		`作者: ${summary.author}`,
		`根目录: ${summary.rootDirectory || "（无）"}`,
		`构建命令: ${summary.buildCommand || "（无）"}`,
		`时间: ${summary.eventTimestamp || "（无）"}`,
		`构建 ID: ${summary.buildUuid}`,
		`账号 ID: ${summary.accountId}`,
	];

	if (logTail) {
		sections.push("", "―――― 构建日志（尾部） ――――", logTail);
	} else {
		sections.push("", "（未携带构建日志：未配置 CF_BUILDS_API_TOKEN 或日志拉取失败。配置 token 后可自动提取错误日志）");
	}

	return { subject, text: sections.join("\n") };
}

/** 由结构化内容构造 raw MIME 邮件（纯函数，mimetext 负责头编码与分节） */
export function buildMimeMessage(from: string, to: string, content: EmailContent): string {
	const message = createMimeMessage();
	message.setSender({ addr: from });
	message.setRecipient(to);
	message.setSubject(content.subject);
	message.addMessage({ contentType: "text/plain", data: content.text });
	return message.asRaw();
}

export async function sendBuildFailureEmail(env: NotifierEnv, content: EmailContent): Promise<void> {
	const to = env.NOTIFY_EMAIL_TO;
	const from = env.NOTIFY_EMAIL_FROM || DEFAULT_FROM_ADDRESS;
	// cloudflare:email 是 Workers 运行时模块（node 测试环境不可解析），
	// 动态导入确保纯函数测试链路不受影响，打包由 nitro cloudflare preset external 处理
	const { EmailMessage } = await import("cloudflare:email");
	const raw = buildMimeMessage(from, to, content);
	await env.EMAIL.send(new EmailMessage(from, to, raw));
}
