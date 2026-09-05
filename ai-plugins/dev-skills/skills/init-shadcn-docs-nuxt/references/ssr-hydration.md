# SSR 与水合深度手册（边界手法 · 诊断工具链 · 验收纪律）

> 本手册是 2026-09-05 ai-vue-doc 故障中 SSR/水合相关经验的完整沉淀。适用信号：整站不水合、交互全死但 console 干净、`Failed to resolve component: X`、`Cannot read properties of undefined (reading 'createElement')`、CSS 导入致 500、页面 200 但内容是 404 UI。
>
> 与其他参考的分工：[`compat.md`](compat.md) 负责**模块导入错误打断水合**的 ESM/CJS 速查；本手册负责**水合状态判定**、**客户端/服务端组件注册边界**、以及**非 SSR-safe 包的隔离手法**。

---

## 1. 心智模型：水合失败的四种死法

| 死法                 | 症状                      | console 表现                                 | 根因域                                                | 深入章节        |
| -------------------- | ------------------------- | -------------------------------------------- | ----------------------------------------------------- | --------------- |
| ① SSR 崩溃           | 页面 500 或空 shell       | SSR 日志有错                                 | 非 SSR-safe 包在服务端求值                            | §3              |
| ② 客户端 entry 崩溃  | HTML 正常但交互全死       | **常无错**（模块执行失败不走 console.error） | 预构建盲区 / CJS interop（→ dependency-triage.md §4） | §2              |
| ③ 组件解析失败       | 页面渲染但组件缺失 / 警告 | Vue warn                                     | client-only 注册与 SSR 渲染不对称                     | §4              |
| ④ hydration mismatch | 内容闪烁 / 双份 DOM       | Vue warn hydration                           | SSR/CSR 输出不一致（MDC、时间戳、随机值）             | mdc-prettier.md |

**第一动作永远是判定当前处于哪种死法**，不要先改配置。

---

## 2. 水合诊断工具链（按序执行）

### 2.1 第一步：判定水合状态（不要信 console）

```js
// 浏览器 console 执行
!!document.querySelector("#__nuxt").__vue_app__; // true = 已水合
!!window.useNuxtApp; // true = Nuxt app 已初始化
```

- `false` + console 干净 = 死法②的典型形态。**模块脚本执行失败不一定走 `console.error`**——这是最大的排查陷阱。
- `true` 但交互失效 = 局部组件问题（死法③/④）。

### 2.2 第二步：抓真实模块错误

console 无错但水合失败时，动态重执行 entry 强制暴露错误：

```js
// entrySrc 可从 <script type="module" src="..."> 取
import(entrySrc + "?v=diag").catch((e) => console.error("真实错误:", e));
// 典型输出：dayjs.min.js does not provide an export named 'default'
```

### 2.3 第三步：定位导入链（CDP initiator）

知道"dayjs 崩了"不够，必须知道**谁导入了它**，否则会修错依赖：

```js
// playwright-core connectOverCDP 直连，监听
Network.requestWillBeSent;
// 取 params.initiator.url
// 实证输出：mermaid@11.16.0/dist/chunks/mermaid.core/chunk-*.mjs
// → 证明 dayjs 的导入方是 mermaid 的 chunk，而非 element-plus
```

没有这一步，`optimizeDeps.include` 会写错对象——修了 element-plus 的 dayjs，下一个崩的是 mermaid 的 dayjs。

### 2.4 浏览器接入的降级路径

| 场景                                                                              | 处置                                                                                                                                                                     |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| agent-browser 自动启动 Chrome 失败（Chrome 152 + exit 3 / 无 DevToolsActivePort） | 手动 `chrome --headless=new --remote-debugging-port=<port>` + `agent-browser connect <port>`。**同一方法失败 ≥2 次即切降级，不要反复重试**（实证：原地重试 8+ 次才降级） |
| agent-browser console 捕获不可靠                                                  | playwright-core `connectOverCDP` 直连抓 `pageerror` + CDP Network initiator                                                                                              |
| 移动视口下"组件不渲染"                                                            | header logo 等容器是 `hidden md:flex` 响应式类，**验收必须桌面视口**（agent-browser 命令 `set viewport <w> <h>`，非 `set-viewport`）                                     |

---

## 3. 非 SSR-safe 包的隔离：两种死法与三种手法

### 3.1 非 SSR-safe 包的两种崩法

| 崩法                   | 实证                                                 | 错误信号                                                        |
| ---------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| 模块求值期执行 DOM API | `vue-element-plus-x` 顶层 `document.createElement`   | `Cannot read properties of undefined (reading 'createElement')` |
| dist 内 import `.css`  | `vue-element-plus-x/dist/style7.css` 被 Nitro 外部化 | Node ESM 无法加载 CSS → 500                                     |

`build.transpile` **只解决外部化 + CSS 问题，对顶层 DOM API 无效**（只是把崩溃点后移）——两类症状先分清再动手。

### 3.2 三种隔离手法与选型

