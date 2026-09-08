---
name: use-agent-browser
description: >-
  规范化使用 agent-browser（AI 浏览器自动化 CLI/MCP）完成页面打开、元素交互、截图取证与 Web 调试：
  安装与 doctor 诊断、open/snapshot/@ref 工作流、等待与视口策略、Windows 启动失败降级链
  （--no-sandbox、CDP 接管、headless 连接）、会话与登录态管理、截图证据规范与进程收口。
  当需要打开网页、浏览器自我验收、视觉验证、E2E 冒烟、前端页面调试、登录态操作，
  或用户提到 agent-browser、agent browser、浏览器自动化、snapshot 截图取证时使用。
  Use when driving the agent-browser CLI/MCP for browser acceptance, visual verification,
  web debugging, or Windows startup-failure fallbacks.
user-invocable: true
metadata:
  version: "1.1.1"
---

# use-agent-browser

## 概述与边界

- agent-browser 是基于 Chrome/CDP 的浏览器自动化 CLI（同名 MCP 形态为 `agent_browser_*` 工具族），通过可访问性快照与 `@eN` 元素引用驱动页面操作。
- 本技能规定执行纪律、失败分流与证据规范；命令细节以 CLI 自带内容为最终权威，动手前先运行 `agent-browser skills get core`（内容随安装版本下发，永不过期）。
- 工具优先级：agent-browser 为浏览器验收一等工具；确实不可用时才降级到 Chrome DevTools 类 MCP，并在记录中保留失败路径。
- 边界：不承担残留进程的批量清理（遵循 `cleanup-agent-team-node-processes` 技能，如已安装）；不承担视觉回归测试框架建设（无头像素对比方案在动画密集页面上已证伪）。

## 渐进式加载地图（references）

SKILL.md 只保留入口纪律；以下参考文件按需加载，全部位于本技能目录内：

| 文件                                       | 内容                                                                                                                                             | 何时加载                               |
| :----------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------- |
| `references/command-cookbook.md`           | 命令手册：安装自检、标准工作流、会话/profile 与 MCP 工具集选择、Windows 接管与降级配方、等待与调试配方、受控验收 mock、速查表                    | 执行命令前不确定写法，或需要配方模板时 |
| `references/verification-templates.md`     | 验收与报告模板：视觉验证报告、生产验收八要素、流式四状态、smoke→矩阵→fullscreen 节奏、三层验收链路、验证口径、证据 supersede、工件登记、截图命名 | 需要产出验收记录或写报告时             |
| `references/cases-windows-startup.md`      | 案例集：exit code 3、分离诊断、CDP 接管、headless 降级、Chrome 连接器、typed MCP 超时、实例可用性预检                                            | Windows 启动/连接失败分流时            |
| `references/cases-evidence-misjudgment.md` | 案例集：加载≠视觉、截图时机、快照≠截图、READY/200/保护页、console 第一信号、流式部分成功、单样本外推、归档缺图、URL 改写、移动视口门禁           | 下验收结论前自检证据强度时             |
| `references/cases-waiting-animation.md`    | 案例集：headless CPU 炸弹、动画冻结无效、load 不可靠、等待策略表、SSR 诊断链、WebGL 假象                                                         | 被测页面含动画/SSR/WebGL 时            |
| `references/cases-shell-tooling.md`        | 案例集：PowerShell eval 脏文件、@eN 引号、`--` 透传、set viewport 命令名、wait 写法时效、参数固化、hash 路由入口形态                             | shell 层写法存疑或 eval 失败时         |
| `references/cases-process-governance.md`   | 案例集：进程拓扑与 prewarm 池、循环批量卡死、登记红线、清理边界、归属误判、配置≠拉起、三态归属                                                   | 涉及进程归属、残留或清理决策时         |

## 不可跳过纪律

1. **先读 core，再动手。** 首次使用或升级后，先 `agent-browser skills get core`；任务超出普通网页（Electron 应用、Slack、探索性测试）时按需 `agent-browser skills get electron|slack|dogfood`。
2. **URL 原样使用。** 用户给定的 URL 禁止自行去后缀、编码、改写或「优化」；精确 URL 失败后，记录 HTTP 状态与路由证据，再提出受证据约束的替代路径。
3. **安装后先自检。** `agent-browser install`（Linux 追加 `--with-deps`）；`agent-browser doctor` 通过再进入验收；`agent-browser upgrade` 处理版本漂移。
4. **证据落临时目录。** 截图默认写入系统临时目录并带任务前缀与来源命名（dev / preview / production），不写入仓库；确需版本化证据时，经用户确认后复制进对应 evidence 目录并单独说明。
5. **同一方法失败 ≥2 次即换本质不同的方案**，按启动失败分流链推进，禁止原地反复重试。
6. **部分证据不包装成完整成功。** 流式回答、登录、取消等链路按状态逐项报告；HTTP 200、READY、加载统计不得替代完整链路结论。

