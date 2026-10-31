# 传输层故障三岔口：超时模型、拓扑与取证

> use-agent-browser 技能参考层。源于 2026-10-31 一次真实故障的 RCA：agent-browser 0.35.2 在 Windows 上 MCP 工具族全会话 30 秒超时，而 Chrome/CDP 层全程健康、守护进程死亡后被新实例接管——粘死点被钉死在 MCP 传输层。本文件把该故障的分层模型与分流配方沉淀为可执行指导。命令语法以 `agent-browser skills get core` 为最终权威。

## 1. 四层超时模型：先分清是谁在杀你的调用

|        层         |            超时值            |       谁控制        | 说明                                                                             |
| :---------------: | :--------------------------: | :-----------------: | :------------------------------------------------------------------------------- |
| 宿主 MCP 工具调用 |           30s 硬顶           | AI 宿主（如 ZCode） | 参数不可调：显式传 `timeoutMs=120000` 仍报 `timed out after 30000ms`（实测两次） |
| MCP server 每调用 | 120s（`DEFAULT_TIMEOUT_MS`） | agent-browser 包内  | 包内链路本可容忍慢操作                                                           |
| CLI→daemon 读超时 |  `max(操作+10s, 30s)` 下限   | agent-browser 包内  | 随操作类型浮动                                                                   |
|   浏览器 action   |           默认 25s           | agent-browser 包内  | 页面级等待另见等待策略表                                                         |

由此得出三条结论：

1. **MCP 工具 30s 被杀是宿主行为，不是 agent-browser 的配置问题。** 包内链路其实允许到 120s；在 MCP 通道里调包内超时救不了 30s 硬顶。
2. **在 MCP 通道内，任何超过 30s 的合法操作（冷启动页面首次 `open` 等）必然表现为 30s 超时。** 且宿主中止调用后守护进程侧导航可能继续（Chrome 确实拉起并绑定了标签页），「工具超时」不等于「操作没发生」。
3. 官方文档明确 30s 是刻意默认值，盲目调大反而会在慢操作上触发 `EAGAIN`——不要试图用「调大超时」解决，按第 3 节分流。

## 2. 三层进程拓扑：MCP server ≠ daemon ≠ Chrome

|        层        |                            角色                             |                           挂掉的症状                            | 处置                                                                                                                              |
| :--------------: | :---------------------------------------------------------: | :-------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------- |
| MCP stdio server | 宿主与 CLI 之间的翻译层；每次工具调用 spawn 一个 CLI 子进程 | 工具族全灭、一律 30s 超时；跨守护进程换血也不自愈（会话级粘死） | 会话内放弃 MCP 重试，转 CLI / CDP 通道；本会话实测重启 AI 会话（重建 MCP server）后才恢复——粘死内部机制未完全定位，此为经验性处置 |
| 守护进程 daemon  |     常驻进程，每个 `(namespace, session)` 组合一个实例      |    CLI 报 `os error 10061`（连接被拒）/ `10060`（连接超时）     | `doctor`（自动清 stale sidecar）→ `close` → 重启会话                                                                              |
|   Chrome / CDP   |                  真正执行页面操作的浏览器                   |           CDP 端口拒连（`ECONNREFUSED`）、页面无响应            | 自起 Chrome + CDP 直连兜底（见第 3 节第 3 步）                                                                                    |

关键推论：**MCP 超时 ≠ daemon 挂了。** 实测守护进程死亡（旧 pid 不在运行）后被新实例接管同一端口，此后 MCP 依旧 30s 超时——粘死点在 MCP 传输层。由此禁止「MCP 超时就杀 daemon」：daemon 可能正被并发会话使用，且杀掉后会被新实例接管，解决不了 MCP 层问题。

## 3. 三岔口分流决策树（MCP 全灭时按序执行）

**前置红线**：

- 禁止反复重试 MCP 调用——每次白耗 30s，且首个挂起调用可能堵塞整个会话通道（本次实测 7+ 次调用全灭、跨 daemon 换血不自愈）。
- 禁止先杀 daemon——理由见第 2 节关键推论。

**第 1 步：只读取证（不依赖任何 agent-browser 进程）。**

```log
dir %USERPROFILE%\.agent-browser\
type %USERPROFILE%\.agent-browser\default.port
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort <port> -State Listen -ErrorAction SilentlyContinue | Select-Object LocalPort,OwningProcess"
powershell -NoProfile -Command "Get-Process -Id <pid> -ErrorAction SilentlyContinue"
```

判读：`.pid` 对应进程不存在但端口仍有监听 → daemon 已被新实例接管（按端口归属读新 pid）；端口无监听 → daemon 处于死亡窗口。sidecar 文件含义见第 4 节。

**第 2 步：CLI 探活。**

```log
agent-browser --help                    # 不依赖 daemon，先证明 CLI 本体可用
agent-browser doctor --offline --quick  # 本地快诊；doctor 每次运行自动清 stale sidecar
agent-browser get url                   # 走 daemon 链路；报 os error 10061/10060 即 daemon 层故障
```

**第 3 步：CDP 直连兜底（CLI 链路也不可用时）。**

```log
:: 自起 headless Chrome：固定 CDP 端口 + 独立临时 profile，不碰 agent-browser 守护进程
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --remote-debugging-port=9223 --no-first-run --user-data-dir=%TEMP%\ab-cdp-profile about:blank
```

