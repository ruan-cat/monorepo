/**
 * workspace 组件库 Nuxt Plugin 注册模板
 *
 * Nuxt 会自动扫描 plugins/ 目录，不需要在 nuxt.config.ts 中手动注册。
 *
 * 样式导入顺序很重要：
 * 1. 先导入底层库样式（如 Element Plus CSS）
 * 2. 再导入上层库样式（你的组件库样式）
 * 这样上层样式可以正确覆盖底层库的默认值。
 *
 * 使用方式：
 * 1. 复制本文件到文档站的 plugins/ 目录
 * 2. 重命名为你的组件库名（如 vue-element-cui.ts）
 * 3. 替换导入路径和组件库名称
 *
 * 注意：
 * - 如果组件库依赖 Element Plus 等 UI 框架，两者都需要在 plugin 中注册
 * - 别名路径（如 @your-scope/ui-lib）由 workspace-aliases.ts 解析到源码
 */
import YourLib from "@your-scope/ui-lib";
import "@your-scope/ui-lib/styles";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.use(ElementPlus);
	nuxtApp.vueApp.use(YourLib);
});

/**
 * 实战示例（vue-element-cui 组件库）：
 *
 * import VueElementCui from "@eams-monorepo/vue-element-cui";
 * import "@eams-monorepo/vue-element-cui/styles";
 * import ElementPlus from "element-plus";
 * import "element-plus/dist/index.css";
 *
 * export default defineNuxtPlugin((nuxtApp) => {
 *   nuxtApp.vueApp.use(ElementPlus);
 *   nuxtApp.vueApp.use(VueElementCui);
 * });
 */
