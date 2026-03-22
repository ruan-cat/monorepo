/**
 * debug 包的 ESM 兼容 shim
 *
 * 背景：
 * shadcn-docs-nuxt 依赖链中 `debug` 包的默认导出在 ESM 与 CJS 间不一致。
 * 浏览器端 import debug from 'debug' 会因为入口不兼容而报错，
 * 并打断整个 hydration 流程（表现为暗黑模式失效、侧边栏无法折叠等）。
 *
 * 设计要点：
 * 1. 同时提供 default export 和 named exports，兼容所有导入方式：
 *    - import debug from 'debug'       → 走 default export
 *    - const debug = require('debug')  → 走 debugFactory.default
 *    - import { enable } from 'debug'  → 走 named export
 * 2. debugFactory.default = debugFactory 确保 CJS require 也能正确工作
 * 3. 所有方法都是 no-op 实现，因为文档站不需要实际的 debug 输出
 * 4. 必须导出 debug 原始 API 的所有 named export（coerce、disable、enable 等），
 *    否则依赖链中使用 import { enable } from 'debug' 的代码会报错
 *
 * 在 nuxt.config.ts 中的配置：
 * - vite.resolve.alias: { find: /^debug$/, replacement: require.resolve("./shims/debug.ts") }
 * - vite.ssr.noExternal: ["debug"]  ← 防止 SSR 端被 external 化后走错入口
 * - vite.optimizeDeps.include: ["debug"]  ← 强制 Vite 预优化
 */
function createDebug(namespace) {
	const logger = () => {};

	logger.namespace = namespace;
	logger.enabled = false;
	logger.extend = (suffix) => createDebug(`${namespace}:${suffix}`);
	logger.destroy = () => {};

	return logger;
}

const debugFactory = createDebug;

debugFactory.debug = debugFactory;
debugFactory.default = debugFactory;
debugFactory.coerce = (value) => value;
debugFactory.disable = () => "";
debugFactory.enable = () => {};
debugFactory.enabled = () => false;
debugFactory.humanize = (value) => String(value);
debugFactory.destroy = () => {};
debugFactory.formatters = {};
debugFactory.names = [];
debugFactory.skips = [];
debugFactory.selectColor = () => 0;

export const debug = debugFactory;
export const coerce = debugFactory.coerce;
export const disable = debugFactory.disable;
export const enable = debugFactory.enable;
export const enabled = debugFactory.enabled;
export const humanize = debugFactory.humanize;
export const destroy = debugFactory.destroy;
export const formatters = debugFactory.formatters;
export const names = debugFactory.names;
export const skips = debugFactory.skips;
export const selectColor = debugFactory.selectColor;

export default debugFactory;