## 标准工作流

```log
agent-browser open <URL>
agent-browser wait --load networkidle
agent-browser get title                # 防 404：读标题确认页面真实加载
agent-browser snapshot -i              # 交互快照，取 @eN 元素引用
agent-browser click @e1                # 或 fill @e2 "text"、select、press
agent-browser wait 1000                # 固定等待用裸毫秒参数，不是 --time
agent-browser screenshot <task-prefix>-<step>.png
agent-browser eval "简单表达式"
agent-browser close                    # 任务结束必须收口
```

- 每次导航后：等待 → 读标题 → 再操作，不连续盲操作。
- 视觉判定必须将目标元素滚动到视口后截图并实际查看；`naturalWidth`、资源加载数只证明加载状态。
- 命令细节与配方模板见 `references/command-cookbook.md`。

## 会话、profile 与登录态

- 命名会话：`--session <name>`；恢复状态：`--session <name> --restore`；稳定会话 ID：`agent-browser session id --scope worktree --prefix <app>`。
- 复用用户 Chrome profile：`--profile <name>`（涉及用户数据，先获得授权）。
- Chrome 连接器模式（用户本机 Chrome + 扩展 + Native Messaging）：Chrome 未运行时连接器返回 "Browser is not available"——等待用户打开 Chrome 或明确授权启动，不得擅自拉起用户浏览器。

## Windows 专属规则

- **自动启动失败（exit code 3 / 无 DevToolsActivePort）**：为会话追加 `--args "--no-sandbox"` 后重试一次。
- **首选接管路径（本机 Chrome 视觉验收）**：显式启动本机 Chrome（独立临时 profile + `--remote-debugging-port=<port>`），再 `agent-browser --cdp <port>` 接管。可证明浏览器来源、不碰用户日常 profile、允许可见窗口；代价是必须登记并清理本次 Chrome 进程与 profile。
- **headless 降级**：手动 `chrome --headless=new --remote-debugging-port=<port>` + `agent-browser connect <port>`。动画密集页面（GSAP / Three.js / ECharts 循环动画）禁止 headless——JS 驱动动画不受 `reducedMotion` 冻结，无头模式以最高帧率运行会打满 CPU。
- **命令名**：设置视口是 `set viewport <w> <h>`（带空格，不是 `set-viewport`）；验收统一桌面视口，响应式隐藏容器（`hidden md:flex` 等）在窄视口本就不渲染。
- **PowerShell eval 纪律**：禁止把 `||`、箭头函数、对象字面量等复杂脚本塞进命令行串（会被错误拆解、生成 0 字节脏文件）。改用：简单表达式、`get count` / `get attr` 等细粒度命令，或 CLI 提供的 stdin / base64 传参入口；执行后运行 `git status` 复查并精确删除本次产生的临时文件。`@e15` 形式的引用在 PowerShell 中用引号包裹。
- **启动参数透传**：给被测 dev server 传参时确认 `--` 是否被包管理器正确转发（曾出现 `pnpm --filter <pkg> dev -- --port 3100` 把字面 `--` 传给 Nuxt 的事故），启动参数错误会直接污染浏览器验收结论。

逐案细节见 `references/cases-windows-startup.md` 与 `references/cases-shell-tooling.md`。

## 启动失败分流（分离诊断）

1. **先区分两类状态**：`doctor` Launch test 失败、daemon EOF、typed MCP `open` 无响应，只证明新建/接管链路异常，不证明现存会话不可用。
2. **最小探针验证现存会话**：`get url`、元素计数、`scrollintoview`、`screenshot`——探针通过就继续用现存会话完成任务。
3. **降级链**（按序执行，每步失败记录证据）：追加 `--no-sandbox` → CDP 接管（`--cdp <port>`）→ 手动 headless=new + `connect` → 切换 Chrome DevTools 类 MCP 并保留 agent-browser 失败路径。
4. **daemon EOF 处置**：先 `doctor` / `close` / 重启会话；EOF 后子命令偶然成功不算可靠流程，不得作为标准路径记录。
5. **typed MCP 长时间无响应**（曾实证等待 300 秒超时）：记录失败路径后立即切换证据来源，不重复等待。

## 等待与稳定性策略

| 场景            | 策略                                                                                                                                                              |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 普通页面导航    | `wait --load networkidle` + 读标题                                                                                                                                |
| 明确元素出现    | `wait_for_selector`；固定间隔用 `wait 1000`                                                                                                                       |
| 动画 / 大屏页面 | 先 `set viewport 1920 1080`，再等 loading 消失与入场动画自然完成（首屏 8s 量级）；用 `eval` 轮询 DOM 数值序列判断稳定，不靠截图时机猜                             |
| JS 驱动动画     | 禁止 `progress(1)`、手动覆盖 style 强行复位（会被下一 tick 重新覆盖）；等待自然完成后 `pause()` / 停帧                                                            |
| SSR 页面 eval   | 客户端变量在水合完成后才可取；「无错且不水合」时用 `!!document.querySelector('#__nuxt').__vue_app__` 判定挂载，动态 `import(entrySrc + '?v=diag')` 抓真实模块错误 |