用 Node 22 内置 WebSocket 直连 CDP（无需任何依赖）：`GET http://127.0.0.1:9223/json/list` 取 `webSocketDebuggerUrl`，`Runtime.evaluate` 求值、`Page.navigate` 导航、`Page.captureScreenshot` 截图。CLI 尚可用时也可直接 `agent-browser --cdp 9223 ...` 接管。用后按端口归属精确清理进程与 profile（见 `cases-process-governance.md`），勿批量杀。

**收口口径**：分流全程逐步记录命令与输出；本轮验收以实际走通的通道为准，并在工件中标注「MCP 通道不可用、以 X 证据为准」，让后续会话不再误入重试。

## 4. 状态文件取证：`~/.agent-browser/` sidecar 组

会话状态由 sidecar 文件组登记（`{session}` 为会话名，默认 `default`）：

|        文件         | 含义                                                     |
| :-----------------: | :------------------------------------------------------- |
|   `{session}.pid`   | 守护进程注册时的 pid（不保证仍存活）                     |
|  `{session}.port`   | 守护进程 TCP 监听端口（`127.0.0.1`）                     |
| `{session}.version` | 注册时的 CLI 版本——可据此发现「旧版本 daemon 仍在服役」  |
| `{session}.config`  | 配置指纹哈希                                             |
| `{session}.target`  | 当前绑定标签页（URL 等）——证明 `open` 是否被 daemon 受理 |
| `{session}.stream`  | 运行时流式端口登记                                       |
| `{session}.engine`  | 会话使用的浏览器引擎                                     |

取证纪律：

- 目录内**没有 `.lock` 文件**；守护进程存活判定只看 TCP 端口连通性，无 PID 校验——`.pid` 文件存在不等于进程存活。
- `.port` 缺失时守护进程会回退到哈希端口（49152–65534），存在被无关进程占用的碰撞风险；取证先读 `.port`，读不到时对哈希端口区间内的可疑监听做归属核对。
- 守护进程稳态运行**不落任何磁盘日志**（stderr 仅在早退时读取）——「daemon 为何死」只能靠文件 mtime 考古，报告结论时明确标注推断置信度，不冒充实测结论。
- `doctor` 每次运行自动清理 stale 的 socket/pid/version sidecar；破坏性修复（重装 Chrome、清空旧状态）才需要 `doctor --fix`。

## 5. 版本与 Chrome 复用（0.41.0 起的能力）

- **任务前核查版本**：`agent-browser --version`；低于 0.41.0 先升级（`agent-browser upgrade` 或 `pnpm add -g agent-browser@latest`）。0.35.2 处于上游「守护进程静默挂起」行为段（上游 changelog：waitpid 竞争挂起已修复、daemon 启动错误改为直接上报而非静默挂起）。
- **升级后旧 daemon 可能仍在服役**：daemon 存活判定只看 TCP，CLI 升级不会自动重启已在运行的旧 daemon。读 `{session}.version` sidecar，显示旧版本号即为信号；官方处置是先 `doctor`（明确覆盖「version mismatches after `upgrade`」场景），必要时 `close --all` 后再开新会话。
- **复用现成浏览器**（旗标已对 0.41.0 `--help` 核实）：
  - `--executable-path <path>`（或 `AGENT_BROWSER_EXECUTABLE_PATH`）：指定浏览器可执行文件，不依赖自带下载的 Chrome。
  - `--auto-connect`：发现并接管已运行的 Chrome（浏览器保持外部所有，不归 daemon 进程树）。
  - `--profile <name|path>`：复用 Chrome 登录态或持久化自定义 profile（涉及用户数据，先获得授权）。
  - **MCP 形态限制**：`--executable-path`、`--allowed-domains`、`--args`、`--config` 等改变网络/文件/策略/主机访问的全局旗标在 MCP 工具的 `extraArgs` 中会被拒绝，必须在 MCP server 的环境变量或 config 中设置。
- **Chrome 二进制在线漂移**：`~/.agent-browser/browsers/` 下按版本号组织的目录，其 mtime 可证明下载/切换行为。本次事故窗口内即发生 152 版本二进制下载切换，随后守护进程死亡——长时间任务开始前核对该目录，**避免任务中途触发 `install` / 升级 / 版本切换**；需要固定浏览器来源时用 `--executable-path` 钉死。

## 6. open 前先探活（会话级纪律）

对任何本地 dev server：先 `curl -s -m 5 http://127.0.0.1:PORT/` 确认首屏可快速返回，再 `open`。冷启动页面（首屏按需编译、本地代理错误噪音多）直接 `open` 是踩中宿主 30s 硬顶的典型触发链——daemon 受理了导航、宿主先行中止，MCP 通道还可能被首个挂起调用拖死。冷启动页面改用 `wait --load networkidle` 接管等待，不与 30s 窗口赛跑。

## 7. 已知上游问题

- [Issue #1308「open hangs pre-handshake on Windows 11 (0-byte stdout)」](https://github.com/vercel-labs/agent-browser/issues/1308)：Windows 下首次 `open` 在握手前挂起，把超时从 30s 提到 120s 仍挂——与本技能记录的「MCP 全灭」症状同类。遇到无法解释的 Windows 挂起，先查该 issue 与上游 changelog，再决定升级或走 CDP 兜底，不要原地重试。
