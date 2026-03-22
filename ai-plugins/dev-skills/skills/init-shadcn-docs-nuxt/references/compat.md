# ESM/CJS 依赖兼容完整参考

## 模板文件

| 模板                                                                | 说明                                                                        |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`templates/nuxt.config.full.ts`](../templates/nuxt.config.full.ts) | Vite 段包含完整的 alias / optimizeDeps / dedupe / ssr.noExternal 配置及注释 |
| [`templates/shims/debug.ts`](../templates/shims/debug.ts)           | debug 包的 ESM 兼容 shim 完整源码及设计说明                                 |

> **使用时请直接阅读模板文件中的注释**，注释解释了每个配置项的根因和不配置的后果。

---

## 问题本质

`shadcn-docs-nuxt` 依赖链中的多个包（`dayjs`、`mermaid`、`debug`、`@braintree/sanitize-url`）在浏览器端存在 ESM/CJS 入口冲突。当 Vite 选择了错误的入口时，浏览器会报模块导入错误，**并且打断整个 hydration 流程**，导致看起来是"暗黑模式失效""侧边栏无法折叠"等 UI 问题，实际根因是 JS 执行中断。

### 关键认知

> **交互失效 ≠ 样式问题。优先查 console 模块错误，不要先改 CSS。**

---

## 兼容速查表

| 包名                      | 报错信号                                                  | 根因                                                     | 修复配置                                                             |
| ------------------------- | --------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| `dayjs`                   | `dayjs.min.js does not provide an export named 'default'` | 默认入口是 CJS `dayjs.min.js`，ESM 环境无 default export | `vite.resolve.alias` 指向 `dayjs/esm/index.js` + `dedupe: ["dayjs"]` |
| `mermaid`                 | `mermaid` 相关模块导入异常 / chunk 加载失败               | 默认入口是 CJS，需要 ESM 发行版                          | `vite.resolve.alias` 指向 `mermaid/dist/mermaid.esm.mjs`             |
| `debug`                   | `debug` 默认导出不兼容 / SSR 端 require 报错              | 包的 default export 在 ESM 与 CJS 间不一致               | `vite.resolve.alias` 指向本地 shim + `ssr.noExternal: ["debug"]`     |
| `@braintree/sanitize-url` | 链式报错（通常跟着其他依赖一起出现）                      | 未被 Vite 预优化，ESM 转换不完整                         | `optimizeDeps.include: ["@braintree/sanitize-url"]`                  |

---

## createRequire 模式

为什么使用 `createRequire` 而非硬编码路径？详见 [`templates/nuxt.config.full.ts`](../templates/nuxt.config.full.ts) 文件头部注释。

核心原因：

- pnpm workspace 下 `node_modules` 结构不可预测（hoist / shamefully-hoist / .pnpm store）
- `require.resolve` 会沿 Node 模块解析算法找到正确的物理路径
- 避免了跨平台路径分隔符问题

---

## debug shim 设计说明

完整源码和详细设计注释见 [`templates/shims/debug.ts`](../templates/shims/debug.ts)。

关键设计点：

- 同时提供 `default export` 和 `named exports`，兼容所有导入方式
- `debugFactory.default = debugFactory` 确保 CJS require 也能正确工作
- 所有方法都是 no-op 实现，因为文档站不需要实际的 debug 输出
- 必须导出 debug 原始 API 的所有 named export，否则依赖链中使用 `import { enable } from 'debug'` 的代码会报错

---

## 排查顺序

当浏览器出现交互异常时，**严格按此顺序**：

```plain
1. 打开浏览器 DevTools → Console
2. 查找红色错误，关键词：
   - "does not provide an export named"
   - "is not a function"
   - "Cannot read properties of undefined"
   - "Failed to fetch dynamically imported module"
3. 根据报错信号对照上方速查表，逐个补 nuxt.config.ts 配置
4. 每补一个 alias/include，重启 dev server 并清除浏览器缓存
5. 确认 console 无新红色错误后，再检查 UI 交互
6. 最后才检查 Tailwind/CSS 样式问题
```

---

## 常见误判

| 表象                       | 容易误判为                  | 实际根因                                     |
| -------------------------- | --------------------------- | -------------------------------------------- |
| 暗黑模式切换按钮点击无反应 | Tailwind dark mode 配置错误 | dayjs/mermaid/debug 导入报错打断了 hydration |
| 侧边栏折叠按钮无效         | CSS 布局问题                | 同上，JS 错误导致 Vue 组件未正确激活         |
| 页面内容显示但无法交互     | SSR 正常但 CSR 失败         | hydration mismatch，通常由模块导入错误引起   |
| 首次加载正常，刷新后异常   | 缓存问题                    | Vite 预优化未覆盖关键依赖                    |
