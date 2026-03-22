/**
 * shadcn-docs-nuxt 完整 Tailwind 配置
 *
 * ⚠️ 硬性要求：content 扫描必须覆盖 node_modules/shadcn-docs-nuxt，
 * 否则模板内部使用的 Tailwind 类会被 tree-shake 掉，导致：
 * - 主题类缺失
 * - 暗黑样式异常
 * - 布局细节错乱（最常见的"布局变窄"问题）
 */
// content 路径说明（glob 与下方 content 数组一致；此处用行注释，避免块注释内出现 **/ 被解析为结束符）：
// - ./content/**/* → 扫描 MDC markdown 中的 Tailwind 类
// - ./app/**/*.vue → 扫描 app 目录下的 Vue 组件
// - ./components/**/*.vue → 扫描自定义内容组件
// - ../../node_modules/shadcn-docs-nuxt/**/*.{vue,js,ts,mjs} → 关键：扫描模板内部组件
//
// content 路径前缀 ../../ 的说明：
// - pnpm workspace 中，文档站包通常位于 packages/xxx/
// - node_modules 在 monorepo 根目录
// - 因此相对路径是 ../../node_modules/...
// - 如果文档站在根目录，应改为 ./node_modules/...
// - 检查方法：从文档站 tailwind.config.js 所在目录，ls 看能否找到 shadcn-docs-nuxt
import animate from "tailwindcss-animate";

export default {
	darkMode: "class",
	safelist: ["dark"],
	prefix: "",
	content: [
		"./content/**/*",
		"./app/**/*.vue",
		"./components/**/*.vue",
		// ⚠️ 关键：必须扫描 shadcn-docs-nuxt 模板内部的组件
		// pnpm workspace 下，路径前缀取决于当前包到 node_modules 的相对关系
		"../../node_modules/shadcn-docs-nuxt/**/*.{vue,js,ts,mjs}",
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			/**
			 * shadcn-vue 主题色系统
			 * 所有颜色使用 HSL CSS 变量，变量值格式为纯数值（不含 hsl() 函数）。
			 * 正确格式: --primary: 221.2 83.2% 53.3%;
			 * 错误格式: --primary: hsl(221.2, 83.2%, 53.3%);
			 * 变量定义在 assets/css/tailwind.css 中。
			 */
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			borderRadius: {
				xl: "calc(var(--radius) + 4px)",
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"collapsible-down": {
					from: { height: "0" },
					to: { height: "var(--radix-collapsible-content-height)" },
				},
				"collapsible-up": {
					from: { height: "var(--radix-collapsible-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"collapsible-down": "collapsible-down 0.2s ease-in-out",
				"collapsible-up": "collapsible-up 0.2s ease-in-out",
			},
		},
	},
	plugins: [animate],
};
