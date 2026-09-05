# nuxt.config.ts 完整参考

## 模板文件

| 模板                                                                      | 说明                                        |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| [`templates/nuxt.config.minimal.ts`](../templates/nuxt.config.minimal.ts) | 最小启动骨架 — 什么都不加时的最小可运行配置 |
| [`templates/nuxt.config.full.ts`](../templates/nuxt.config.full.ts)       | 生产级完整配置 — 经过实战验证，每段均有注释 |
| [`templates/app.config.ts`](../templates/app.config.ts)                   | 站点元信息与 UI 配置骨架                    |

> **使用时请直接阅读模板文件中的注释**，注释包含了完整的"为什么这么配"和"不这么配会怎样"。

---

## 按需补丁策略

**不要一开始就堆满配置。** 遵循以下渐进策略：

### 阶段 1：最小骨架启动

使用 [`templates/nuxt.config.minimal.ts`](../templates/nuxt.config.minimal.ts)，只保留 `extends` + `ogImage` + `icon.clientBundle`，尝试 `nuxt dev`；Nuxt 3 项目先在根 `package.json` 通过 `pnpm.overrides` 固定 `nuxt-og-image: 5.1.9`。

### OG Image 版本门禁

`shadcn-docs-nuxt@1.1.9` 会传递安装 `nuxt-og-image`。`5.1.10+` 的 `@nuxt/kit` 依赖线面向 Nuxt 4，可能把 H3 v2 引入 Nuxt 3/Nitro 2.13，表现为 `Invalid URL` 或 `sendError` 导出缺失。固定 `h3: 1.15.11` 不能替代该覆盖；必须同时执行 `pnpm why nuxt-og-image @nuxt/kit h3`。

### 阶段 2：遇到客户端报错

浏览器 console 出现模块导入错误时，按以下顺序逐项补丁：

| 报错信号                                                          | 补丁配置                                                                                                                       | 参考模板                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `dayjs... does not provide an export named default`               | `vite.resolve.alias` 指向 `dayjs/esm/index.js` + `dedupe: ["dayjs"]`                                                           | [`nuxt.config.full.ts`](../templates/nuxt.config.full.ts) Vite 段 |
| `mermaid` 相关模块导入异常                                        | `vite.resolve.alias` 指向 `mermaid/dist/mermaid.esm.mjs`                                                                       | 同上                                                              |
| `debug` 默认导出不兼容                                            | `vite.resolve.alias` 指向 `./shims/debug.ts` + `ssr.noExternal: ["debug"]`                                                     | 同上 + [`shims/debug.ts`](../templates/shims/debug.ts)            |
| `@braintree/sanitize-url` 链式报错                                | 补 `optimizeDeps.include`                                                                                                      | 同上                                                              |
| 整站不水合、交互全死、`#__nuxt.__vue_app__` 不存在且 console 无错 | `vite.optimizeDeps.include` 显式纳入 `.client` 插件导入的包与其动态导入（嵌套 `>` 语法），整包 include 优于逐个补 CJS 传递依赖 | [`dependency-triage.md`](dependency-triage.md) §4                 |
| `Failed to resolve dependency: "A > B"`（fork 包）                | 不改 nuxt.config；用 `pnpm patch` 修正 fork dist 内硬编码的旧包名前缀                                                          | [`dependency-triage.md`](dependency-triage.md) §5                 |
| i18n defaultLocale warning                                        | 补 `i18n.defaultLocale` + `i18n.locales` 单语配置                                                                              | 同上 i18n 段                                                      |
| `defineOgImageComponent is not defined`                           | 先确认 `nuxt-og-image: 5.1.9` 已固定，再覆盖页面文件移除调用；不要用关闭 Content prerender 规避                                | —                                                                 |
| Icon 集合缺失提示                                                 | 安装 `@iconify-json/lucide` + 配置 `icon.serverBundle.collections`                                                             | 同上 icon 段                                                      |

