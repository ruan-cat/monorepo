---
name: init-shadcn-docs-nuxt
description: >-
  Use when initializing or rebuilding any component-library/project documentation site based on
  `shadcn-docs-nuxt`, or troubleshooting its Nuxt Content/H3, `nuxt-og-image` Nuxt-generation drift, prerender, SSR externalization,
  module-compatibility, MDC syntax, or Windows build issues; also for Nuxt 3 → 4 generation upgrades and deployment-channel adjudication. 适用于初始化或重构任意组件库/项目的
  `shadcn-docs-nuxt` 文档站，快速建立可运行、可构建、可维护的 Nuxt 文档底座，或排查配置复杂化、
  模块兼容、Nuxt Content/H3 版本漂移、prerender、SSR externalization、MDC 语法错误、
  Windows 构建假卡死等故障；也适用于 Nuxt 3 → 4 世代升级与部署通道裁决。触发词包括“搭建组件库文档”“接入 shadcn-docs-nuxt”“重做 Nuxt 文档站”、
  “迁移文档模板”“Nuxt 4 升级”以及 Content cache/search API 500、`contents: []`、`ERR_INVALID_URL`、`sendError` 导出缺失、
  `entities/decode`、`FUNCTION_INVOCATION_FAILED`、`[unstorage] Invalid key`、Vercel `READY` 但请求失败、`rolldown@nightly` 解析失败、
  `@vueuse/core`、`registerMessageResolver`、`prerender:routes`、`ERR_MODULE_NOT_FOUND`、`UNLOADABLE_DEPENDENCY`、
  `stream did not contain valid UTF-8`、`/_ipx` logo 404、prebuilt workflow 过度设计等错误信号与场景。
user-invocable: true
metadata:
  version: "1.9.3"
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
| [`templates/pnpm-workspace.yaml`](templates/pnpm-workspace.yaml)         | `pnpm-workspace.yaml`     | pnpm 12 基线（五块设置落点）     |
| [`templates/prettierrc.json`](templates/prettierrc.json)                 | `.prettierrc`             | MDC 防护（兜底方案）             |
| [`templates/prettierignore`](templates/prettierignore)                   | `.prettierignore`         | MDC 防护（主方案）               |

> Nuxt 4 路径见 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md) §1–§7；上表 nuxt.config / package.json 模板为 Nuxt 3 基线。

## 参考文档索引（references/）

| 文件                                                                                                       | 内容                                                                                                       |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [`references/nuxt-config.md`](references/nuxt-config.md)                                                   | 按需补丁策略、禁改项清单                                                                                   |
| [`references/compat.md`](references/compat.md)                                                             | ESM/CJS 兼容速查表、排查顺序、常见误判表                                                                   |
| [`references/tailwind-css.md`](references/tailwind-css.md)                                                 | content 扫描规则、CSS 变量格式、常见样式问题排查                                                           |
| [`references/mdc-prettier.md`](references/mdc-prettier.md)                                                 | MDC 标准语法、5 种错误写法对照、hydration mismatch 因果链                                                  |
| [`references/windows.md`](references/windows.md)                                                           | 构建假卡死、子进程链清理、EPERM 文件锁、单进程复现法                                                       |
| [`references/workspace.md`](references/workspace.md)                                                       | 别名顺序陷阱、依赖矩阵、plugin 注册、i18n 单语、OG Image、目录结构                                         |
| [`references/incident-repair.md`](references/incident-repair.md)                                           | Nuxt Content/H3 版本漂移、prerender 钩子历史与构建故障分层排查                                             |
| [`references/dependency-triage.md`](references/dependency-triage.md)                                       | 依赖提升层排查、packageExtensions/overrides/patch 决策、optimizeDeps 盲区、fork 治理、平台二进制追踪       |
| [`references/ssr-hydration.md`](references/ssr-hydration.md)                                               | 水合诊断工具链、非 SSR-safe 包隔离手法、hoisted 组件解析陷阱、HTTP 200 假象、SSR 验收清单                  |
| [`references/production-graph-and-runtime-closure.md`](references/production-graph-and-runtime-closure.md) | production graph、final Nitro OOM、standalone `MODULE_NOT_FOUND`、Turbo cache 与 artifact 验收             |
| [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md)                                               | Nuxt 4 世代升级：已验证版本矩阵、F50 buildDir 规避、oxide 崩溃、条件 inline 配方、部署通道裁决与绕远路误区 |
| [`references/README.md`](references/README.md)                                                             | 十二份现行参考的信号导航与迁移台账                                                                         |

