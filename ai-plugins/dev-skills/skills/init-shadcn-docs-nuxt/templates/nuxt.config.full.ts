/**
 * shadcn-docs-nuxt 生产级完整配置
 *
 * 此文件是经过实战验证的完整 nuxt.config.ts。
 * 每段配置均有注释说明来源和目的，请勿删除注释。
 *
 * 使用方式：
 * 1. 复制本文件到文档站根目录，重命名为 nuxt.config.ts
 * 2. 替换 workspace-aliases 导入为你自己的别名函数
 * 3. 按需删减不需要的段落（但保留注释以备后续排错）
 */
import { createRequire } from "node:module";

/**
 * workspace 组件库别名函数
 * 只在显式开启的开发期让文档站直接消费 workspace 内组件库源码。
 * production 必须从部署文档包 manifest 声明的包入口解析。
 * 详见 templates/workspace-aliases.ts
 */
import { getYourLibAliases } from "./workspace-aliases";

/**
 * createRequire 用于从 node_modules 中精确解析 ESM 入口。
 *
 * 为什么不直接写路径字符串？
 * - pnpm workspace 下 node_modules 结构不可预测（hoist / shamefully-hoist / .pnpm store）
 * - require.resolve 会沿 Node 模块解析算法找到正确的物理路径
 * - 避免了跨平台路径分隔符问题
 *
 * 详见 templates/shims/debug.ts 了解 debug shim 的设计
 */
const require = createRequire(import.meta.url);
const dayjsEsmEntry = require.resolve("dayjs/esm/index.js");
const mermaidEsmEntry = require.resolve("mermaid/dist/mermaid.esm.mjs");
const debugShimEntry = require.resolve("./shims/debug.ts");

/**
 * workspace 源码仅用于本地开发的显式 opt-in。
 * production 保持空 alias，避免源码路径扩大到部署构建图。
 */
const useWorkspaceSourceAliases =
	process.env.NODE_ENV === "development" && process.env.SHADCN_DOCS_USE_WORKSPACE_SOURCE === "1";
const workspaceAliases = useWorkspaceSourceAliases ? getYourLibAliases() : {};

