# 2026-09-05 agent browser 使用经验调查报告

> **报告执行工具**：ZCode（主代理）+ 内置 Explore 子代理 ×4
> **报告执行模型**：GLM-5.3-Flash（builtin:bigmodel-start-plan/GLM-5.3-Flash）
> **调查动机**：`ai-plugins/dev-skills/skills/use-agent-browser` 新技能的前置调研（对应 `docs/prompts/release-ai-plugins/02.md` 任务 089）
> **调查方法**：4 个只读探索子代理串行挖掘四个目标项目；主代理负责 monorepo 检索、memorix CLI 跨项目作用域检索与汇总。本环境子代理并发上限为 1，且 Agent 工具不可指定 terra/sol/luna 模型，全部子代理均为内置模型串行执行。

## 调查结论速览

1. **四个目标项目都没有已落地的 agent-browser 技能**，经验全部散落在事故报告、OpenSpec 工件、`record-bug-fix-memory` 案例文件和 memorix 记忆里。WorkBuddy common 目录有一份 265 行的《agent-browser 使用指南》，但它是文档转写（安装/配置为主），不含实战坑。
2. **实战经验最丰富的是 SmallAliceWeb**：一份完整的 agent-browser 专项事故复盘（`reports/2026-8-24-use-agent-browser/`）沉淀了 7 条标准操作 SOP、分离诊断模型和 5 条「建议写入全局技能」的改进清单——这份改进清单正是本次新技能最直接的输入。
3. **Windows 是坑的重灾区**：Chrome 自动启动 exit code 3 / daemon EOF、PowerShell inline eval 生成 0 字节脏文件、`set viewport` 命令名、`--` 参数透传给 Nuxt 等问题反复出现。
4. **gzpc-big-screen 只有一次 agent-browser 实战记录且是失败**（可见会话启动超时），但它沉淀了一套高度成熟的 Chrome DevTools MCP/CDP 可见浏览器验收方法论（smoke→分批矩阵→fullscreen、视口锁定、等待策略表、截图纪律、headless 禁令），可直接映射移植。
5. **进程治理是 WorkBuddy 目录独有的高价值经验**：agent-browser 在 WorkBuddy 下 = `node agent-browser.js mcp --tools all` → `agent-browser-win32-x64.exe`（每实例一个独立 Chromium），与 prewarm 池归属绑定，催生了 `cleanup-agent-team-node-processes` 技能 v1.4.x。
6. 验收证据已形成稳定范式：**目标元素视口截图 + 人工判读为最小视觉证据**；`naturalWidth` 只证明加载；生产验收记录八要素；快照与截图互补（opacity 隐藏的 DOM 骗得过截图、骗不过 a11y 快照）。

## 调查范围与方法

| 对象                                | 方式                                                                                                                  | 关键词                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| D:\code\ruan-cat\SmallAliceWeb      | Explore 子代理全仓挖掘（含 openspec、reports、prompts、skills、skills-lock）                                          | `agent-browser` / `agent browser` / `agent_browser` / `AgentBrowser` |
| D:\code\ruan-cat\eams-component-lib | Explore 子代理全仓挖掘（含 old/、git 历史 -S）                                                                        | 同上                                                                 |
| D:\code\ruan-cat\gzpc-big-screen    | Explore 子代理全仓挖掘（含 .workbuddy memory、docs/superpowers）                                                      | 同上                                                                 |
| D:\store\WorkBuddy\2026-6-30-common | Explore 子代理目录结构摸底 + 全量检索（含 prewarm/daemon 线索）                                                       | 同上 + `prewarm` / `daemon`                                          |
| 本 monorepo                         | rg 检索 docs、.agents、ai-plugins、AGENTS.md、scripts                                                                 | 同上                                                                 |
| memorix                             | CLI 多作用域检索（monorepo、SmallAliceWeb、eams-component-lib、gzpc-big-screen、WorkBuddy common），BM25 全文检索模式 | `agent-browser` 等                                                   |

## 一、SmallAliceWeb：经验密度最高的项目

### 1.1 命中规模

28 个文件命中（另确认 `skills-lock.json` 未登记 agent-browser 技能，项目 `.agents/skills/` 下无 agent-browser 专项技能）。核心载体：

