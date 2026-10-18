/**
 * 邮件内容拼装与 send_email binding 结构化发送。
 */

import type { BuildEventSummary, EmailContent, EmailPayload, NotifierEnv } from "./types";

/** 默认发件地址，发送域名 ruan-cat.com 需先在 Cloudflare Email Service 完成 onboard */
export const DEFAULT_FROM_ADDRESS = "builds@ruan-cat.com";

/** 发送前置检查，返回错误描述；null 表示配置齐备 */
export function checkEmailConfig(env: NotifierEnv | undefined | null): string | null {
	if (!env) {
		return "Worker env 不可用";
	}
	if (!env.EMAIL) {
		return "缺少 send_email binding（EMAIL），请检查 wrangler 配置与 Email Service 域名 onboard";
	}
	if (!env.NOTIFY_EMAIL_TO) {
		return "缺少收件邮箱 NOTIFY_EMAIL_TO，请通过 wrangler secret/var 配置";
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

export async function sendBuildFailureEmail(env: NotifierEnv, content: EmailContent): Promise<void> {
	const payload: EmailPayload = {
		to: env.NOTIFY_EMAIL_TO,
		from: env.NOTIFY_EMAIL_FROM || DEFAULT_FROM_ADDRESS,
		subject: content.subject,
		text: content.text,
	};
	await env.EMAIL.send(payload);
}