| 手法                    | 代码                                                        | 服务端行为                                           | 适用                                                                  |
| ----------------------- | ----------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| `.client.ts` 插件       | `plugins/ai-vue.client.ts` 内 `app.component(...)` 全局注册 | 文件完全不求值                                       | 组件库全局注册、样式初始化（首选，最彻底）                            |
| `v-if="isMounted"` 守卫 | `onMounted(() => isMounted.value = true)`                   | 模板仍参与 SSR 编译，但内容不渲染                    | demo/交互区延迟挂载，保持 SSR shell 稳定                              |
| `defineAsyncComponent`  | `defineAsyncComponent(() => import("pkg").then(m => m.X))`  | **loader 仅实际渲染时执行**；SSR 不渲染则不 evaluate | 组件由 `.client` 插件注册、但被 SSR 渲染的组件引用时（§4 的标准解法） |

---

## 4. hoisted resolveComponent 陷阱（本手册最重要的单条经验）

### 4.1 机理

Vue SFC 编译器把模板内的组件解析 **hoist 到 render 函数开头**：

```js
// 源码：<AiChat v-if="isMounted" />
// 编译产物（简化）：
const _component_AiChat = _resolveComponent("AiChat")  // ← hoisted，v-if 为假也执行！
return isMounted ? (_openBlock(), _createBlock(_component_AiChat)) : ...
```

因此 **`v-if` 不能防止组件解析**。当 AiChat 仅由 `.client` 插件全局注册（SSR 端不存在）时，任何 SSR 渲染路径引用它都会产生 `Failed to resolve component: AiChat`——即使运行时永远不会真的渲染它。

### 4.2 修复决策表

| 方案                                                          | 结果                                                                                                                            | 结论         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 静态 `import { AiChat } from "ai-vue"`                        | ❌ 组件页 500：把非 SSR-safe 包拉进 SSR 模块图（其依赖 `dist/style7.css` 在 Node 无法加载）                                     | **禁止**     |
| 置信 `v-if` 会拦住解析                                        | ❌ 警告照旧（hoisted）                                                                                                          | 无效         |
| `defineAsyncComponent(() => import(...).then(m => m.AiChat))` | ✅ 异步组件是直接绑定不再按名解析（消警告）；loader 仅实际渲染时执行（SSR 时 `isMounted=false` 不触发 import，不进 SSR 模块图） | **标准解法** |

### 4.3 教训

修一个警告前先想清楚**组件的注册边界在客户端还是服务端**，以及修复手段会不会把包拉进另一侧的模块图。修复手段本身成为下一个 500，是真实发生过的事故。

---

## 5. HTTP 200 假象（catch-all 路由）

`pages/[...slug].vue` 会把未命中 Content 的 404 UI 以 **HTTP 200** 返回；Content API 路由缺失时所有请求也会落到 catch-all。

**后果**：状态码冒烟全绿，实际全站是 404 页——实证中曾与 h3 污染叠加出现，极易误判为"依赖修好了"。

**纪律**：任何页面级验证必须断言 `<title>` 或正文特征内容；Content 站点必须同时探活 `/api/_content/cache.json` 与 `/api/_content/search`（见 incident-repair.md §3）。

---

## 6. 配置层的水合相关陷阱（快速索引）

| 陷阱                                         | 机理                                                                                                                   | 一句话处置                                                                                                               | 深入                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| `.client` 插件导入不在 optimizeDeps 扫描入口 | 整树原始产物直出，CJS 无 interop                                                                                       | `vite.optimizeDeps.include` 显式纳入（嵌套 `>` 语法）                                                                    | dependency-triage.md §4 |
| build 与 dev 并行跑                          | 二者共享 `.nuxt`，build 的 `nuxt prepare` 清写污染 dev 的 server 产物 → 全站 500（`#internal/nuxt/paths not defined`） | **跑 build 前必须停 dev**；污染后：停 dev → 清 `.nuxt` → 重启                                                            | incident-repair.md §5   |
| UI 配置（logo 等）只读源码推断               | shadcn-docs-nuxt `Logo.vue` 的标题文本嵌在 logo 的 `v-if` 分支**内部**，logo 置空 = 标题一起消失                       | logo 指向真实存在的资源（如 `/favicon.svg`），勿伪造不存在的 `/logo.svg`（IPX 404）；**UI 配置修改必须过浏览器视觉验收** | §2.4 桌面视口要求       |
| `#app-manifest` pre-transform ERROR          | Nuxt 3.21 `manifest.js` 的 `if (false)` 死分支被 vite import-analysis 解析                                             | 已知噪音，功能无影响，不处理                                                                                             | —                       |

---

## 7. SSR/水合验收清单（完成门）

- [ ] `__vue_app__` 判定已水合（不是"console 没错"）
- [ ] 桌面视口截图：header logo + 标题 + 导航完整，无破图
- [ ] 至少一个交互闭环（输入 → 触发 → 结果渲染）
- [ ] 页面断言 `<title>` / 正文内容（防 catch-all 200 假象）
- [ ] SSR 日志无 `Failed to resolve component` 警告
- [ ] Content 站点探活 cache/search API 均 200 且非空
- [ ] 客户端 dev 日志 optimizeDeps 警告归零