- `reports\2026-8-24-use-agent-browser\2026-08-24-agent-browser-local-chrome-and-route-incident.md` — **专项事故复盘**（本地 Chrome 启动链路 + 路由 404 + 视觉验收链路错误的五连失败链 + 7 条 SOP）
- `reports\2026-9-5-learn-inkeep-agents-repo\learn-agents-ui\plan.md` 第十二章 — 完整可复现的「Agent-Browser 视觉验证流程」（安装 → 六步验证 → 报告模板 → 自动化脚本）
- `reports\2026-9-5-fix-shadcn-docs-nuxt\README.md` — dev 四层故障事故，含启动失败降级、CDP 探针、12 条误区自我批判
- `docs/superpowers/specs/2026-08-20-ai-chat-completion-attention-design.md` — 验收规范：统一用 agent-browser CLI 并**先读 core skill**
- `openspec/changes/archive/` 下多个 change 的 tasks/agent-progress/agent-findings/evidence

### 1.2 工具优先级（用户硬性约束）

来自 `prompts/index.md`（L93-94、L313）：

> 1. 优先用 agent-browser 来完成浏览器层面的自我验收。优先用这个实现低 token 的消耗使用。
> 2. 如果确实不行，你才考虑备选的谷歌浏览器 MCP。

「agent-browser 一等、Chrome DevTools MCP 备选、不行才降级」被写进了多份 spec 验收标准（`docs/superpowers/specs/2026-07-22-ai-chat-packages-design.md` 等）。

### 1.3 标准命令链路

来自 `reports/2026-9-5-learn-inkeep-agents-repo/learn-agents-ui/plan.md`（第十二章 L2262-2302）：

```log
agent-browser open http://localhost:5173
agent-browser wait --load networkidle
agent-browser screenshot --full baseline-default-light.png
agent-browser snapshot -i
agent-browser click @e1
agent-browser wait --time 1000
agent-browser screenshot ai-chat-panel-default.png
agent-browser eval "<读取 CSS 变量的脚本>"
agent-browser close
```

该章还配了验证报告模板（12.3：记录 agent-browser 版本、场景/状态/截图三列）和自动化 bash 脚本（12.4：`grep -oP '@e\d+' snapshot.txt` 自动解析 ref，找不到按钮即 `agent-browser close && exit 1`）。注意：该链路转写自 2026-09-05 时的源材料，其中 `wait --time 1000` 写法在当前 CLI 已失效（实测 `wait` 只接受裸毫秒参数 `wait 1000`），复用时以 `agent-browser skills get core` 当前输出为准。

### 1.4 Windows 本机 Chrome CDP 接管（项目沉淀的首选路径）

来自 `reports/2026-8-24-use-agent-browser/2026-08-24-agent-browser-local-chrome-and-route-incident.md`（§4.2）：

> 直接启动 `C:\Program Files\Google\Chrome\Application\chrome.exe`，使用独立临时 profile 和明确的 `--remote-debugging-port`，再由 `agent-browser --cdp <port>` 接管。该方案的优点是可证明浏览器来源、避免碰触用户日常 profile、允许可见窗口验收；缺点是需要显式管理本次启动的 Chrome 进程和 profile 目录。后续应把它固定为 Windows 本地视觉验收的首选路径。

实战佐证：`openspec/changes/archive/2026-8-23-fix-emf/evidence/2026-08-24-svg-quality-audit.md`（CDP 端口 9228 接管，枚举 26 张图片、目标图滚入视口截图）。

### 1.5 坑与教训（五连失败链摘要）

来自事故复盘 §2：

| 失败点                 | 现象                                        | 结果                                 |
| ---------------------- | ------------------------------------------- | ------------------------------------ |
| 验收标准过窄           | 只检查 `img.naturalWidth` 和文字可见        | 漏掉 EMF 重复图层、错位、裁断        |
| 本地路由改写           | 擅自去掉用户给定 `.html` 并百分号编码后访问 | VitePress 404，浪费调试时间          |
| 默认启动器失败         | 指定本机 Chrome 后 exit code 3 / daemon EOF | 浏览器来源和证据链一度不清           |
| PowerShell inline eval | 把 `\|\|`、箭头函数、对象字面量塞进命令串   | 生成 3 个 0 字节脏文件 + eval 失败   |
| EOF 被弱化             | 返回 daemon EOF 但子命令碰巧完成            | 结果可用但过程不可靠，不能当标准流程 |

