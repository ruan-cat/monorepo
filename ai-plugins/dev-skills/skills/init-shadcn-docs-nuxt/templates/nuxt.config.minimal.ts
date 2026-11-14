/**
 * shadcn-docs-nuxt 最小启动骨架
 *
 * 先用这个启动 `nuxt dev`，能跑起来再按需补配置。
 * 不要一开始就堆满兼容配置。
 *
 * Nuxt 4 路径见 references/nuxt4-upgrade.md §1–§7（buildDir/oxide/inline/compatDate 字符串等）；本模板为 Nuxt 3 基线。
 *
 * 注意事项：
 * - ogImage 必须关闭，直接启用会触发
 *   `vue.runtime.mjs does not provide an export named toValue` 的 500 错误。
 *   如果有页面层调用 defineOgImageComponent()，通过覆盖页面文件移除该调用，
 *   而不是启用模块。
 * - experimental.appManifest = false 在某些环境下可避免 app-manifest 不稳定，按需保留。
 * - icon.clientBundle.scan = true 开启客户端图标自动扫描。
 */
export default defineNuxtConfig({
	extends: ["shadcn-docs-nuxt"],
	compatibilityDate: {
		// https://v3.nitro.build/deploy/providers/cloudflare
		cloudflare: "2024-09-19",
		// https://nitro.build/deploy/providers/vercel#observability
		vercel: "2024-09-19",
	},

	ogImage: { enabled: false },

	experimental: {
		appManifest: false,
	},

	icon: {
		clientBundle: { scan: true },
	},
});
