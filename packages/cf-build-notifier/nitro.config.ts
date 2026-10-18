import { defineConfig } from "nitro";

/**
 * Cloudflare Workers Builds 失败通知 Worker 配置。
 *
 * - preset 由 build 命令指定：`nitro build --preset=cloudflare_module`
 * - `cloudflare.deployConfig: true` 时 Nitro 在构建时自动生成 `.output/wrangler.json`
 * - `cloudflare.wrangler` 与 wrangler.json 同类型，queues.consumers 与 send_email
 *   binding 在此注入，随构建产物一并生成
 *
 * @see https://nitro.build/deploy/providers/cloudflare
 */
export default defineConfig({
	compatibilityDate: {
		cloudflare: "2024-09-19",
	},
	serverDir: "server",
	imports: false,
	cloudflare: {
		deployConfig: true,
		nodeCompat: true,
		wrangler: {
			// Worker 名称，与 Cloudflare 账号下部署名一致
			name: "cf-build-notifier",
			// 消费 Workers Builds 事件订阅投递的队列
			queues: {
				consumers: [
					{
						queue: "builds-event-subscriptions",
					},
				],
			},
			// Cloudflare Email Service 结构化发送 binding
			send_email: [
				{
					name: "EMAIL",
				},
			],
		},
	},
});