其他关键教训：

- **URL 不得自行改写**（同报告 §3）：用户给出 URL 先原样拼接打开；失败后才按证据提出替代路径。
- **分离诊断**（同报告 §4.3）：`doctor` Launch test 失败、daemon EOF、typed MCP `open` 无响应，只能证明**新建/接管链路异常**，不能证明现存会话不可读；先以最小探针（`get url`、图片枚举、`scrollintoview`、`screenshot`）验证现存会话。
- **启动失败重试纪律**（`reports/2026-9-5-fix-shadcn-docs-nuxt/README.md` M10）：agent-browser 自动启动 Chrome 反复 exit 3，重试 8 次以上才切换降级路径——「同一方法重复失败超过 2 次就应换本质不同的方案」这条纪律当时执行得太晚。
- **降级路径**（同报告附录 L219）：`chrome --headless=new --remote-debugging-port=<port>` + `agent-browser connect <port>`。
- **console 捕获不可靠** → playwright-core `connectOverCDP` 直连 CDP，用 `Network.requestWillBeSent` 的 `initiator.url` 精确定位导入链（定位到 mermaid chunk 导入了 dayjs）。
- **SSR 时机坑**（plan.md 12.5）：VitePress SSR 模式下 `eval` 可能取不到客户端注入的 CSS 变量，需确保客户端渲染完成后执行。
- **命令名坑**（`.agents/skills/fix-bug/record-bug-fix-memory/2026-09-05-ai-vue-doc-local-dev-fix.md` 经验 7）：设置视口的命令是 `set viewport <w> <h>`，不是 `set-viewport`；验收必须桌面视口（`hidden md:flex` 类容器窄视口本就不渲染）。
- **typed MCP 超时**（`openspec/changes/archive/2026-08-24-build-ai-chat-packages/agent-progress.md`）：`agent_browser_open` 等待 300 秒超时；Nuxt 与 VitePress 均复现后，决策改用 Chrome DevTools 证据并在 findings 保留失败路径，**不再重复等待**。

### 1.6 事故报告 §7 的技能改进清单（未落地的直接诉求）

来自 `reports/2026-8-24-use-agent-browser/...incident.md`：

> 建议后续更新全局 `agent-browser` 技能或其 Windows 附录：
>
> - 给出 PowerShell 安全传递复杂 `eval` 的可复制方式，避免 Bash heredoc 示例被生搬硬套。
> - 增加「用户给定 URL 不得自行去扩展名、编码或改写」的视觉验收规则。
> - 增加 Windows 本机 Chrome CDP 接管模板，以及默认启动器 `doctor` 失败后的明确止损路径。
> - 将视觉验收最小证据固定为「目标图视口截图 + 人工判读」，明确 `naturalWidth` 只证明加载状态。
> - 增加「新建浏览器与现存会话分离诊断」章节。

### 1.7 验收证据范式

- **三层验收链路**（事故复盘 §5）：转换层（Vitest/fixture）→ 本地页面层（本机 Chrome + 视口截图）→ 生产页面层（同路径复验 + 部署 SHA），层层不可互相替代。
- **生产验收记录八要素**（§6 标准 6）：浏览器可执行程序、CDP 端口/会话类型、精确 URL、截图路径、部署 ID、提交 SHA、图片加载统计、视觉结论。
- **流式四状态**（`.agents/skills/fix-bug/record-bug-fix-memory/2026-09-01-vercel-project-binding-production-browser-closure.md`）：「请求已发出」「来源已渲染」「取消成功」「完整回答完成」必须按证据逐项报告，HTTP 200 不得替代完整回答流结论。
- **验证口径四件套**（`reports/2026-9-5-fix-shadcn-docs-nuxt/README.md` §9）：状态码 + 标题/正文断言 + 水合判定 + 桌面视口截图 + 至少一个交互闭环，缺一不可。
- **证据 supersede**（`openspec/changes/archive/2026-08-31-ai-rag-phase2/tasks.md`）：验收证据带「修复前 / 已被后续验收取代」标记，避免过期证据误导。
- **截图存档惯例**：统一落系统临时目录（如 `C:\Users\pc\AppData\Local\Temp\<任务前缀>-*.png`），证据文件以表格记录样本页面/统计/截图路径/结论。