---

## 核心原则（6 条铁律）

1. **保持精简**：`nuxt.config.ts` 和 `app.config.ts` 先最小化，不先堆功能。
2. **先跑通再美化**：优先确保 `dev` / `build` 稳定，再做样式和内容扩展。
3. **先修运行链再修样式**：交互异常（暗黑模式、侧边栏折叠失效）先查 hydration 和模块导入报错，不要先改 CSS。
4. **避免错误扩展**：不要第一时间折腾 i18n / icon 自定义方案，先使用模板默认可用路径。
5. **内容语法严格**：MDC 容器语法要标准化，参见 [`references/mdc-prettier.md`](references/mdc-prettier.md)。
6. **生产闭包先证据后配置**：Vercel `READY` 只代表部署编排完成，不代表 Function runtime 可用；必须把部署包 manifest、最终 artifact、远端请求和运行日志串成证据链。

---

## 历史事故强约束（29 条记忆）

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
11. **`nuxt-og-image` 也属于 Nuxt 世代边界（5.1.9 钉版仅 Nuxt 3 世代）**：Nuxt 3 保守基线必须将 `nuxt-og-image` 固定为 `5.1.9`；`5.1.10+` 可能解析 Nuxt 4 的 `@nuxt/kit`/H3 v2。仅固定 `h3: 1.15.11` 不足以约束这个传递模块，必须在根 `package.json` 使用 `pnpm.overrides`，并用 `pnpm why nuxt-og-image @nuxt/kit h3` 复核实际树。Nuxt 4 路径不做该钉版，保持 `ogImage` disabled（见 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md)）。→ 见 [`references/incident-repair.md`](references/incident-repair.md)
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
23. **unstorage 1.17.6 的 key 校验是 nitro ≥2.13.5 的世代边界（2026-10-31 R46-R51 代码级实证）**：`[unstorage] Invalid key: "/"` 在 **Nuxt 3 世代** = prerender 500——content v2 根路由 payload 键 `"/"` 被 1.17.6 `prefixStorage.itemKey` 校验拒绝（`normalizeKey("/")` 归空串）；**Nuxt 4 世代键形态天然合法**（写入迁入 `getPayloadCacheKey` → `"/.json"`）。规避：root override 钉 `unstorage` 1.17.5（全保真）或 `experimental.payloadExtraction: false`（调用点消除）；content 升级不能规避。**Nuxt 4 迁移不免疫 content runtime 的「构建全绿 + 内容库为空」阻断**（独立机理，与该校验无关）。→ 见 [`references/incident-repair.md`](references/incident-repair.md) 事故 C

