import { describe, expect, test } from "vitest";
import {
	buildEmailContent,
	buildMimeMessage,
	checkEmailConfig,
	DEFAULT_FROM_ADDRESS,
	FROM_DISPLAY_NAME,
} from "../server/notifier/email";
import type { BuildEventSummary, NotifierEnv } from "../server/notifier/types";

const summary: BuildEventSummary = {
	workerName: "demo-worker",
	statusLabel: "构建失败",
	branch: "dev",
	commitHash: "abc1234",
	commitMessage: "fix: something",
	author: "ruan-cat",
	repoName: "ruan-cat/monorepo",
	rootDirectory: "packages/demo",
	buildCommand: "pnpm build",
	buildUuid: "build-uuid-001",
	accountId: "account-001",
	eventTimestamp: "2026-10-18T10:05:00Z",
};

describe("checkEmailConfig", () => {
	test("配置齐备返回 null", () => {
		const env: NotifierEnv = {
			EMAIL: { send: async () => undefined },
			NOTIFY_EMAIL_TO: "me@example.com",
		};
		expect(checkEmailConfig(env)).toBeNull();
	});

	test("env 缺失返回错误", () => {
		expect(checkEmailConfig(undefined)).not.toBeNull();
		expect(checkEmailConfig(null)).not.toBeNull();
	});

	test("缺少 EMAIL binding 返回错误", () => {
		const env = { NOTIFY_EMAIL_TO: "me@example.com" } as unknown as NotifierEnv;
		expect(checkEmailConfig(env)).toContain("EMAIL");
	});

	test("缺少 NOTIFY_EMAIL_TO 返回错误", () => {
		const env = { EMAIL: { send: async () => undefined } } as unknown as NotifierEnv;
		expect(checkEmailConfig(env)).toContain("NOTIFY_EMAIL_TO");
	});
});

describe("buildEmailContent", () => {
	test("失败通知主题包含 worker 名与分支", () => {
		const content = buildEmailContent(summary, "");
		expect(content.subject).toContain("demo-worker");
		expect(content.subject).toContain("构建失败");
		expect(content.subject).toContain("dev");
	});

	test("取消通知使用取消图标与文案", () => {
		const content = buildEmailContent({ ...summary, statusLabel: "构建取消" }, "");
		expect(content.subject).toContain("⚪");
		expect(content.subject).toContain("构建取消");
	});

	test("正文包含关键元数据字段", () => {
		const content = buildEmailContent(summary, "");
		expect(content.text).toContain("demo-worker");
		expect(content.text).toContain("abc1234");
		expect(content.text).toContain("build-uuid-001");
		expect(content.text).toContain("account-001");
	});

	test("有日志尾部时正文包含日志段落", () => {
		const content = buildEmailContent(summary, "line-1\nline-2");
		expect(content.text).toContain("构建日志（尾部）");
		expect(content.text).toContain("line-1");
	});

	test("无日志时正文包含降级说明而非空白", () => {
		const content = buildEmailContent(summary, "");
		expect(content.text).toContain("CF_BUILDS_API_TOKEN");
	});
});

describe("DEFAULT_FROM_ADDRESS", () => {
	test("默认发件地址位于 ruan-cat.com 域", () => {
		expect(DEFAULT_FROM_ADDRESS).toBe("builds@ruan-cat.com");
	});
});

describe("FROM_DISPLAY_NAME", () => {
	test("显示名为 cloudflare-build-error", () => {
		expect(FROM_DISPLAY_NAME).toBe("cloudflare-build-error");
	});
});

describe("buildMimeMessage", () => {
	test("From 头携带 cloudflare-build-error 显示名与裸地址", () => {
		const content = buildEmailContent(summary, "");
		const raw = buildMimeMessage("builds@ruan-cat.com", "1219043956@qq.com", content);
		expect(raw).toContain("From: cloudflare-build-error <builds@ruan-cat.com>");
		expect(raw).toContain("builds@ruan-cat.com");
		expect(raw).toContain("1219043956@qq.com");
	});

	test("中文主题被 RFC 2047 编码而非裸 UTF-8 注入", () => {
		const content = buildEmailContent(summary, "");
		const raw = buildMimeMessage("builds@ruan-cat.com", "1219043956@qq.com", content);
		expect(raw).toMatch(/Subject:\s*=\?UTF-8\?/i);
	});

	test("纯文本正文 base64 解码后包含关键元数据", () => {
		const content = buildEmailContent(summary, "line-1");
		const raw = buildMimeMessage("builds@ruan-cat.com", "1219043956@qq.com", content);
		expect(raw).toContain("Content-Type: text/plain; charset=utf-8");
		expect(raw).toContain("Content-Transfer-Encoding: base64");
		const body = raw.split("\r\n\r\n")[1] ?? "";
		const decoded = Buffer.from(body, "base64").toString("utf8");
		expect(decoded).toContain("demo-worker");
		expect(decoded).toContain("build-uuid-001");
		expect(decoded).toContain("line-1");
	});
});