## 二、eams-component-lib：CLI 链路与验收规格化

命中 12 个文件，全部集中在 2026-08-31 / 2026-09-01 的 Vercel Nitro runtime closure 修复链。归纳要点：

- **CLI 模式链路**（非 MCP 工具前缀）：`agent-browser doctor` 探测 → `--args '--no-sandbox'` 启动可见 Chrome → 打开 URL → snapshot 取 a11y 树 → `@ref` 定位点击 → 检查 browser errors 为空。出处：`docs/reports/2026-9-1-archive-openspec/2026-09-01-archive-openspec-recheck.md`。
- **Windows Chrome 默认启动失败（exit code 3）**：显式加 `--args '--no-sandbox'` 后成功；报告建议「固化浏览器启动参数，避免再次把工具启动失败误判为站点失败」（同上 ：96-98）。
- **PowerShell 引号坑**（同上 ：65）：ref 写成 `'@e15'`（单引号）后点击成功——PowerShell 下 `@e15` 裸写可能被解析。
- **`--` 透传坑**（同上 ：9-14）：`pnpm --filter <pkg> dev -- --port 3100` 实际把 `--` 也传给了 Nuxt（`nuxt dev "--" "--port" "3100"`），导致上一版报告错误结论「全部路由 NuxtWelcome」并撤回——**被测服务的启动参数坑会直接污染浏览器验收结论**。
- **验收规格化**：agent-browser 可见浏览器证据被写成 OpenSpec SHALL 条款（`openspec/changes/archive/2026-09-01-fix-vercel-nitro-runtime-closure/specs/vercel-nitro-runtime-closure/spec.md`：READY、单次 200 或本地 curl 不得替代完整链路；Vercel READY 但浏览器请求失败时任务保持未完成）。验收能力命名为 `vercel-artifact-e2e-verification`（proposal.md）。
- **预览域名受保护**：Vercel 预览 URL 打开的是保护页，不能作为应用通过证据（agent-findings.md F5）。
- **未完成项**：移动 viewport 的菜单展开、四栏访问和组件页浏览尚未完成 agent-browser 证据（同上 ：88-94）；「把 --no-sandbox 写进 smoke 脚本」的建议未落地。

## 三、gzpc-big-screen：一次失败 + 一套可移植方法论

- **唯一直接命中**：`openspec/changes/implement-linkage-collaboration/agent-findings.md` —「agent-browser 可见浏览器会话启动超时，当前只能依赖 DevTools smoke；如果后续必须做完整可见 Chrome 验收，需要换一条可稳定启动的浏览器路径」。属未解决待办。
- **项目内最核心资产**：`.agents/skills/chrome-mcp-visual-workflow/SKILL.md` — 完整的浏览器联调 SOP：核心原则 → 三类任务（原型视觉分析/接口按钮模拟/dev-preview 双向对比）→ 执行节奏（smoke → 分批矩阵 → 单独 fullscreen）→ 截图位置纪律 → 实例管理纪律 → 工具调用表 → Headless 禁令 → 借口反制表 → 完成检查清单（10 项）。工具名可一一映射到 agent-browser。
- **等待策略表**（`docs/reports/2026-7-6-use-chrome-devtools/best-practices.md`）：首屏 ≥8s（Loading 3-4s + GSAP 入场 2-3s + 渲染稳定）、路由切换 ≥5s、刷新 ≥6s；`Page.loadEventFired` 对动画大屏不可靠，固定视口后等 8-9 秒再读 DOM 几何。
- **headless 三禁**（`.agents/skills/fix-bug/record-bug-fix-memory/2026-06-29-playwright-headless-cpu-overload.md`）：无头 Chromium + GSAP 呼吸动效 + ECharts Ring3D + Three.js WebGL（无 VSync 限制、以最高帧率运行）= CPU 死亡螺旋；`reducedMotion: 'reduce'` 只冻结 CSS 动画，冻不住 JS 驱动动画；禁止 `gsap.globalTimeline.progress(1)` 和手动覆盖 `element.style.opacity`（下一 tick 被重新覆盖），正确做法是等自然完成 + `pause()` + `ticker.sleep()`。用户原话：「禁用无头浏览器！卡死了！」→ Playwright 视觉测试方案整体弃用（`docs/reports/2026-06-29-playwright-visual-testing-abandoned.md`）。
- **截图时机过早 = 假故障**（`2026-06-29-chrome-devtools-screenshot-timing-misjudgment.md`）：未固定视口、未等 loading、未等动画就截图，把过早截图当成真实渲染失败，险些启动大量组件重构。
- **快照 ≠ 视觉证据**（`docs/superpowers/agent-findings.md`）：loading 遮罩 `opacity: 0` 隐藏后，a11y snapshot 仍能读到文本节点——DOM 可访问性树与视觉截图要分开判定。
- **截图纪律**（chrome-mcp-visual-workflow SKILL.md ：92-107）：默认放 `%TEMP%`，路径含任务名/时间戳/来源（dev、preview、production、fullscreen），默认压缩 JPEG，任务结束前删除，不写入仓库。
- **WebGL 陷阱**：headless WebGL 黑地图（headless 下 WebGL 未初始化，属环境限制不一定是回归）；`readPixels` 可能返回透明样本，截图像素采样才是更强的非空断言。
- **console 静默降级信号**：`Series funnel is used but not imported.` 属于静默图表降级，必须看 console 而不只是截图像素。
- **CDP 直连实操**（`docs/reports/2026-7-3-number-libs/mcountcard-entry-route-switch-verification.md`）：临时目录装 `chrome-remote-interface` + 本地 Chrome `--remote-debugging-port=9222` 完成截图与 DOM 采样。