**✝️ 2026-10-31 机理定案（R52）**：该「独立机理」= **F50——Nuxt 4 把主 bundle nitro 实例的 buildDir 改写为 `node_modules/.cache/nuxt/.nuxt`**，content 的 `devStorage` base 随实例错位 ⇒ `_snapshot` 读空 ⇒ bundled 零条 ⇒ 生产内容库为空。早期判别：构建后 `grep -c "nitro:bundled:cache:content" .output/server/chunks/_/nitro.mjs`（N3 正常 = 5 条 / N4 错位 = 0 条）。上游已提交 [nuxt/nuxt#36792](https://github.com/nuxt/nuxt/issues/36792)。→ 见 [`references/incident-repair.md`](references/incident-repair.md) 事故 D

24. **Vite 8 rolldown 把原生 .node 当 UTF-8 解析（2026-11-11 eams 实证）**：`UNLOADABLE_DEPENDENCY … stream did not contain valid UTF-8`（@tailwindcss/oxide）崩溃留下半写 deps 缓存，dev hydration 卡死且 console 常无错；`vite.optimizeDeps.exclude` + `ssr.optimizeDeps.exclude` 双排除并清 `.cache/vite`。→ 见 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md) §3
25. **ipx SVG logo 404 是通道依赖的**：Vercel node-server/CI-prebuilt 下 `/_ipx/_/logo*.svg` 404，用 `nitro.routeRules` redirect 到静态原图；Git-integration 下 @nuxt/image 自动走 `/_vercel/image` provider，该 404 不复存在。→ 见 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md) §7
26. **部署通道误区：闭包缺包指向配置，不指向通道（2026-11-11 eams B 对照实验定案）**：云端构建 500 先穷尽配置级单变量实验；修复与基础设施同时落地 ⇒ 归因无效，须补对照；「云端/平台不可靠」结论须对照实验支撑；每加一层写明可删除条件。CI prebuilt workflow 仅作「本地 Windows 产物直接上传」的 scoped fallback，R53 适用面不得泛化到云端自建。→ 见 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md) §9
27. **nitro v3 / h3 v2 不能作 Nuxt 文档站运行时（加载期崩溃实测）**：override 强塞 → `Loading @nuxt/nitro-server server builder failed`；docs 运行时必然 nitropack 2/h3 v1（Nuxt 内置不可替换），项目级 v3/v2 需求用独立 API 应用（双应用架构，`/health` 实证）。→ 见 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md) §8
28. **Nuxt 4 版本矩阵与 F50 用户侧规避（2026-11-11 生产实证）**：nitropack 2.13.4 与 Nuxt 4 不兼容（本地 500 实测）、2.13.5 有 unstorage 回归（R46）⇒ Nuxt 4 用 2.13.6；`buildDir: ".nuxt"` 是 F50 首个已验证用户侧规避（探针 0→39），升级后仍须 Content 响应体内容断言。→ 见 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md) §1/§2
29. **双应用两代 nitro/h3 共存必须过隔离门（pnpm isolated）**：docs 包显式声明 `h3: 1.15.11` + 禁裸导入（未声明 h3 的包命中提升层「彩票」，任一 sibling 引入 h3 v2 即集体翻转爆炸）+ fresh install 后双树 `pnpm why` 复核（docs h3 1.x/nitropack 2.x，api h3 2.x 仅经 nitro 3）+ G10 跨应用对照（docs-only/api-only/双应用/不同构建顺序，解析变化必须留证据）；第三方包漏声明用 `packageExtensions` 逐包注入，禁全局 override。→ 见 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md) §8 与 [`references/dependency-triage.md`](references/dependency-triage.md)

---

## 故障检修入口（命中信号后必须执行）

当出现 Content cache/search API `500`、构建全绿但 Content API 返回空集合（`contents: []`）、`ERR_INVALID_URL`、`[unstorage] Invalid key`、H3 `sendError` 导出缺失、
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

