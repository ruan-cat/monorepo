---
name: init-shadcn-docs-nuxt
description: >-
  Use when initializing or rebuilding any component-library/project documentation site based on
  `shadcn-docs-nuxt`, or troubleshooting its Nuxt Content/H3, `nuxt-og-image` Nuxt-generation drift, prerender, SSR externalization,
  module-compatibility, MDC syntax, or Windows build issues. 适用于初始化或重构任意组件库/项目的
  `shadcn-docs-nuxt` 文档站，快速建立可运行、可构建、可维护的 Nuxt 文档底座，或排查配置复杂化、
  模块兼容、Nuxt Content/H3 版本漂移、prerender、SSR externalization、MDC 语法错误、
  Windows 构建假卡死等故障。触发词包括“搭建组件库文档”“接入 shadcn-docs-nuxt”“重做 Nuxt 文档站”、
  “迁移文档模板”以及 Content cache/search API 500、`ERR_INVALID_URL`、`sendError` 导出缺失、
  `entities/decode`、`FUNCTION_INVOCATION_FAILED`、Vercel `READY` 但请求失败、`rolldown@nightly` 解析失败、
  `@vueuse/core`、`registerMessageResolver`、`prerender:routes` 等错误信号。
user-invocable: true
metadata:
  version: "1.6.1"
---

# 初始化 `shadcn-docs-nuxt` 组件库文档

以"最小可用 + 快速稳定"为目标，给任意项目建立可长期维护的 `shadcn-docs-nuxt` 文档站。