## 四、WorkBuddy 2026-6-30-common：安装链路与进程治理

### 4.1 唯一专题文档

`2026-7-22-use-agent-browser/index.md`（265 行）：仓库地址（github.com/vercel-labs/agent-browser、agent-browser.dev）、4 种 CLI 安装方式、MCP 配置与 8 个 profiles（core/network/state/debug/tabs/react/mobile/all）、场景化启动参数（日常推荐 `--tools core,network,state,tabs`）、skills 批量安装（`npx skills add https://skills.sh/b/vercel-labs/agent-browser`、`agent-browser skills list/get/path`）、快速 CLI 示例、Chrome Profile 复用与会话持久化（`--session my-session --restore`、`agent-browser session id --scope worktree --prefix myapp`）、doctor/upgrade。**注意：它是文档转写而非实战复盘，无坑记录。**

### 4.2 真实安装流水（index.md 任务 19）

```log
pnpm i -g agent-browser
skills add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y -a claude-code -a codex -a cursor -a antigravity -a trae -a qoder
```

MCP 配置：`{"command": "agent-browser", "args": ["mcp", "--tools", "all"]}`。

### 4.3 进程拓扑与 prewarm 池（本项目独有）

来自 `docs/reports/2026-08-09-任务管理器进程归属调查报告.md`：80 进程（57 node.exe + 12 WorkBuddy.exe + 8 npx.exe + 3 agent-browser-win32-x64.exe）全部溯源到 WorkBuddy daemon，**不是泄漏，是 4 个 prewarm 池并存的设计代价**（约 1.6 GB）。进程链：

```log
WorkBuddy (32648) → sidecar (10892) → MCP server (32212)
  → cmd.exe /C node bin/agent-browser.js mcp --tools all
    → node agent-browser.js
      → agent-browser-win32-x64.exe mcp --tools all   ← 每实例一个独立 Chromium
```

关键结论：agent-browser 是 Electron 应用，每个 node 端实例拉起一个独立 Chromium；数量多 ≠ 泄漏；关非活跃池要保留当前对话 attach 的那个。

### 4.4 治理红线

来自 `2026-7-11-close-nodejs/2026-07-11-close-nodejs-orphan-processes.md`：

> 可见 Chrome/CDP 验收、Playwright、浏览器 MCP、临时 Chrome profile、remote debugging port 都可能在超时、中断或脚本失败后残留。……独立浏览器实例必须登记 remote-debugging-port、user-data-dir、PID、owner 和关闭策略；默认不要用 headless Chromium 做视觉或性能验收；先做最小 smoke，再做矩阵和 fullscreen；结束前复查调试端口、Chrome PID 和临时 profile 目录；只能关闭自己启动或明确获得授权的浏览器实例。