export default defineNuxtConfig({
	// ═══════════════════════════════════════════════════════════════════
	// 基础配置
	// ═══════════════════════════════════════════════════════════════════
	extends: ["shadcn-docs-nuxt"],
	compatibilityDate: {
		// https://v3.nitro.build/deploy/providers/cloudflare
		cloudflare: "2024-09-19",
		// https://nitro.build/deploy/providers/vercel#observability
		vercel: "2024-09-19",
	},
	devtools: { enabled: true },

	/**
	 * workspace 组件库源码别名只允许在本地开发显式开启。
	 * production 必须消费部署文档包 manifest 已声明的包入口，
	 * 不得把源码 alias、依赖族 noExternal 或 inline 清单作为通用替代。
	 */
	alias: workspaceAliases,

	experimental: {
		appManifest: false,
	},

	// ═══════════════════════════════════════════════════════════════════
	// build.transpile
	// ═══════════════════════════════════════════════════════════════════
	build: {
		/**
		 * 警告：不需要配置 "shiki"
		 * 因为最简单的 shadcn-docs-nuxt-starter 本身也没有配置 "shiki"，
		 * 加了反而可能引起问题。
		 *
		 * ohash 是 Nuxt 内部依赖，在某些 pnpm 严格模式下需要 transpile。
		 */
		transpile: ["ohash"],
	},

	// ═══════════════════════════════════════════════════════════════════
	// Vite - ESM/CJS 兼容层（核心排错区域）
	//
	// shadcn-docs-nuxt 依赖链中的多个包在浏览器端存在 ESM/CJS 入口冲突。
	// 当 Vite 选择了错误的入口时，浏览器会报模块导入错误，
	// 并且打断整个 hydration 流程。
	//
	// 表现为：暗黑模式切换失效、侧边栏折叠无效等"看起来是样式问题"的 UI 故障。
	// 实际根因是 JS 执行中断。
	//
	// 排查顺序：先看 console 模块错误 → 修依赖入口 → 最后才查样式。
	// ═══════════════════════════════════════════════════════════════════
	vite: {
		optimizeDeps: {
			/**
			 * 这 4 个包在浏览器端有 ESM/CJS 入口冲突，必须显式 include。
			 * 不 include 的后果：Vite 跳过预优化，浏览器直接加载 CJS 入口报错。
			 */
			include: ["debug", "dayjs", "@braintree/sanitize-url", "mermaid"],
			esbuildOptions: {
				target: "esnext",
			},
		},
		resolve: {
			/**
			 * alias 使用数组格式（而非对象格式），因为 find 是正则表达式，需要精确匹配。
			 *
			 * dayjs: 默认入口是 CJS dayjs.min.js，浏览器端会报
			 *        "does not provide an export named 'default'"
			 *
			 * mermaid: 默认入口是 CJS，需要指向 ESM 发行版
			 *
			 * debug: 包的默认导出在 ESM 与 CJS 间不一致，用本地 shim 替代
			 *        shim 源码见 templates/shims/debug.ts
			 */
			alias: [
				{ find: /^dayjs$/, replacement: dayjsEsmEntry },
				{ find: /^mermaid$/, replacement: mermaidEsmEntry },
				{ find: /^debug$/, replacement: debugShimEntry },
			],
			/**
			 * 防止 dayjs 被多个版本同时加载。
			 * pnpm hoist 环境下常见：不同子包解析到不同版本的 dayjs。
			 */
			dedupe: ["dayjs"],
		},
		ssr: {
			/**
			 * debug 在 SSR 端也需要特殊处理。
			 * 如果被 external 化（默认行为），SSR 端会走 Node 的 CJS require，
			 * 但我们的 shim 是 ESM 格式，导致入口不匹配。
			 *
			 * 这是仅针对 debug exact error 的窄兼容例外；
			 * 不得扩展为依赖族 noExternal 或 nitro.externals.inline 清单。
			 */
			noExternal: ["debug"],
		},
	},

	// ═══════════════════════════════════════════════════════════════════
	// Nuxt Content - 代码高亮
	// ═══════════════════════════════════════════════════════════════════
	content: {
		highlight: {
			theme: {
				default: "github-light",
				dark: "houston",
			},
			preload: ["vue", "typescript", "javascript", "bash"],
		},
	},

	// ═══════════════════════════════════════════════════════════════════
	// i18n - 单语最小配置
	//
	// shadcn-docs-nuxt 继承层的 i18n 策略要求 defaultLocale。
	// 不配置会产生 warning；单语站只需这一段。
	// 不要做多语言改造，复杂度很高且容易引发 SSR 端
	// registerMessageResolver 报错（intlify 多版本冲突）。
	// ═══════════════════════════════════════════════════════════════════
	i18n: {
		defaultLocale: "zh-CN",
		locales: [
			{
				code: "zh-CN",
				name: "简体中文",
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════
	// OG Image - 先固定 Nuxt 3 兼容版本，再决定是否启用
	//
	// shadcn-docs-nuxt@1.1.9 会传递安装 nuxt-og-image。
	// nuxt-og-image@5.1.10+ 的 @nuxt/kit 依赖线面向 Nuxt 4，
	// 可能把 H3 v2 裸 import 带入 Nuxt 3/Nitro 2.13，
	// 触发 Invalid URL 或 sendError 导出缺失。
	// Nuxt 3 文档站必须在根 package.json 固定 nuxt-og-image@5.1.9。
	// 依赖未固定时直接启用仍可能触发：
	//   vue.runtime.mjs does not provide an export named toValue → 500 错误
	// 如果页面层有 defineOgImageComponent() 调用，
	// 先完成依赖矩阵和 fresh build，再通过覆盖页面文件移除该调用。
	// ═══════════════════════════════════════════════════════════════════
	ogImage: {
		enabled: false,
	},

	// ═══════════════════════════════════════════════════════════════════
	// Nuxt Icon
	//
	// 默认会扫描本地安装的全部 iconify 集合（可达上百个），
	// Nitro 打包阶段极易 OOM。
	// 必须通过 serverBundle.collections 限制只打包实际使用的集合。
	// shadcn-docs-nuxt 内部大量使用 lucide 图标集。
	// 必须安装 @iconify-json/lucide（devDependencies），否则会有集合缺失提示。
	// ═══════════════════════════════════════════════════════════════════
	icon: {
		serverBundle: {
			collections: ["lucide"],
		},
		clientBundle: {
			scan: true,
			sizeLimitKb: 512,
		},
	},

	// ═══════════════════════════════════════════════════════════════════
	// Nitro - 构建与预渲染
	//
	// 生产基线默认保留 Nitro/NFT trace，不配置 nitro.externals。
	// Windows + pnpm workspace 的 trace 长尾只能按需使用
	// references/windows.md 中的本地、可回滚 workaround；不要把它带入 Vercel/CI。
	// ═══════════════════════════════════════════════════════════════════
	nitro: {
		prerender: {
			/**
			 * node-server 产物不依赖构建期全站静态化。
			 * 预渲染会拉起额外的 nitro-prerender 进程并加载完整 SSR 包，
			 * 在默认 Node 堆限制（约 4GB）下容易 OOM。
			 *
			 * 但 shadcn-docs-nuxt 的 document-driven Content 依赖 prerender
			 * 解析 Markdown 并生成结构化索引，因此默认必须保留预渲染。
			 * 若项目确认不使用 Content document-driven 数据，才可另行评估
			 * `crawlLinks: false` 或旧的 `prerender:routes` workaround。
			 */
			crawlLinks: true,
		},
		/*
		 * 历史 workaround（不要在 document-driven Content 项目中默认启用）：
		 *
		 * hooks: {
		 *   "prerender:routes"(routes: Set<string>) {
		 *     routes.clear();
		 *   },
		 * },
		 *
		 * 它曾用于绕过 Windows 构建长尾，但会让 Content 运行时数据库为空。
		 */
	},
});