- 快照与截图互补判定：`opacity: 0` 等视觉隐藏的 DOM 仍会进入可访问性快照；结构判定用快照、视觉判定用截图，两者不一致时分开记录。
- WebGL canvas：headless 下可能黑屏或读到透明像素，属环境限制；截图像素采样强于 `readPixels`。

动画与 SSR 的完整诊断案例见 `references/cases-waiting-animation.md`。

## 截图与验收证据规范

- **最小视觉证据** = 目标元素滚动到视口 + 截图 + 执行者实际查看截图。全页缩略图、加载统计只能作辅助证据。
- **生产验收记录八要素**：浏览器可执行程序、CDP 端口/会话类型、精确 URL、截图路径、部署 ID、提交 SHA、加载统计、视觉结论。缺一项就补齐后再下结论。
- **流式/长任务四状态**：请求已发出 / 中间产物已渲染 / 取消成功 / 完整结束——按证据逐项报告，不把前一项包装成后一项。
- **证据时效**：新验收完成后，在工件中标注旧证据已被取代（superseded），避免过期证据误导后续执行。
- **console 是第一信号**：视觉症状先查 console；ECharts 等「静默降级」只有 console 提示（如 series 未注册），截图像素看不出来。

模板见 `references/verification-templates.md`；误判案例见 `references/cases-evidence-misjudgment.md`。

## 网络与调试

- 请求列表、console、页面错误：优先用 CLI 的 network / console / errors 子命令；`errors --clear` 清空后再复验。
- console 捕获不可靠或需要导入链定位时：playwright-core `connectOverCDP` 直连 CDP，监听 `Network.requestWillBeSent` 取 `initiator.url` 定位真实导入方，避免修错依赖。
- 接口验证记录 method、URL、status、关键响应字段；只捕获本轮触发的请求。破坏性接口、写数据接口、登录态操作先确认目标环境与影响范围。

## 进程与残留治理

- 任务结束执行 `agent-browser close`；结束前复查：调试端口、浏览器 PID、临时 profile 目录、临时截图。
- 每个实例拉起一个独立 Chromium：**禁止循环批量启动**，避免在用户开发时段高频拉起 GUI 类进程。
- 本机接管的 Chrome 实例必须登记 `--remote-debugging-port`、`user-data-dir`、PID 与关闭策略；只能关闭自己启动或获得授权的实例。
- 疑似残留进程的审计与清理遵循 `cleanup-agent-team-node-processes` 技能（如已安装）；常驻 MCP 服务不是清理目标。

归属判断依据与典型案例见 `references/cases-process-governance.md`。

## 常见错误对照表

| 错误做法                                   | 修正方式                                        |
| :----------------------------------------- | :---------------------------------------------- |
| 改写用户给定 URL 后访问                    | 原样打开；失败后按证据提出替代路径              |
| 只用 `naturalWidth` 判定视觉通过           | scrollintoview + 视口截图 + 实际查看            |
| doctor 失败就断定页面有问题                | 分离诊断：最小探针验证现存会话                  |
| 同一启动命令反复重试 5 次以上              | 失败 ≥2 次切换降级链                            |
| PowerShell 里拼复杂 inline eval            | 简单命令或 stdin / base64；事后 git status 复查 |
| 未固定视口、未等动画就截图下结论           | 先 set viewport，按等待策略表执行               |
| 动画大屏用 headless 跑像素对比             | 强制可见浏览器；先 smoke 再矩阵                 |
| 把 Vercel READY / 预览域名保护页当应用证据 | 生产域名 + 浏览器实操作为证据                   |
| 任务结束不 close、不复查端口               | close + 复查端口/PID/profile/临时截图           |
| 截图直接写进仓库                           | 默认临时目录，版本化需用户确认                  |

## 完成自检清单

- 已按 `agent-browser skills get core` 的版本匹配内容执行。
- 每次导航有等待 + 标题确认，无盲操作。
- 视觉结论有目标元素视口截图，并已实际查看。
- 启动失败走了分流链，且每步有记录。
- 生产验收记录八要素齐全。
- 会话已 close，端口/PID/profile/临时截图已复查。
- 记录中区分了事实、推断与未验证项。

## 相关文件

本技能为纯文档技能，无附属脚本。参考层为 `references/` 目录（命令手册、验收模板、五组实战案例集），加载时机见「渐进式加载地图」。命令语法以 `agent-browser skills get core` 的输出为最终权威；残留进程治理见 `cleanup-agent-team-node-processes` 技能（如已安装）。
