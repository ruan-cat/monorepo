import { defineNitroConfig } from "nitro/config";
import pkg from "./package.json" with { type: "json" };

export default defineNitroConfig({
	preset: "cloudflare_module",
	compatibilityDate: {
		// https://v3.nitro.build/deploy/providers/cloudflare
		cloudflare: "2024-09-19",
		// https://nitro.build/deploy/providers/vercel#observability
		vercel: "2024-09-19",
	},

	experimental: {
		openAPI: true,
	},

	openAPI: {
		meta: {
			title: "skill-router-mcp Cloudflare Worker API",
			description: "面向 ChatGPT Web Developer Mode 的只读 Skill Router MCP Cloudflare Worker 接口文档",
			version: pkg.version,
		},
		production: "prerender",
		route: "/openapi.json",
		ui: {
			scalar: {
				route: "/scalar",
			},
		},
	},

	/**
	 * 配置 cloudflare worker 部署
	 * @see https://nitro.build/deploy/providers/cloudflare#cloudflare-workers
	 */
	cloudflare: {
		deployConfig: true,
		nodeCompat: true,
		wrangler: {
			// 设置 worker 名称
			name: "skill-router-mcp",
		},
	},

	serverDir: "./server",
	apiBaseURL: "/",
});
