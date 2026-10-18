/**
 * Cloudflare Workers Builds 事件、Worker 运行时 Env 与邮件内容的类型定义。
 *
 * 事件结构以官方 Event Subscriptions 文档与官方通知模板
 * （cloudflare/templates/workers-builds-notifications-template）为基准。
 *
 * @see https://developers.cloudflare.com/workers/ci-cd/builds/event-subscriptions/
 */

// =============================================================================
// Workers Builds 事件
// =============================================================================

export interface BuildTriggerMetadata {
	buildTriggerSource: string;
	branch: string;
	commitHash: string;
	commitMessage: string;
	author: string;
	buildCommand: string;
	deployCommand: string;
	rootDirectory: string;
	repoName: string;
	providerAccountName: string;
	providerType: string;
}

export interface CloudflareBuildEvent {
	/** 事件类型，如 cf.workersBuilds.worker.build.failed */
	type: string;
	source: {
		type: string;
		workerName?: string;
	};
	payload: {
		buildUuid: string;
		status: string;
		buildOutcome: "success" | "failure" | "canceled" | "cancelled" | null;
		createdAt: string;
		initializingAt?: string;
		runningAt?: string;
		stoppedAt?: string;
		buildTriggerMetadata?: BuildTriggerMetadata;
	};
	metadata: {
		accountId: string;
		eventSubscriptionId: string;
		eventSchemaVersion: number;
		eventTimestamp: string;
	};
}

// =============================================================================
// 构建日志 API 响应
// =============================================================================

export interface BuildLogsResponse {
	success?: boolean;
	result?: {
		/** 每行为 [行号, 日志内容] */
		lines?: [number, string][];
		truncated?: boolean;
		cursor?: string;
	};
}

// =============================================================================
// Worker 运行时 Env（wrangler secret / vars + send_email binding）
// =============================================================================

/** Cloudflare Email Service 结构化发送 payload */
export interface EmailPayload {
	to: string | string[];
	from: string;
	subject: string;
	text?: string;
	html?: string;
}

/** send_email binding 的结构化发送接口 */
export interface SendEmailBinding {
	send(payload: EmailPayload): Promise<unknown>;
}

export interface NotifierEnv {
	/** send_email binding（wrangler 配置中的 name: "EMAIL"） */
	EMAIL: SendEmailBinding;
	/** 通知收件邮箱（wrangler secret / var） */
	NOTIFY_EMAIL_TO: string;
	/** 发件地址，默认 builds@ruan-cat.com（需完成 Email Service 域名 onboard） */
	NOTIFY_EMAIL_FROM?: string;
	/** Workers Builds API token，用于拉取失败构建日志（wrangler secret） */
	CF_BUILDS_API_TOKEN?: string;
}

// =============================================================================
// 摘要与邮件内容
// =============================================================================

export type BuildStatusLabel = "构建失败" | "构建取消";

export interface BuildEventSummary {
	workerName: string;
	statusLabel: BuildStatusLabel;
	branch: string;
	commitHash: string;
	commitMessage: string;
	author: string;
	repoName: string;
	rootDirectory: string;
	buildCommand: string;
	buildUuid: string;
	accountId: string;
	eventTimestamp: string;
}

export interface EmailContent {
	subject: string;
	text: string;
}