来自 `.workbuddy/memory/2026-09-05.md`（GUI 拉起类 CLI 红线）：agent 循环执行 10 条 `code --disable-extension`，2 分钟新增约 41 进程致机器卡死。对 agent-browser 的直接推论：**每个实例拉起独立 Chromium，绝不能循环批量调用**。

### 4.5 MCP 配置类坑

- `NODE_OPTIONS` 注入（`.workbuddy/memory/2026-07-05.md`）：WorkBuddy 给子进程注入 `NODE_OPTIONS=--use-system-ca`，是 MCP 起不来的根因之一。
- 配置声明 ≠ 运行时拉起（`docs/plan/2026-9-2-mavis-MiniMax-Code-bug/`）：mcp.json 声明了 agent-browser 等 7 个非内置 MCP 且 enabled，但 runtime 状态库无任何 MCP 表、无子进程——排查要下钻四层：磁盘配置 → runtime 状态 → 主进程子进程列表 → MCP 本身。
- 清理边界（`2026-7-31-why-neonctl-not-end/`）：agent-browser 等 MCP 服务不是清理事故进程时的目标。

### 4.6 实操空白

该目录内**没有**用 agent-browser 截图/快照完成验收的实战报告；操作层经验（等待、iframe、中文输入、SPA 路由）零记录——这些空白由其他项目补齐。

## 五、monorepo 内部发现

- `ai-plugins/common-tools/skills/cleanup-agent-team-node-processes/SKILL.md`（v1.4.2）：agent-browser 残留进程治理的对外分发技能，覆盖 `agent-browser.exe`、`agent-browser-cli.exe`、`agent-browser-win32-x64.exe`、WorkBuddy prewarm 池归属、单池单清理、禁 Force 等门禁。新技能的进程治理章节应引用它而不是重复实现。
- `ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/references/ssr-hydration.md` §2.4：浏览器接入降级路径表（exit 3 → `--no-sandbox` / 手动 headless=new + connect / console 捕获不可靠 → connectOverCDP / `set viewport` 命令名）。
- `.agents/skills/fix-bug/record-bug-fix-memory/2026-09-01-init-shadcn-docs-nuxt-vercel-runtime-closure.md`：可见浏览器证据闭环案例。
- `docs/prompts/release-ai-plugins/02.md`：任务 089 即本次任务（2026-9-5 ZCode 正在做）。
- 全局技能 `C:\Users\pc\.agents\skills\agent-browser\SKILL.md`（来源 vercel-labs/agent-browser）：本身是 discovery stub，要求动手前先 `agent-browser skills get core` 读取版本匹配的完整指南——新技能必须保留这个「以 CLI 自带内容为最终权威」的设计。

## 六、memorix 记忆检索结果

- **monorepo / gzpc-big-screen / WorkBuddy common / eams-component-lib** 作用域：`agent-browser` 均无命中（eams 提示无项目可见记忆）。
- **SmallAliceWeb** 作用域命中 8 条，详情已取回，高价值条目：

| Ref      | 类型   | 标题                                           | 要点                                                                                                                                                                 |
| -------- | ------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| obs:5595 | GOTCHA | Agent Browser eval 要避免 PowerShell 运算符    | 复杂 eval 引号错误生成 3 个 0 字节未追踪文件；用简单 function/count/get 或 base64/stdin 入口；执行后 git status 复查并精确删除                                       |
| obs:5600 | GOTCHA | Windows 本地 Chrome 验收避免路由与 daemon 误判 | URL 原样；chrome.exe 独立临时 profile + `--remote-debugging-port` + `--cdp` 接管；目标图视口截图人工查看；daemon 出错先 doctor/close/restart                         |
| obs:5652 | GOTCHA | Google Chrome 连接器未运行                     | 用户要求用自己的 Chrome（扩展 + Native Messaging 模式）；Chrome 未运行时 browser-client 返回 "Browser is not available"，**按技能要求不能擅自启动 Chrome**，等待用户 |
| obs:5720 | GOTCHA | AI RAG 继续执行的浏览器与额度门禁              | Vercel inspect READY 与本地 strict validate 不能替代浏览器门禁；agent_browser headed/headless 启动均挂起约 60s 被终止，不能据此声称页面通过                          |
| obs:5736 | CHANGE | 最新 Production Chrome/CDP 回归通过            | `--args --no-sandbox` 完成真实生产验收：页面加载、/v1/search 200、/v1/chat 流式、停止后内容与来源保留、锚点跳转，截图落 OpenSpec evidence                            |
| obs:5851 | FIX    | phase3 归档证据未包含截图的根因                | agent-browser 截图默认存 `C:\Users\pc\.agent-browser\tmp\screenshots`（仓库外）；要版本化需用户确认后复制进 archive/evidence 并单独提交                              |