出现 Nuxt 4 升级类信号——升级后云端构建或产物运行时逐包 `ERR_MODULE_NOT_FOUND`（ufo/hookable/@popperjs/core）、
`UNLOADABLE_DEPENDENCY` / `stream did not contain valid UTF-8`、`/_ipx` logo 404、
或正打算为构建 500 新增 prebuilt workflow / 断开 Git / 更换部署通道——**先读取**
[`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md)。

修改任何 `nuxt.config.ts`、manifest 或 lockfile 前，先读取当前工作树状态；部署验证时必须区分本地、CI、Vercel 和浏览器四类证据。

检修时必须先回答四件事：

1. 实际安装的 `shadcn-docs-nuxt`、`@ztl-uwu/nuxt-content`、`nuxt`、`h3`、`nuxt-og-image`、`@nuxt/kit` 是否属于同一兼容世代；提升层 `.pnpm/node_modules` 的版本与裸导入的解析目标是否与 `pnpm why` 一致；
2. 当前错误属于 Content/H3 运行时失配、依赖提升层/预构建盲区（→ dependency-triage.md）、SSR/水合边界（→ ssr-hydration.md）、Nuxt 4 世代升级/部署通道（→ nuxt4-upgrade.md）、Windows OOM/NFT 构建长尾，还是 production graph 的 Vite SSR transform、Nitro inline、trace/manifest 闭包；
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

### 第 0 步：检索先于动手

跨项目升级开工前，必检三处（CLI 优先）：

1. **兄弟项目 memorix**：检索目标项目与兄弟项目的 memorix 既有裁决、事故记录（CLI 优先，MCP 兜底）；
2. **项目台账**：实验台账、升级报告、FINDINGS 等现行态文件；
3. **本技能**：SKILL.md 与命中信号的 references。

用 `accessCount` / `lastAccessedAt` 作「在册未被用」审计信号——**在册 ≠ 被用**。案例：repro #6155/#6152 在册但 `accessCount=0`，eams 初期仍重犯打地鼠与通道误归因（memorix #6277）。检索纪律要用访问记录验证，不是用登记记录验证。

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
- Nuxt 4 文档站按 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md) §1 已验证矩阵核对（nuxt ^4.6.4 / shadcn-docs-nuxt ^1.2.2 / content ^2.14.1 / nitropack 2.13.6 内置 / h3 ^1.15.11），不做 5.1.9 钉版；消费 element-plus 时另走 §4–§6 条件准入配方
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

| 验证项         | 方法                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 启动           | `pnpm --filter <pkg> dev` → 首页 HTTP 200                                                                                                                                                              |
| 依赖           | `pnpm list` / `pnpm why h3` → 核心包实际版本可解释                                                                                                                                                     |
| Nuxt 世代      | Nuxt 3：`pnpm why nuxt-og-image @nuxt/kit h3` → `nuxt-og-image@5.1.9` 且不出现 Nuxt 4/H3 v2 混入；Nuxt 4：按 nuxt4-upgrade.md §1 矩阵复核 nitropack 2.13.6/h3 v1，并跑 §2 F50 探针（bundled 计数非零） |
| Content        | fresh dev 请求 cache/search API → HTTP 200 且索引非空                                                                                                                                                  |
| 构建           | `pnpm --filter <pkg> build` → 有 `.output` 产物                                                                                                                                                        |
| 生产图         | 以首个失败门检查 alias、externalization、inline、trace 与实际部署包 manifest                                                                                                                           |
| 产物           | 必须启动 `.output` server → 关键页面与 Content API HTTP smoke 通过                                                                                                                                     |
| 缓存诊断       | 只有诊断 cache 可信度或 cache/artifact 证据冲突时，才执行 `turbo run <task> --force`；常规生产验收不执行该命令                                                                                         |
| 交互           | 暗黑模式切换、侧边栏折叠可用                                                                                                                                                                           |
| 内容           | 抽查至少 1 个 `::demo-playground` 页面，无裸 marker 文本                                                                                                                                               |
| console        | 无阻断 hydration 的 `error`                                                                                                                                                                            |
| Vercel runtime | READY 后记录部署 URL、Function 日志、页面与 Content API 响应；未实测不得标记完成                                                                                                                       |
| 浏览器         | 使用可见浏览器走首页/组件 demo 用户路径，记录 console、hydration 与至少一个交互结果；没有浏览器工具时明确标记未完成                                                                                    |

Nuxt 4 升级类变更另须**三环境无假阳性复核**：dev/preview/生产独立起服务 + 真实浏览器交互 + console 三重证据，版本身份分别记录（dev 日志横幅 / preview `nitro.json` / 生产部署来源与页面体量）。→ 见 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md)

### 生产闭包硬门（必须执行）

按以下顺序推进，不得跳过或把后一个阶段的绿灯当成前一个阶段的修复：

1. **保护写集**：保存 dirty-tree 快照，确认目标文件和用户改动边界。
2. **锁定解析树**：fresh install 后运行 `pnpm why/list`，核对文档包 manifest、root trace 入口与 lockfile。
3. **定位首错阶段**：将错误归属到 Vite SSR transform、Nitro Rollup、NFT trace、Function manifest 或 runtime startup。
4. **最小变更**：优先修 manifest/入口；只有 exact error 证实所属阶段需要时才加窄 `noExternal`、`inline` 或 alias；生产默认不添加 `nitro.externals`。
5. **本地产物**：启动 `.output/server/index.mjs`，请求页面与 Content cache/search，记录 PID、响应体和日志。
6. **远端闭环**：Linux/Vercel 构建、Function artifact、部署 URL、HTTP smoke、运行日志和可见浏览器证据必须分别记录。
7. **状态口径**：缺任何外部门时写 `candidate/needs_check`；只有所有可运行门通过后才写 `verified`，并保留 deployment ID/SHA。

`compatibilityDate` 契约按对象区分：**Nuxt 3 文档站基线与独立 Nitro API** 必须与 `nitro-api-development` 技能保持同一对象契约——同时列出 Cloudflare 与 Vercel 两个平台、各自的官方说明链接，并固定为 `2024-09-19`，不要退化为单字符串；**Nuxt 4 文档站**另有实测值（eams `"2025-05-13"`，字符串形态，见 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md) §7），不覆盖 API 契约。它只代表目标 Nitro provider 的兼容基线，不是 `entities/decode` 或其他 runtime closure 的修复；不要跨世代、跨对象盲抄日期。

文档站 runtime `verified` 与 npm/插件发布是两条独立链路；本技能不把 `changeset`、registry、tarball 或 GitHub Release 的成功当作文档站运行时通过。任务同时要求发布时，另按项目发布技能建立独立证据链。

---

## 既有项目接入判定 runbook

对既有项目（非从零建站）接入本技能时，先按四步判定再动手：

1. **读目标包 `package.json` 判世代**：核对 `nuxt` / `shadcn-docs-nuxt` / `@ztl-uwu/nuxt-content` / `h3` / `nuxt-og-image` 的声明与实际解析版本，判定 Nuxt 3 还是 Nuxt 4 世代；跨世代配置不得盲抄。
2. **是否消费 element-plus**：manifest + 运行时 import **双确认**——部署文档包 manifest 声明且运行时实际导入才算消费；仅传递依赖或提升层可见不算。
3. **recipe 适用性**：[`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md) §4–§6 是条件准入配方——只有 exact error 验证 SSR/Nitro 闭包**真缺包**才用 inline 表，不整表照抄；条件不满足保持最小模板。
4. **Nuxt 3 留守 vs Nuxt 4 迁移决策门**：
   - 依据：当前世代稳定性、§1 已验证矩阵、项目对 Nuxt 4 能力的真实需求；
   - 风险：布局 `app/` 迁移（§10）+ 别名重验 + fork patch 重做；
   - 回滚：独立分支 + lockfile 快照，可整体回退；
   - 验收：三环境无假阳性复核 + G10 跨应用对照（双应用共存时）。

