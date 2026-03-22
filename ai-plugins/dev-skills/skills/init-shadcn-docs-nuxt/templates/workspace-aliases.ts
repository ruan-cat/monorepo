/**
 * workspace 组件库别名函数
 *
 * 让文档站直接消费 workspace 内组件库的源码，而非构建产物。
 *
 * 为什么需要：
 * 1. 组件库可能尚未构建（全新克隆、CI 中文档先于组件库构建）
 * 2. 开发时修改组件库源码后文档站自动热更新
 * 3. 构建产物的入口路径与源码不同，需要 alias 映射
 *
 * ⚠️ 关键注意点：
 * - styles 别名必须在主入口别名之前声明！
 *   Nuxt/Vite alias 匹配是前缀匹配，
 *   @scope/lib/styles 必须先于 @scope/lib，
 *   否则 /styles 路径会被主入口吃掉。
 * - 使用 resolve(__dirname, ...) 而非相对字符串，确保在任何 cwd 下都能正确解析。
 * - 指向源码入口（.ts / .scss）而非构建产物，这样文档站不依赖组件库先构建。
 *
 * 使用方式：
 * 1. 将本文件复制到文档站根目录
 * 2. 将函数名和路径替换为你的组件库信息
 * 3. 在 nuxt.config.ts 中：
 *    import { getYourLibAliases } from "./workspace-aliases";
 *    export default defineNuxtConfig({
 *      alias: getYourLibAliases(),
 *    });
 */
import { resolve } from "node:path";

export function getYourLibAliases() {
	return {
		// ⚠️ styles 别名必须在主入口别名之前（前缀匹配规则）
		"@your-scope/ui-lib/styles": resolve(__dirname, "../ui-lib/src/styles/index.scss"),
		"@your-scope/ui-lib": resolve(__dirname, "../ui-lib/src/index.ts"),
	};
}

/**
 * 实战示例（vue-element-cui 组件库）：
 *
 * export function getVueElementCuiAliases() {
 *   return {
 *     "@eams-monorepo/vue-element-cui/styles": resolve(
 *       __dirname,
 *       "../vue-element-cui/src/styles/index.scss"
 *     ),
 *     "@eams-monorepo/vue-element-cui": resolve(
 *       __dirname,
 *       "../vue-element-cui/src/index.ts"
 *     ),
 *   };
 * }
 */