## 七、综合归纳：坑的分类清单

| 类别       | 具体坑（均有一手出处）                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 启动失败类 | exit code 3 / 无 DevToolsActivePort（Chrome 152）；daemon EOF；typed MCP `agent_browser_open` 300s 超时与 60s 挂起；gzpc 可见会话启动超时（未解决）；Chrome 连接器模式要求 Chrome 已运行 |
| Windows 类 | PowerShell inline eval 生成 0 字节脏文件；`@e15` 需引号包裹；命令名 `set viewport`（非 `set-viewport`）；`--` 透传给 Nuxt 污染验收结论                                                   |
| 等待类     | 动画大屏 loadEventFired 不可靠（需 8-9s）；GSAP/Three.js 冻结无效且危险；截图过早 = 假故障；SSR 下 eval 取不到客户端变量                                                                 |
| 证据类     | `naturalWidth` 只证明加载；全页缩略图不等于目标图证据；a11y 快照能读到 opacity 隐藏 DOM；console 静默降级（ECharts 未注册 series）；预览域名保护页不是应用证据；READY ≠ 运行成功         |
| 进程类     | 每实例一个独立 Chromium；循环批量调用致 CPU 卡死；prewarm 池归属 daemon；残留必须登记端口/PID/profile；MCP 常驻服务不是清理目标                                                          |
| 行为类     | 擅自改写用户 URL；验收标准过窄；同一方法失败 8+ 次才换方案；把部分证据包装成完整成功                                                                                                     |

## 八、对 use-agent-browser 技能的设计输入

1. **主干 SOP**：SmallAliceWeb 事故复盘 §6 的 7 条标准操作 + §4.3 分离诊断模型，作为技能核心章节。
2. **命令速查**：learn-agents-ui plan.md 第十二章（含脚本）+ WorkBuddy 指南（profiles/session/restore/doctor/upgrade）。
3. **Windows 专章**：exit code 3 / `--no-sandbox` / CDP 接管 / headless=new 降级 / PowerShell eval 纪律 / `set viewport` 命令名。
4. **失败分流**：分离诊断（现存会话 vs 新建链路）+ 最小探针 + 「同一方法失败 ≥2 次换本质不同方案」+ 降级链（`--no-sandbox` → CDP 接管 → headless=new + connect → Chrome DevTools MCP）。
5. **等待与动画**：viewport 先行、等待表、JS 动画用 eval 轮询数值、headless 禁令（映射 gzpc 方法论）。
6. **证据规范**：最小视觉证据定义、生产验收八要素、流式四状态、截图落临时目录、证据 supersede。
7. **进程治理**：close 收口、禁循环批量、登记端口/PID/profile、指向 `cleanup-agent-team-node-processes` 技能。
8. **权威来源**：保留「先 `agent-browser skills get core`」设计，CLI 自带内容永远版本匹配，避免技能内容过期。
9. **待验证项如实标注**：gzpc 启动超时、typed MCP 长时间无响应、console 捕获可靠性——技能中按「已知问题 + 降级路径」表述，不假装已解决。

## 九、未尽事项

- memorix 检索受 BM25 关键词匹配限制，其他项目作用域可能存在以「浏览器」「截图」等中文词记录的相邻经验未召回。
- `docs/prompts/release-ai-plugins/02.md` 中任务 089 的「2026-9-5 沟通」小节为空，由用户自行补录本次沟通结论。
- 新技能本体的落地与同步（skill-registry / README / CHANGELOG）在本报告之后执行，见当次会话交付。
