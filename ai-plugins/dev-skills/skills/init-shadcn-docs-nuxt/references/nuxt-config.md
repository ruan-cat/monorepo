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

使用 [`templates/nuxt.config.minimal.ts`](../templates/nuxt.config.minimal.ts)，只保留 `extends` + `ogImage` + `icon.clientBundle`，尝试 `nuxt dev`。

### 阶段 2：遇到客户端报错

浏览器 console 出现模块导入错误时，按以下顺序逐项补丁：

| 报错信号                                            | 补丁配置                                                                   | 参考模板                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `dayjs... does not provide an export named default` | `vite.resolve.alias` 指向 `dayjs/esm/index.js` + `dedupe: ["dayjs"]`       | [`nuxt.config.full.ts`](../templates/nuxt.config.full.ts) Vite 段 |
| `mermaid` 相关模块导入异常                          | `vite.resolve.alias` 指向 `mermaid/dist/mermaid.esm.mjs`                   | 同上                                                              |
| `debug` 默认导出不兼容                              | `vite.resolve.alias` 指向 `./shims/debug.ts` + `ssr.noExternal: ["debug"]` | 同上 + [`shims/debug.ts`](../templates/shims/debug.ts)            |
| `@braintree/sanitize-url` 链式报错                  | 补 `optimizeDeps.include`                                                  | 同上                                                              |
| i18n defaultLocale warning                          | 补 `i18n.defaultLocale` + `i18n.locales` 单语配置                          | 同上 i18n 段                                                      |
| `defineOgImageComponent is not defined`             | 覆盖页面文件移除调用，不要启用 ogImage 模块                                | —                                                                 |
| Icon 集合缺失提示                                   | 安装 `@iconify-json/lucide` + 配置 `icon.serverBundle.collections`         | 同上 icon 段                                                      |

### 阶段 3：构建优化

仅在构建阶段出问题时添加：

| 问题                 | 补丁                                                          | 参考                                                                                            |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Nitro 卡住           | `nitro.externals.trace: false`                                | [`nuxt.config.full.ts`](../templates/nuxt.config.full.ts) nitro 段 + [`windows.md`](windows.md) |
| 预渲染 OOM           | `nitro.prerender.crawlLinks: false` + `prerender:routes` 清空 | 同上                                                                                            |
| ohash transpile 报错 | `build.transpile: ["ohash"]`                                  | 同上 build 段                                                                                   |

---

## 禁改项清单

以下配置没有明确证据前不要主动修改：

1. **`extends: ["shadcn-docs-nuxt"]`** — 它通常不是根因，不要试图换成直接复制模板文件
2. **`ogImage: { enabled: false }`** — 启用会触发 500
3. **`icon.serverBundle.collections`** — 不限制集合会导致 Nitro OOM
4. **i18n 模块** — 不要做多语言改造，先保持单语最小配置
5. **`build.transpile` 中不要加 `"shiki"`** — starter 项目也没有加，加了反而可能引起问题