> 本技能拆分为三层：
>
> - **SKILL.md** — 导航与流程
> - **references/** — 排错手册与配置说明
> - **templates/** — 可直接复制的代码模板（含完整注释，注释即文档）
>
> 执行时按流程推进，遇到配置细节查 reference，需要代码直接读 template。

## 模板文件索引（templates/）

代码模板包含完整的注释说明，**注释中记录了每个配置项的根因、不配置的后果、以及历史事故**。使用时直接读取模板文件，不要跳过注释。

| 模板文件                                                                 | 对应文档站文件            | 说明                             |
| ------------------------------------------------------------------------ | ------------------------- | -------------------------------- |
| [`templates/nuxt.config.minimal.ts`](templates/nuxt.config.minimal.ts)   | `nuxt.config.ts`          | 最小启动骨架                     |
| [`templates/nuxt.config.full.ts`](templates/nuxt.config.full.ts)         | `nuxt.config.ts`          | 生产基线（默认保留 Nitro trace） |
| [`templates/app.config.ts`](templates/app.config.ts)                     | `app.config.ts`           | 站点元信息与 UI 配置             |
| [`templates/tailwind.config.js`](templates/tailwind.config.js)           | `tailwind.config.js`      | 完整 Tailwind + shadcn-vue 主题  |
| [`templates/assets/css/tailwind.css`](templates/assets/css/tailwind.css) | `assets/css/tailwind.css` | CSS 入口 + 亮/暗主题变量         |
| [`templates/assets/css/main.css`](templates/assets/css/main.css)         | `assets/css/main.css`     | 自定义样式示例                   |
| [`templates/shims/debug.ts`](templates/shims/debug.ts)                   | `shims/debug.ts`          | debug ESM 兼容 shim              |
| [`templates/workspace-aliases.ts`](templates/workspace-aliases.ts)       | `workspace-aliases.ts`    | 组件库源码别名函数               |
| [`templates/plugins/ui-lib.ts`](templates/plugins/ui-lib.ts)             | `plugins/xxx.ts`          | Nuxt Plugin 注册模式             |
| [`templates/package.json`](templates/package.json)                       | `package.json`            | 依赖与脚本基线                   |
| [`templates/prettierrc.json`](templates/prettierrc.json)                 | `.prettierrc`             | MDC 防护（兜底方案）             |
| [`templates/prettierignore`](templates/prettierignore)                   | `.prettierignore`         | MDC 防护（主方案）               |

## 参考文档索引（references/）

| 文件                                                                                                       | 内容                                                                                                 |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`references/nuxt-config.md`](references/nuxt-config.md)                                                   | 按需补丁策略、禁改项清单                                                                             |
| [`references/compat.md`](references/compat.md)                                                             | ESM/CJS 兼容速查表、排查顺序、常见误判表                                                             |
| [`references/tailwind-css.md`](references/tailwind-css.md)                                                 | content 扫描规则、CSS 变量格式、常见样式问题排查                                                     |
| [`references/mdc-prettier.md`](references/mdc-prettier.md)                                                 | MDC 标准语法、5 种错误写法对照、hydration mismatch 因果链                                            |
| [`references/windows.md`](references/windows.md)                                                           | 构建假卡死、子进程链清理、EPERM 文件锁、单进程复现法                                                 |
| [`references/workspace.md`](references/workspace.md)                                                       | 别名顺序陷阱、依赖矩阵、plugin 注册、i18n 单语、OG Image、目录结构                                   |
| [`references/incident-repair.md`](references/incident-repair.md)                                           | Nuxt Content/H3 版本漂移、prerender 钩子历史与构建故障分层排查                                       |
| [`references/dependency-triage.md`](references/dependency-triage.md)                                       | 依赖提升层排查、packageExtensions/overrides/patch 决策、optimizeDeps 盲区、fork 治理、平台二进制追踪 |
| [`references/ssr-hydration.md`](references/ssr-hydration.md)                                               | 水合诊断工具链、非 SSR-safe 包隔离手法、hoisted 组件解析陷阱、HTTP 200 假象、SSR 验收清单            |
| [`references/production-graph-and-runtime-closure.md`](references/production-graph-and-runtime-closure.md) | production graph、final Nitro OOM、standalone `MODULE_NOT_FOUND`、Turbo cache 与 artifact 验收       |
| [`references/README.md`](references/README.md)                                                             | 九份现行参考的信号导航与迁移台账                                                                     |

---

## 核心原则（6 条铁律）

1. **保持精简**：`nuxt.config.ts` 和 `app.config.ts` 先最小化，不先堆功能。
2. **先跑通再美化**：优先确保 `dev` / `build` 稳定，再做样式和内容扩展。
3. **先修运行链再修样式**：交互异常（暗黑模式、侧边栏折叠失效）先查 hydration 和模块导入报错，不要先改 CSS。
4. **避免错误扩展**：不要第一时间折腾 i18n / icon 自定义方案，先使用模板默认可用路径。
5. **内容语法严格**：MDC 容器语法要标准化，参见 [`references/mdc-prettier.md`](references/mdc-prettier.md)。
6. **生产闭包先证据后配置**：Vercel `READY` 只代表部署编排完成，不代表 Function runtime 可用；必须把部署包 manifest、最终 artifact、远端请求和运行日志串成证据链。

---

## 历史事故强约束（22 条记忆）

执行本技能时，**必须默认带着这些"已发生过"的事故记忆**：

1. **不要假设 workspace 组件库已经先构建完成**；文档站需要能直接从源码启动。→ 见 [`references/workspace.md`](references/workspace.md)
2. **不要把交互失效先归因到样式**；先排除 hydration 被模块导入错误打断。→ 见 [`references/compat.md`](references/compat.md)
3. **不要让 prettier 改写 `content/**/\*.md` 的 MDC 结构**。→ 见 [`references/mdc-prettier.md`](references/mdc-prettier.md)
4. **不要在 Windows 下把"日志停住"直接判定为"进程卡死"**，先排查残留子进程。→ 见 [`references/windows.md`](references/windows.md)
5. **不要一开始就重写 i18n / icon 体系**；先拿模板默认链路跑通。→ 见 [`references/nuxt-config.md`](references/nuxt-config.md)
6. **不要直接启用 `ogImage` 模块**；会触发 `vue.runtime.mjs does not provide an export named toValue` 的 500 错误。→ 见 [`references/nuxt-config.md`](references/nuxt-config.md)
7. **核心运行时包要按兼容矩阵固定**：至少同时审查 `shadcn-docs-nuxt`、`@ztl-uwu/nuxt-content`、`nuxt`、`h3`，不能只看主题的传递依赖范围。
8. **`prerender:routes` 不是无条件禁用项，而是历史 workaround**：它曾用于缓解 Windows 构建长尾，但对 document-driven Nuxt Content 会导致内容数据库为空；只有确认项目不依赖 Content prerender 且完成等价验证时才可讨论。→ 见 [`references/incident-repair.md`](references/incident-repair.md)
9. **final Nitro OOM 与 standalone `MODULE_NOT_FOUND` 必须回到首个失败门**：前者需要测量堆与产物阶段，后者需要区分 Vite SSR transform、Nitro inline、trace 与 manifest，不能用宽配置掩盖。→ 见 [`references/production-graph-and-runtime-closure.md`](references/production-graph-and-runtime-closure.md)
10. **Turbo cache 命中不等于 runtime closure 可信**：只有诊断 cache 可信度或 cache/artifact 证据冲突时，才执行 `turbo run <task> --force`；常规生产验收不执行该命令，但必须启动 `.output` server 并完成 HTTP smoke。→ 见 [`references/production-graph-and-runtime-closure.md`](references/production-graph-and-runtime-closure.md)
11. **`nuxt-og-image` 也属于 Nuxt 世代边界**：Nuxt 3 保守基线必须将 `nuxt-og-image` 固定为 `5.1.9`；`5.1.10+` 可能解析 Nuxt 4 的 `@nuxt/kit`/H3 v2。仅固定 `h3: 1.15.11` 不足以约束这个传递模块，必须在根 `package.json` 使用 `pnpm.overrides`，并用 `pnpm why nuxt-og-image @nuxt/kit h3` 复核实际树。→ 见 [`references/incident-repair.md`](references/incident-repair.md)
12. **Vercel `READY` 不等于 runtime 通过**：READY 后必须请求部署 URL 的页面与 Content cache/search API，并读取 Function runtime 日志；没有 HTTP/日志证据时只能标记 `candidate` 或 `needs_check`，不能写“生产通过”。→ 见 [`references/production-graph-and-runtime-closure.md`](references/production-graph-and-runtime-closure.md)
13. **修改前后保护 dirty tree**：先记录 `git status --short --untracked-files=all` 与目标 diff；禁止在时间压力下无授权 `git add .`、覆盖、reset 或把用户脏改动混入验证/提交。→ 见 [`references/production-graph-and-runtime-closure.md`](references/production-graph-and-runtime-closure.md)
14. **构建工具 override 必须按包和 registry 证据收窄**：`tsdown@0.3.1>rolldown` 仅用于复现 `rolldown@nightly` registry 解析阻断；禁止用 root 全局 `rolldown` override 掩盖 peer/API 不兼容，必须先检查 `pnpm why/list`、manifest、lockfile 与 clean fresh install。→ 见 [`references/production-graph-and-runtime-closure.md`](references/production-graph-and-runtime-closure.md)
15. **依赖提升层污染（2026-09-05 ai-vue-doc 实证）**：monorepo 中任一包引入新版传递依赖（如 h3 v2）会翻转 pnpm 提升层，所有「未声明该依赖却裸导入」的包同时中招；`pnpm why` 显示单版本 ≠ 运行时单实例。修复用 `packageExtensions` 逐包注入，禁用全局 override。→ 见 [`references/dependency-triage.md`](references/dependency-triage.md)
16. **optimizeDeps 预构建盲区（2026-09-05 实证）**：`.client` 插件导入与插件内动态导入的包不在扫描入口，CJS 传递依赖无 interop → 整站不水合且 console 常无错。修复用 `vite.optimizeDeps.include` 显式纳入（嵌套 `>` 语法）。→ 见 [`references/dependency-triage.md`](references/dependency-triage.md)
17. **HTTP 200 ≠ 内容正常（catch-all 假象）**：`pages/[...slug].vue` 会把 404 UI 以 200 返回；验证必须断言 `<title>` 或正文内容。→ 见 [`references/ssr-hydration.md`](references/ssr-hydration.md)
18. **模块执行失败不一定走 console（水合诊断工具链）**：判定水合用 `__vue_app__`；抓真实错误用动态 `import(entry + '?v=diag')`；定位导入链用 CDP `Network.requestWillBeSent` 的 `initiator.url`；Chrome 152 自动启动失败时走手动 CDP 降级路径。→ 见 [`references/ssr-hydration.md`](references/ssr-hydration.md)
19. **客户端/服务端组件注册不对称（hoisted 解析陷阱）**：Vue 把组件解析 hoist 到 render 开头，`v-if` 为假也执行；client-only 注册的组件被 SSR 引用必警告，静态 import 修复会把非 SSR-safe 包拉进 SSR 图致 500，标准解法是 `defineAsyncComponent`。→ 见 [`references/ssr-hydration.md`](references/ssr-hydration.md)
20. **fork 包改名的硬编码自引用残留（2026-09-05 实证）**：fork 的 dist 内可能硬编码旧包名前缀的 `optimizeDeps.include` 条目，vite 必然解析失败；用 `pnpm patch` 修正前缀（先确认依赖链物理完整）。引入 fork 后先 grep 其 dist 自引用字符串。→ 见 [`references/dependency-triage.md`](references/dependency-triage.md)
21. **非 SSR-safe 包的隔离与 UI 配置陷阱**：非 SSR-safe 包（顶层 DOM API、dist 内 CSS 导入）一律走 `.client` 边界；UI 配置（logo 等）修改必须过桌面视口浏览器验收，源码 `v-if` 分支推断不可靠。→ 见 [`references/ssr-hydration.md`](references/ssr-hydration.md)
22. **构建期平台二进制警告先验证再定性，且禁用 traceInclude**：`sharp binaries cannot be found` 不一定是缺依赖——nitro `trace: false` 下追踪目录必然为空；先验证 sharp 可加载性再定性。**任何平台都勿配置 `traceInclude: ["sharp"]`**（Vercel linux 生产实机证伪：nft emitDependency 对 resolve 出的伪路径抛硬错误，构建失败）。→ 见 [`references/dependency-triage.md`](references/dependency-triage.md)

---

## 故障检修入口（命中信号后必须执行）

当出现 Content cache/search API `500`、`ERR_INVALID_URL`、H3 `sendError` 导出缺失、
`entities/decode` 或 `@vueuse/core` 缺包、`registerMessageResolver`、Nitro prerender 失败、
`page._id` 为空、Windows 构建长时间无输出等信号时，**先读取**
[`references/incident-repair.md`](references/incident-repair.md)，再修改配置或内容。

出现依赖解析类信号——`Failed to resolve dependency`、整批包同时报同一依赖的导出缺失、
`sharp binaries ... cannot be found`、fork 包升级后批量 WARN、`pnpm why` 与实际行为矛盾——
**先读取** [`references/dependency-triage.md`](references/dependency-triage.md)。

出现 SSR/水合类信号——页面 200 但交互全死、console 干净却不水合、
`Failed to resolve component: X`、SSR 渲染非 SSR-safe 包致 500、
暗黑模式/侧栏失效且组件注册在 `.client` 插件——**先读取**
[`references/ssr-hydration.md`](references/ssr-hydration.md)。

出现 final Nitro OOM、standalone `MODULE_NOT_FOUND`、production graph 被 alias 或宽 externalization 放大、
Turbo cache 与 `.output` 不一致、artifact 无法启动或 HTTP smoke 失败时，**先读取**
[`references/production-graph-and-runtime-closure.md`](references/production-graph-and-runtime-closure.md)。

修改任何 `nuxt.config.ts`、manifest 或 lockfile 前，先读取当前工作树状态；部署验证时必须区分本地、CI、Vercel 和浏览器四类证据。

检修时必须先回答四件事：

1. 实际安装的 `shadcn-docs-nuxt`、`@ztl-uwu/nuxt-content`、`nuxt`、`h3`、`nuxt-og-image`、`@nuxt/kit` 是否属于同一兼容世代；提升层 `.pnpm/node_modules` 的版本与裸导入的解析目标是否与 `pnpm why` 一致；
2. 当前错误属于 Content/H3 运行时失配、依赖提升层/预构建盲区（→ dependency-triage.md）、SSR/水合边界（→ ssr-hydration.md）、Windows OOM/NFT 构建长尾，还是 production graph 的 Vite SSR transform、Nitro inline、trace/manifest 闭包；
3. 当前配置是否误用了历史 `prerender:routes` / `routes.clear()`、无条件 `trace: false` 或全量 `inline`；
4. 验证口径是否包含内容断言、水合判定、浏览器桌面视口截图与交互闭环（状态码 200 与 console 干净都不足为证）。

不要用单次首页 `200` 或本地 Windows 构建成功替代 Content API、fresh 依赖树和 Linux/Vercel 验证。

---

## 推荐参考仓库优先级

按以下顺序学习并抽取配置（从高到低）：

1. **`nuxt-umami-docs`**（真实项目的稳定配置范式）
2. **`shadcn-docs-nuxt-starter`**（最小骨架）
3. **`shadcn-docs-nuxt`**（框架源码，仅用于查默认行为）
4. **`shadcn-docs-ui-thing`**（组件库扩展思路，谨慎吸收）

每个仓库重点优先阅读这 6 个文件：`package.json` → `nuxt.config.ts` → `app.config.ts` → `tailwind.config.*` → `assets/css/*` → `content/index.md`

---

## 标准落地流程

### 第 1 步：建立最小骨架

```plain
docs-site/
├─ package.json
├─ nuxt.config.ts
├─ app.config.ts
├─ tailwind.config.js
├─ assets/css/
│  ├─ tailwind.css
│  └─ main.css
├─ content/
│  └─ index.md
├─ shims/                  ← 按需，仅当 debug 兼容问题出现时
│  └─ debug.ts
├─ components/content/     ← 按需，自定义 MDC 组件
└─ plugins/                ← 按需，注册 workspace 组件库
```

如果是重构已有文档站，先保留现有 `content/` 层级，不要和"底座重建"混在一次改动里。

### 第 2 步：依赖与脚本

详见 [`references/workspace.md` § package.json 基线](references/workspace.md)。

核心要点：

- 依赖：`nuxt`、`shadcn-docs-nuxt`、`vue`、`vue-router`、`tailwindcss`、`tailwindcss-animate`
- Nuxt 3 文档站还必须固定 `nuxt-og-image: 5.1.9`；若主题传递依赖声明了更宽范围，在根 `package.json` 增加 `pnpm.overrides.nuxt-og-image: 5.1.9`
- 如需消费 workspace 组件库，补 `workspace:*` 依赖
- devDependencies：`@iconify-json/lucide`（Nuxt Icon 必需）
- 脚本必须包含 `predev` / `prebuild` / `postinstall` 三处 `nuxt prepare`
- fresh install 后必须检查实际解析树，并提交 lockfile；不要让 `^2.13.9` 之类的传递范围决定 Content 版本

### 第 3 步：Nuxt 配置

详见 [`references/nuxt-config.md`](references/nuxt-config.md)。

先用最小骨架启动，遇到客户端报错再按"按需补丁"策略逐项补兼容。

### 第 4 步：Tailwind + CSS

详见 [`references/tailwind-css.md`](references/tailwind-css.md)。

**硬性检查**：`content` 扫描必须覆盖 `node_modules/shadcn-docs-nuxt`，否则主题类缺失、暗黑样式异常。

### 第 5 步：MDC 内容

详见 [`references/mdc-prettier.md`](references/mdc-prettier.md)。

### 第 6 步：验证

执行后至少提供以下证据：

| 验证项         | 方法                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| 启动           | `pnpm --filter <pkg> dev` → 首页 HTTP 200                                                                           |
| 依赖           | `pnpm list` / `pnpm why h3` → 核心包实际版本可解释                                                                  |
| Nuxt 世代      | `pnpm why nuxt-og-image @nuxt/kit h3` → `nuxt-og-image@5.1.9` 且不出现 Nuxt 4/H3 v2 混入                            |
| Content        | fresh dev 请求 cache/search API → HTTP 200 且索引非空                                                               |
| 构建           | `pnpm --filter <pkg> build` → 有 `.output` 产物                                                                     |
| 生产图         | 以首个失败门检查 alias、externalization、inline、trace 与实际部署包 manifest                                        |
| 产物           | 必须启动 `.output` server → 关键页面与 Content API HTTP smoke 通过                                                  |
| 缓存诊断       | 只有诊断 cache 可信度或 cache/artifact 证据冲突时，才执行 `turbo run <task> --force`；常规生产验收不执行该命令      |
| 交互           | 暗黑模式切换、侧边栏折叠可用                                                                                        |
| 内容           | 抽查至少 1 个 `::demo-playground` 页面，无裸 marker 文本                                                            |
| console        | 无阻断 hydration 的 `error`                                                                                         |
| Vercel runtime | READY 后记录部署 URL、Function 日志、页面与 Content API 响应；未实测不得标记完成                                    |
| 浏览器         | 使用可见浏览器走首页/组件 demo 用户路径，记录 console、hydration 与至少一个交互结果；没有浏览器工具时明确标记未完成 |

### 生产闭包硬门（必须执行）

按以下顺序推进，不得跳过或把后一个阶段的绿灯当成前一个阶段的修复：

1. **保护写集**：保存 dirty-tree 快照，确认目标文件和用户改动边界。
2. **锁定解析树**：fresh install 后运行 `pnpm why/list`，核对文档包 manifest、root trace 入口与 lockfile。
3. **定位首错阶段**：将错误归属到 Vite SSR transform、Nitro Rollup、NFT trace、Function manifest 或 runtime startup。
4. **最小变更**：优先修 manifest/入口；只有 exact error 证实所属阶段需要时才加窄 `noExternal`、`inline` 或 alias；生产默认不添加 `nitro.externals`。
5. **本地产物**：启动 `.output/server/index.mjs`，请求页面与 Content cache/search，记录 PID、响应体和日志。
6. **远端闭环**：Linux/Vercel 构建、Function artifact、部署 URL、HTTP smoke、运行日志和可见浏览器证据必须分别记录。
7. **状态口径**：缺任何外部门时写 `candidate/needs_check`；只有所有可运行门通过后才写 `verified`，并保留 deployment ID/SHA。

`compatibilityDate` 必须与 `nitro-api-development` 技能保持同一对象契约：同时列出 Cloudflare 与 Vercel 两个平台、各自的官方说明链接，并固定为 `2024-09-19`。它只代表目标 Nitro provider 的兼容基线，不是 `entities/decode` 或其他 runtime closure 的修复；不要退化为单字符串或从另一个项目盲抄日期。

文档站 runtime `verified` 与 npm/插件发布是两条独立链路；本技能不把 `changeset`、registry、tarball 或 GitHub Release 的成功当作文档站运行时通过。任务同时要求发布时，另按项目发布技能建立独立证据链。

---

## 常见故障排查顺序

交互失效（暗黑模式切换失败、侧栏按钮无效）时，**严格按此顺序**：

1. **先**看浏览器 console 是否有模块导入错误 → [`references/compat.md`](references/compat.md)
2. **再**按首个错误修依赖入口兼容（alias / optimizeDeps / dedupe / `ssr.noExternal`）；Vite SSR transform、Nitro inline 与 trace/manifest 不能互相替代。→ [`references/production-graph-and-runtime-closure.md`](references/production-graph-and-runtime-closure.md)
3. **最后**再做 Tailwind / 主题样式检查 → [`references/tailwind-css.md`](references/tailwind-css.md)

Content API 500、H3 导出错误或版本漂移时 → [`references/incident-repair.md`](references/incident-repair.md)

final Nitro OOM、standalone `MODULE_NOT_FOUND`、artifact 启动失败或 Turbo cache 不可信时 → [`references/production-graph-and-runtime-closure.md`](references/production-graph-and-runtime-closure.md)

构建卡住时 → [`references/windows.md`](references/windows.md)

MDC 裸文本 / hydration mismatch → [`references/mdc-prettier.md`](references/mdc-prettier.md)

---

## 禁改项（无明确证据前不动）

1. `extends: ["shadcn-docs-nuxt"]`（它通常不是根因）
2. 内容目录层级（底座改造阶段避免和内容重排耦合）
3. i18n 多语言路线（单语文档站先保持最小配置）
4. icon 体系大改（先沿用模板可用默认方案）
5. `ogImage: { enabled: false }`（直接启用会触发 500）
6. 生产模板不得默认配置 `nitro.externals`；Windows trace workaround 只能按 [`references/windows.md`](references/windows.md) 作为本地、可回滚的诊断开关使用。
7. 不得把 `tsdown` 的 registry 解析 workaround 扩大成 root 全局 `rolldown` override。

---

## 反模式清单

1. 先写大量"自定义配置"，最后才验证能否启动。
2. 用样式改动掩盖运行时导入错误。
3. 批量格式化 `content/**/*.md` 后不做页面与 console 回归。
4. 在同一轮同时重排内容架构 + 重构底座，导致回归不可定位。
5. 只报"看起来好了"，不附任何可重复验证证据。
6. 把 `::demo-playground` 写成 `## ::demo-playground`。
7. 在 Windows 下把"日志停住"直接判定为"进程卡死"而不先清理旧进程。
8. 把历史上的 `prerender:routes` 清空钩子当成所有 `shadcn-docs-nuxt` 项目的默认配置；应先判断是否使用 document-driven Content。
9. 把 Vercel `READY`、单次页面 `200` 或本地 build 结果写成生产 runtime 通过。
10. 未检查 dirty tree 就覆盖配置、执行 `git add .` 或把用户改动带入 release/验证。
11. 用 root 全局 `rolldown` override 让 `pnpm install` 暂时成功，却没有验证 tsdown 的 peer/range/API 兼容性。

---

## 输出要求

执行本技能时，最终至少给出：

1. 关键改动文件列表（配置、样式、内容）
2. 运行与构建验证结果
3. 若有风险项，给出下一步最小补救建议
4. 明确状态是 `verified`、`candidate` 还是 `needs_check`，并列出未完成的 provider/浏览器证据门
