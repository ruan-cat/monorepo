import { defineNitroConfig } from "nitro/config";

/**
 * Cloudflare Workers Builds 失败通知 Worker 配置。
 *
 * - preset 内置于配置（build 命令无需 --preset 传参）
 * - 部署配置（name/vars/send_email/queues/observability）的单一事实源是
 *   包根 wrangler.toml，nitro 构建时读取并合并进 .output/server/wrangler.json，
 *   并生成 .wrangler/deploy/config.json 重定向，wrangler deploy 自动跟随
 *
 * @see https://nitro.build/deploy/providers/cloudflare
 */
export default defineNitroConfig({
	preset: "cloudflare_module",
	compatibilityDate: {
		cloudflare: "2024-09-19",
	},
	serverDir: "server",
	imports: false,
	cloudflare: {
		deployConfig: true,
		nodeCompat: true,
		wrangler: {
			// Worker 名称，与 Cloudflare 账号下部署名一致；其余部署配置见 wrangler.toml
			name: "cf-build-notifier",
		},
	},
});