### `debug` 的窄兼容例外

`vite.resolve.alias` 的本地 debug shim 与 `vite.ssr.noExternal: ["debug"]` 只在 Vite SSR transform 已复现 debug 的 exact error 时使用。它不是 workspace 依赖族的默认配置，不得扩展为宽 `noExternal` 清单或 `nitro.externals.inline`；错误不再复现或入口可解析时，删除该窄例外。

### `app.config.ts` 与 UI 资源（logo / IPX）

主题默认 `header.logo: { light: "/logo.svg", dark: "/logo-dark.svg" }`，但 shadcn-docs-nuxt 包**不附带**这两个源文件——经 NuxtImg/IPX 处理时产生 404。处置纪律：

1. **logo 必须指向 `public/` 下真实存在的资源**（如 `/favicon.svg`，明暗可共用），不要伪造不存在的 `/logo.svg`。
2. **不要用置空 logo 来"禁用"它**：主题 `Logo.vue` 的标题文本嵌在 logo 的 `v-if="logo.light && logo.dark"` 分支内部，置空会连带丢失站点标题。源码分支推断不可靠，UI 配置修改必须过桌面视口浏览器验收（logo 容器是 `hidden md:flex`，窄视口下本就不渲染）。详见 [`ssr-hydration.md`](ssr-hydration.md)。

### build 与 dev 的 `.nuxt` 共享冲突

`pnpm build` 与 dev server **不能并行**：二者共享 `.nuxt`，build 的 `nuxt prepare` 清写该目录会污染 dev 正在使用的 server 产物，症状为 dev 全站瞬时 500（`#internal/nuxt/paths is not defined`、`mdc-highlighter.mjs ENOENT`）。执行顺序铁律：**跑 build 前先停 dev**；已污染时按 停 dev → 清 `.nuxt` → 重启 恢复。

### 阶段 3：构建优化

仅在构建阶段出问题时添加：

| 问题                                          | 补丁                                                                                                                                        | 参考                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Nitro 卡住                                    | 先诊断残留进程/资源；确认 Windows NFT trace 后再条件化 `trace: false` 或精准 inline                                                         | [`templates/nuxt.config.full.ts`](../templates/nuxt.config.full.ts) nitro 段 + [`windows.md`](windows.md) |
| 预渲染 OOM                                    | Windows 临时提高堆并保留 Content prerender；非 Content 的纯 node-server 才可另行评估关闭                                                    | [`references/incident-repair.md`](incident-repair.md)                                                     |
| ohash transpile 报错                          | `build.transpile: ["ohash"]`                                                                                                                | 同上 build 段                                                                                             |
| `sharp binaries ... cannot be found` 构建警告 | 先验证 sharp 可加载性再定性：win32 `trace: false` 下属良性副作用（注释文档化即可）；非 win32 部署构建补 `externals.traceInclude: ["sharp"]` | [`dependency-triage.md`](dependency-triage.md) §6                                                         |

> 历史说明：`crawlLinks: false` 与 `prerender:routes` 中的 `routes.clear()` 曾是绕过 Windows 构建长尾的 workaround。它们不应从记忆中删除，但对 document-driven Nuxt Content 会导致运行时内容数据库为空，不能作为本技能的默认配置。

---

## 禁改项清单

以下配置没有明确证据前不要主动修改：

1. **`extends: ["shadcn-docs-nuxt"]`** — 它通常不是根因，不要试图换成直接复制模板文件
2. **`ogImage`** — 未完成 `nuxt-og-image: 5.1.9` 版本门禁前不要启用；先固定依赖再按需决定
3. **`icon.serverBundle.collections`** — 不限制集合会导致 Nitro OOM
4. **i18n 模块** — 不要做多语言改造，先保持单语最小配置
5. **`build.transpile` 中不要加 `"shiki"`** — starter 项目也没有加，加了反而可能引起问题
