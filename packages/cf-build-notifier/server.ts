import { defineHandler } from "nitro";

/**
 * HTTP 健康检查入口。
 *
 * 本 Worker 的核心职责是消费 Cloudflare Queue 事件（见 server/plugins/queue-handler.ts），
 * HTTP 侧仅提供存活探针，供部署验证与人工巡检使用。
 */
export default defineHandler(() => ({
	status: "ok",
	service: "cf-build-notifier",
}));