**部署通道判定**（随上述决策一并给出）：

- **Vercel Git-integration 云端自建 = 默认通道**（push 即部署，最简）；
- **CI prebuilt 仅作「本地 Windows 产物直传」的 scoped fallback**，不得泛化到云端自建（见 nuxt4-upgrade §9）；
- **CF Worker 通道**独立验收（workerd 运行时，Content API 假阳性同样存在）。
- ipx `routeRules`：Vercel 非 Git 通道必需；Git-integration 与本地为可选回退（Git-integration 下 @nuxt/image 走 `/_vercel/image`，见 nuxt4-upgrade §7）；**content API 内容断言全通道必须**，HTTP 200 不足为证。

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
5. `ogImage: { enabled: false }`（Nuxt 3/4 均默认禁用；Nuxt 3 直接启用会触发 500，Nuxt 4 路径见 [`references/nuxt4-upgrade.md`](references/nuxt4-upgrade.md)）
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
12. 基础设施先行绕配置问题：闭包缺包 500 未穷尽配置级单变量实验，就先加 CI prebuilt workflow、断开 Git 或更换部署通道。
13. 混淆变量归因：修复与基础设施变更同时落地，把绿灯归功于新通道/新层，不补单变量对照就固化基础设施。

---

## 输出要求

执行本技能时，最终至少给出：

1. 关键改动文件列表（配置、样式、内容）
2. 运行与构建验证结果
3. 若有风险项，给出下一步最小补救建议
4. 明确状态是 `verified`、`candidate` 还是 `needs_check`，并列出未完成的 provider/浏览器证据门
5. **裁决变更四处同日同步**：裁决发生变更时，同日同步四处——报告头部速览 + 尾章、本技能、memorix、记忆索引。中间态必须显式标注「历史中间态，不得作现行态引用」并附阅读指南（案例：升级报告 §0 速览漏同步导致误读中间态为现行态）。
