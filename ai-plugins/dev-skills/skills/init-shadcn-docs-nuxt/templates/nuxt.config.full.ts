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
 * 让文档站直接消费 workspace 内组件库的源码，而非构建产物。
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

export default defineNuxtConfig({
	// ═══════════════════════════════════════════════════════════════════
	// 基础配置
	// ═══════════════════════════════════════════════════════════════════
	extends: ["shadcn-docs-nuxt"],
	compatibilityDate: "2025-05-13",
	devtools: { enabled: true },

	/**
	 * workspace 组件库源码别名
	 * 让文档站直接消费源码而非构建产物，这样：
	 * 1. 组件库无需先构建
	 * 2. 修改组件库源码后文档站自动热更新
	 */
	alias: getYourLibAliases(),

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
	// OG Image - 必须关闭
	//
	// 直接启用 ogImage 模块会触发：
	//   vue.runtime.mjs does not provide an export named toValue → 500 错误
	// 如果页面层有 defineOgImageComponent() 调用，
	// 通过覆盖页面文件（pages/[...slug].vue）移除该调用，
	// 而不是启用此模块。
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
	// Windows + pnpm workspace 环境下的特殊处理。
	// 详见 references/windows.md
	// ═══════════════════════════════════════════════════════════════════
	nitro: {
		externals: {
			/**
			 * Windows + pnpm workspace 下 nodeFileTrace（@vercel/nft）
			 * 会长期占用高 CPU/内存，导致 nuxt build 卡在
			 * "Building Nuxt Nitro server" 阶段不动。
			 *
			 * 这不是"卡死"，是 trace 在递归扫描 pnpm 的硬链 / .pnpm store，
			 * 扫描范围爆炸性增长，做不完。
			 *
			 * 关闭 trace 后，单进程 `nuxi build --logLevel=verbose`
			 * 可正常生成 .output/server/index.mjs 并打印 Build complete!
			 */
			trace: false,
		},
		prerender: {
			/**
			 * node-server 产物不依赖构建期全站静态化。
			 * 预渲染会拉起额外的 nitro-prerender 进程并加载完整 SSR 包，
			 * 在默认 Node 堆限制（约 4GB）下容易 OOM。
			 * 若需要纯静态托管，可改用 nuxi generate 或在有足够内存的环境执行。
			 */
			crawlLinks: false,
		},
		hooks: {
			"prerender:routes"(routes: Set<string>) {
				routes.clear();
			},
		},
	},
});
