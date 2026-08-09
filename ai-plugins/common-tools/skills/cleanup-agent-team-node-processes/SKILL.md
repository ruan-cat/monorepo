---
name: cleanup-agent-team-node-processes
description: |-
  Use when Windows or PowerShell agent-team sessions leave suspected stale node, npx, Windows command processor, agent-browser browser or CLI processes, stale MCP or dev-server children provably owned by the current run, lingering listeners, unclear process ownership after multi-agent automation, or unexplained WorkBuddy prewarm pools, MCP subtrees, native agent-browser workers, or shell-snapshot bash processes.
  当 Windows 或 PowerShell 的 agent team 会话结束后，出现疑似残留 node / npx / Windows 命令处理程序 / agent browser 浏览器或 CLI 进程、可证明归属当前 run 的残留 MCP 或开发服务器子进程、残留监听器、多代理自动化后的进程归属不清，或无法解释的 WorkBuddy prewarm 池、MCP 子树、原生 agent-browser worker、shell snapshot bash 进程时使用。
metadata:
  version: "1.4.1"
user-invocable: true
---

# 清理 Agent Team 残留进程

## 概述

在 Windows / PowerShell 环境中，高强度调用 agent team 后，如果怀疑残留了可归属当前 run 的 `node.exe`、`npx.exe`、Windows 命令处理程序 / 包装器（如 `cmd.exe`、`powershell.exe`、`pwsh.exe`、`conhost.exe`）、agent browser 浏览器进程（如 `chrome.exe` / `msedge.exe` / `chromium.exe`）或 agent browser CLI 进程，请在安装后的 skill 目录内使用本技能。

核心原则是：先审计当前命令输出，再只清理可复核、可解释、已明确收窄范围的进程。默认不在当前工作区、仓库或 skill 目录生成进程台账、报告或其他清理产物。

本技能的执行主体是随 skill 分发的 `scripts/agent-team-node-cleanup.ps1` 和 Windows 原生进程信息。AI agent 只负责从当前任务上下文提取窄范围参数、执行脚本并解释结果；不得依赖特定 AI 模型、外部模型 CLI 或模型专属能力完成清理，也不得把清理临时文件的责任留给后续模型。

WorkBuddy 会通过 daemon 启动 prewarm 池，池内再启动命令包装器、Node MCP 服务和原生 agent-browser worker。进程数量多只能触发审计，不能证明泄漏或空闲；本技能按单次不可变进程快照分组。命令行不可见时，脚本只在 daemon→sidecar→MCP server→非 WorkBuddy 子树结构完整且存在同级池分支时输出 `topology-inferred` 中置信度审计对象，不生成虚构的 pool ID。高置信度显式池可用唯一 pool ID 或 PID；中置信度拓扑池只能用精确根 PID。两者都必须在监听器观察成功、子树无保护角色，并由操作者分别确认该池不是当前会话和已经空闲后，才生成停止计划。

本技能用于 agent team 运行后的事后清理，不用于日常进程管理。

第一判断不是“有没有目标进程名”，而是资源消耗是否确实来自当前 agent run 的残留进程。若高 CPU、磁盘或内存来自 `Code.exe`、`rg.exe`、`tsserver.js`、文件 watcher、AI 索引器、Windows Defender、构建产物或缓存目录，应转为 VSCode 排除规则、搜索索引、文件监听、TypeScript Server、Defender 排除项或缓存治理，不执行清理。

## 安全规则

- 默认先执行 dry-run。脚本默认模式只把 JSON 审计结果输出到当前命令的标准输出，不停止进程，也不传 `-OutputPath`。
- 禁止按 `node.exe`、`npx.exe`、`cmd.exe`、`powershell.exe`、`pwsh.exe`、`conhost.exe`、浏览器进程名、包装器命令或单一关键词批量杀进程。
- 先诊断资源来源，不先 kill。不是当前 agent run 残留进程的问题，就不要套用本技能清理。
- 判断归属时要同时看 PID、PPID、`CommandLine`、`ExecutablePath`、`CreationTime`、工作目录线索、监听端口、父进程是否仍存活，以及 agent 关键词命中情况。
- Agent run 归属必须能回到 runId、sessionId、父 agent、任务名、checkpoint、执行日志、trace、失败重试 / scheduled retry、人工确认记录、监听端口、PPID 和命令行中的多个证据点；只有一个线索时只能记为待审计。
- 证据缺失时要降低置信度。工作目录无法安全读取时，保留为未解析线索，不要编造确定性结论。
- WorkBuddy 的会话归属使用 `current` / `not-current` / `unknown` 三态。命令行与可用路径证据均为空、父子拓扑不完整、角色无法识别时保持 `unknown`；不得把创建时间较旧、最近没有新子进程或没有监听端口单独当成 `not-current` 或空闲证明。
- WorkBuddy daemon、sidecar、`codebuddy --serve --mcp-config` MCP server、未知角色、UI / renderer / utility / crashpad / GPU、嵌套 prewarm pool、当前 PowerShell 保护链和通过 `-ProtectedProcessId` 指明的会话链永远不可清理。选中 pool 根之外，只要子树任一层出现这些 WorkBuddy 角色，整池永久 `blocked` 且 `StopPlan` 为空。普通 Git Bash 与 WorkBuddy shell snapshot bash 都只审计，不自动 Apply。
- WorkBuddy Apply 必须用 `-WorkBuddyPoolId` 或 `-WorkBuddyPoolPid` 唯一命中一个池，并同时显式传入 `-ConfirmWorkBuddyPoolNotCurrent` 与 `-ConfirmWorkBuddyPoolIdle`。高置信度显式池可使用 ID 或 PID；`topology-inferred` 中置信度池只接受精确根 PID；低置信度永久阻断。前一个确认只负责会话归属，后一个只负责空闲；只传其中一个不能互相代替，也不能生成候选。脚本不会声称能仅凭进程年龄自动知道当前会话池。
- 监听器观察使用 `known` / `unknown` 两态，结果写入 `ListenerObservation`。`Get-NetTCPConnection` 不可用或查询失败时必须记录 `unknown` 与原因，并用 `listener-observation-unknown` 阻断 Apply；不得把观察失败当成零监听。观察成功后，目标 WorkBuddy 池任一子孙 PID 监听 TCP 端口仍阻断整池清理。
- 原生 `agent-browser-win32-x64.exe` 只有在完整父子拓扑证明其位于选中池内时才进入该池；同名外部进程不进入停止计划。
- 清理前必须在当前会话内核对任务上下文和 dry-run 输出，但默认不持久化为报告。涉及监听端口、长期服务关键词、父进程仍存活或归属不清的高风险停止，必须先取得人工确认。
- 只有显式传入 `-Apply`，并把脚本要求的 `-OutputPath` 指向操作系统临时目录时，才可能调用 `Stop-Process`；通用路径还必须提供足够窄的 `-IncludePattern`，WorkBuddy 路径则必须提供唯一 pool 选择器与显式确认。
- `-Apply`、`-Force` 和卡死恢复使用的临时 JSON 必须在同一段 PowerShell `try/finally` 中删除；命令成功、失败或抛出异常都不得在工作区留下 `agent-process-ledger*.json`。
- `-Force` 只能作为第二道门：普通停止路径失败后，且 PID 仍然可复核时才使用。
- 对仍有直接父 `cmd.exe` 的一次性 Node CLI，默认仍拒绝自动清理。只有已核对常规 dry-run 输出、用户显式开启卡死恢复门禁，并同时证明命令特征、持续 CPU 自旋和无监听端口时，才允许停止 Node 子进程；绝不由此自动停止父 `cmd.exe`。
- 保护长期服务：MCP gateway、工具市场、记忆服务、监控服务、定时任务、queue worker、SSE / chat session、RAG / vector 服务、IDE / 编辑器扩展宿主、用户明确保留的开发服务器和包管理器后台任务默认不清理。
- 清理后必须重新采样目标 PID 和监听端口，确认结果后再说环境已清理。

## 工作流程

1. 先诊断资源来源并定义清理范围，不要一上来碰进程。
   - 先区分资源来源是 `node.exe`、`Code.exe`、`rg.exe`、`tsserver.js`、watcher、AI 索引器、Windows Defender，还是构建产物 / 缓存目录引起的扫描。
   - 如果不是当前 agent run 遗留的残留进程，转去治理 `files.exclude`、`search.exclude`、`files.watcherExclude`、TypeScript Server 内存 / watch 配置、Defender 排除项或缓存清理。
   - 刚结束的是哪一次 agent team 运行？
   - 哪个 runId、sessionId、父 agent、任务名、checkpoint、日志片段、trace、失败重试 / scheduled retry、人工确认记录、工作区或命令片段能识别本次任务拥有的进程？
   - 哪些长期运行的开发服务器、编辑器、包管理器或终端任务必须排除？

2. 审计候选进程，只查看命令输出，不写工作区文件。

```powershell
powershell -ExecutionPolicy Bypass -File scripts/agent-team-node-cleanup.ps1
```

脚本默认审计这些目标进程名：`node.exe`、`npx.exe`、`cmd.exe`、`powershell.exe`、`pwsh.exe`、`conhost.exe`、`chrome.exe`、`msedge.exe`、`chromium.exe`、`agent-browser.exe`、`agent-browser-cli.exe`、`WorkBuddy.exe`、`agent-browser-win32-x64.exe`、`bash.exe`。如需收窄审计范围，可显式传入 `-ProcessName node.exe,cmd.exe`；这只影响审计采样范围，不会绕过候选阻断规则。不要为了“留证”给 dry-run 追加 `-OutputPath`；除非用户明确要求导出，否则标准输出就是本次 dry-run 的完整结果。

WorkBuddy 分组默认包含在 dry-run 中，无需额外开关；命令仍然 stdout-only：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/agent-team-node-cleanup.ps1
```

结果中的 `ListenerObservation` 会先说明监听器查询是否成功；`WorkBuddyGrouping` 会列出 `CoreProcesses`、`PrewarmPools`、每个池的 `DescendantPids`、`RecognitionMethod`、`IdentificationEvidence`、`Confidence`、`SessionState`、`ProtectionReasons`、`Decision` 和 `StopPlan`。显式命令行识别的高置信度池与保守拓扑推断的中置信度池都可以作为审计对象；中置信度池的 `PoolId` 可以为 `null`，只能通过 `-WorkBuddyPoolPid` 精确选择。合法但尚未完成双确认的池保持 `needs-confirmation`；低置信度、监听器观察未知、受保护、含监听器或子树含保护角色的池是 `blocked`。脚本不会自动生成 `candidate-zombie-*`。

3. 在执行清理前，逐行复核 dry-run 输出。

需要重点检查这些字段：

| 字段                          | 为什么重要                                                                                                                                                         |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Pid` / `ParentPid`           | 判断父子进程关系和孤儿状态。                                                                                                                                       |
| `Name` / `ProcessFamily`      | 区分 Node 运行时、命令包装器、agent browser CLI 或浏览器。                                                                                                         |
| `CommandLine`                 | 区分 agent worker、MCP 服务、包脚本和用户开发服务器。                                                                                                              |
| `ExecutablePath`              | 确认 Node 二进制路径，避免假设所有 Node 都可以清理。                                                                                                               |
| `CreationTime` / `AgeMinutes` | 避免停止刚生成、仍在工作的进程。                                                                                                                                   |
| `WorkingDirectoryHint`        | 当命令行带有 cwd 相关参数时，辅助判断进程属于哪个工作区。                                                                                                          |
| `ListeningPorts`              | 标出开发服务器或 MCP transport，需要人工复核。                                                                                                                     |
| `ListenerObservation`         | 区分“已观察且零监听”与“监听查询不可用 / 失败”；后者阻断清理。                                                                                                      |
| `ParentAlive`                 | 父进程已不存在的候选项，更可能是孤儿进程。                                                                                                                         |
| `AgentKeywordMatches`         | 辅助判断归属，包含 `agent-browser`、`agent_browser`、`playwright`、`remote-debugging-port` 等线索，但不能单独作为清理依据。                                        |
| `AgentBrowserEvidence`        | 浏览器进程专用证据，至少需要 agent browser / Playwright / profile / run / session / workspace 等线索配合 include 或工作目录，普通 Chrome / Edge 默认不会成为候选。 |
| `SafetyIssues`                | 自动清理的阻断原因。                                                                                                                                               |
| `WorkBuddyGrouping`           | WorkBuddy 核心链、prewarm 池边界、三态会话归属、置信度、保护原因和单池停止计划。                                                                                   |

`Summary.NodeProcessCount` 是兼容字段；应优先看 `Summary.TargetProcessCount` 和 `Summary.ProcessNameCounts`。

脚本字段之外，还要结合当前会话已有上下文核对 agent run 维度证据：runId / sessionId、父 agent 或父任务、checkpoint、日志位置、trace、失败重试 / scheduled retry 状态、人工确认结论、端口用途、PPID 链路和完整命令行。无需为此新建报告；补不齐这些证据时，不要把进程升级为可清理候选。

4. 只有收窄候选列表后，才允许执行清理。

清理一个已在脚本外确认不属于当前会话且已经空闲的 WorkBuddy pool 时，只使用一个 pool ID 或 PID。Apply 台账仍只放系统临时目录，并在同一段 `finally` 删除：

```powershell
$ledgerPath = Join-Path ([IO.Path]::GetTempPath()) (
  "agent-process-ledger-{0}.json" -f [guid]::NewGuid()
)
try {
  powershell -ExecutionPolicy Bypass `
    -File scripts/agent-team-node-cleanup.ps1 `
    -WorkBuddyPoolId "wb-pool-exact-id" `
    -ConfirmWorkBuddyPoolNotCurrent `
    -ConfirmWorkBuddyPoolIdle `
    -MinAgeMinutes 30 -OutputPath $ledgerPath -Apply
  if ($LASTEXITCODE -ne 0) {
    throw "WorkBuddy pool cleanup failed with exit code $LASTEXITCODE."
  }
} finally {
  Remove-Item -LiteralPath $ledgerPath -Force -ErrorAction SilentlyContinue
}
```

`-ProtectedProcessId` 应传入已知属于当前活动会话的 PID；脚本会保护该 PID 及其祖先链。停止计划固定为：先冻结 PID、名称和 `CreationTime`，停止 pool 根，等待 2 秒，再按深度从叶到根处理原快照中仍存活的子孙。每次停止前重新核对三元组以防 PID 复用；新 respawn 只进入 `Verification.RespawnedProcessPids`，同一批次不追杀。WorkBuddy 路径禁止 `-Force`。

命令行不可见、`RecognitionMethod=topology-inferred` 且 `Confidence=medium` 时，不能填写或猜测 pool ID。先从 dry-run 读取唯一根 PID，再使用相同双确认与临时台账门禁：

```powershell
$ledgerPath = Join-Path ([IO.Path]::GetTempPath()) (
  "agent-process-ledger-{0}.json" -f [guid]::NewGuid()
)
try {
  powershell -ExecutionPolicy Bypass `
    -File scripts/agent-team-node-cleanup.ps1 `
    -WorkBuddyPoolPid 12345 `
    -ConfirmWorkBuddyPoolNotCurrent `
    -ConfirmWorkBuddyPoolIdle `
    -MinAgeMinutes 30 -OutputPath $ledgerPath -Apply
  if ($LASTEXITCODE -ne 0) {
    throw "WorkBuddy topology pool cleanup failed with exit code $LASTEXITCODE."
  }
} finally {
  Remove-Item -LiteralPath $ledgerPath -Force -ErrorAction SilentlyContinue
}
```

```powershell
$ledgerPath = Join-Path ([IO.Path]::GetTempPath()) (
  "agent-process-ledger-{0}.json" -f [guid]::NewGuid()
)
try {
  powershell -ExecutionPolicy Bypass `
    -File scripts/agent-team-node-cleanup.ps1 `
    -IncludePattern "run-id-fragment|session-id-fragment|workspace-fragment|task-token" `
    -ExcludePattern "vite|next|storybook|mcp|gateway|tool-market|memory|monitor|cron|scheduler|queue|sse|rag|vector|extensionHost|tsserver|keep-alive" `
    -MinAgeMinutes 30 -OutputPath $ledgerPath -Apply
  if ($LASTEXITCODE -ne 0) {
    throw "Process cleanup failed with exit code $LASTEXITCODE."
  }
} finally {
  Remove-Item -LiteralPath $ledgerPath -Force -ErrorAction SilentlyContinue
}
```

通用清理路径会拒绝没有 `-IncludePattern` 或没有 `-OutputPath` 的 `-Apply`，并拒绝只用进程名或 `agent`、`agent-browser`、`playwright`、`codex` 等宽泛关键词作为 include。`-OutputPath` 是脚本内部安全门禁，不是要求用户保留报告；必须指向唯一的系统临时文件，并由 `finally` 自动删除。

只有第二道门才使用强制终止：

强制重试必须重新运行上一个完整代码块，以生成新的 `$ledgerPath` 并继续执行相同的 `try/finally`，仅在 `-Apply` 后追加 `-Force`；不要把路径改回当前工作区。

### 已证实卡死的一次性 Node CLI 例外

这一例外只适用于已由证据证明为同步 CPU 自旋的一次性命令，例如 Windows 路径边界导致 `--help`、`--version` 或查询命令在无输出、无端口的情况下持续占用 CPU。它不是网络连接、鉴权、MCP、开发服务器或一般 Node 高 CPU 的清理入口。

先核对常规 dry-run 输出，并在当前会话中确认命令、Node PID、直接父 `cmd.exe` PID、开始时间、CPU 与 stdout/stderr 采样、监听端口和复现证据。确认该命令不应长期运行后，才可执行受限恢复；不要新建独立报告：

```powershell
$ledgerPath = Join-Path ([IO.Path]::GetTempPath()) (
  "agent-process-ledger-{0}.json" -f [guid]::NewGuid()
)
try {
  powershell -ExecutionPolicy Bypass `
    -File scripts/agent-team-node-cleanup.ps1 `
    -Apply -EnableStuckOneShotRecovery `
    -IncludePattern "run-id-fragment|task-token" `
    -OneShotCommandPattern "(?i)cli\.js\s+--help|neonctl.*--help" `
    -ExcludePattern "mcp|gateway|memory|monitor|cron|scheduler|queue|sse|rag|vector|extensionHost|tsserver|vite|next|storybook" `
    -MinAgeMinutes 5 -CpuSampleIntervalSeconds 5 `
    -MinCpuDeltaSeconds 3 -OutputPath $ledgerPath
  if ($LASTEXITCODE -ne 0) {
    throw "One-shot recovery failed with exit code $LASTEXITCODE."
  }
} finally {
  Remove-Item -LiteralPath $ledgerPath -Force -ErrorAction SilentlyContinue
}
```

启用 `-EnableStuckOneShotRecovery` 时，脚本强制要求 `-Apply`、任务级 `-IncludePattern`、带参数而非仅可执行文件名的 `-OneShotCommandPattern` 与 `-OutputPath`。恢复候选必须同时满足：

- 仅为 `node.exe`，直接父进程仍为 `cmd.exe`；
- 子进程和直接父进程的命令行都命中同一条一次性命令模式；
- 达到 `-MinAgeMinutes`，命中 include，不命中 exclude，没有监听端口，也不属于脚本自身父进程链；
- 两次 CPU 采样的增量达到 `-MinCpuDeltaSeconds`；
- 除 `parent-process-alive` 外不存在任何安全阻断项。

候选将以 `candidate-stuck-one-shot` 出现在命令结果中。脚本只先普通终止 Node 子进程；父 `cmd.exe` 未自行退出时必须回到人工审计，不能因为子进程异常而批量终止包装器。`-Force` 仍仅用于该 Node PID 的普通终止失败，不改变父进程处理规则。

5. 复核重新采样结果。
   - 确认 `Verification.RemainingCandidatePids` 为空；如果不为空，逐个解释剩余 PID。
   - 如果终端、编辑器或 MCP 运行时仍然明显变慢或噪音很大，再跑一次不带 `-OutputPath` 的 dry-run。
   - 如果已停止的 PID 重新出现，检查父级服务，不要重复盲目清理。

## 候选规则

内置脚本只有在所有安全检查通过后，才会把进程标记为 `candidate`：

- 它属于 `-ProcessName` 指定的目标进程名；
- 它不是当前 PowerShell 进程、脚本宿主进程，也不在当前父进程链上；
- 它的存活时间达到 `-MinAgeMinutes`；
- 它至少命中一个 `-IncludePattern`；
- 它没有命中任何 `-ExcludePattern`；
- 它的父进程已经不存在；
- 它没有监听 TCP 端口。
- 如果它是 `chrome.exe`、`msedge.exe` 或 `chromium.exe` 浏览器进程，还必须具备 agent browser / Playwright / profile / run / session / workspace 等多证据；普通用户浏览器默认只进入 `audit-only`。
- `candidate-stuck-one-shot` 是受 `-EnableStuckOneShotRecovery` 保护的窄范围例外：只豁免直接父 `cmd.exe` 存活这一项，其他候选门禁全部保留。
- WorkBuddy prewarm 池默认是 `needs-confirmation`，不是候选。高置信度显式池必须由唯一 ID 或 PID 选择；`topology-inferred` 中置信度池必须由精确根 PID 选择；低置信度池永久阻断。选择器、完整年龄证据、监听器观察为 `known` 且零监听、无保护链、子树无任何 WorkBuddy 保护角色，以及 `-ConfirmWorkBuddyPoolNotCurrent` / `-ConfirmWorkBuddyPoolIdle` 双确认同时满足时，池根才成为 `candidate-workbuddy-pool-explicit`；它的子孙只由根的冻结 `StopPlan` 管理，不能各自绕过父进程存活门禁。

除上述 WorkBuddy pool 决策外，其他进程都会保持为 `audit-only` 或 `excluded`。

## 常见错误

| 错误做法                                                                                           | 修正方式                                                                                          |
| :------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| agent team 结束后杀掉所有 `node.exe`、命令处理程序或浏览器进程。                                   | 先生成台账，再复核归属证据。                                                                      |
| 把 VSCode、搜索、TS Server 或 Defender 的高占用当成残留进程。                                      | 先定位资源来源；不是当前 agent run 残留时转配置治理。                                             |
| 把包装器关键词当作唯一证据。                                                                       | 组合命令行、父进程状态、年龄、路径、端口和 include/exclude 范围一起判断。                         |
| 只看父进程不存在就清理。                                                                           | 继续核对 runId、sessionId、checkpoint、日志、trace、端口、PPID 链路和人工确认。                   |
| 误伤 MCP gateway、记忆、监控、队列、SSE、RAG / vector 或定时任务。                                 | 把长期服务加入排除规则；高风险停止必须先人工确认。                                                |
| 忽略监听端口。                                                                                     | 记录端口，并判断它是残留服务还是有意保留的开发服务器。                                            |
| 把监听器查询失败当成没有监听。                                                                     | 检查 `ListenerObservation`；`unknown` 必须阻断，不能解释成空列表。                                |
| 在当前工作区写入 `agent-process-ledger*.json`。                                                    | dry-run 只读标准输出；`-Apply` 的 `-OutputPath` 使用系统临时文件，并在 `finally` 删除。           |
| 把临时台账留给后续 AI 模型清理。                                                                   | 临时文件的创建和删除必须在同一段确定性 PowerShell 中闭环，不依赖模型善后。                        |
| 不重新采样就宣称清理完成。                                                                         | 检查脚本的 `Verification` 区块，或清理后重新执行不落盘的 dry-run。                                |
| 把一次性 CLI 的无输出或高 CPU 当成可直接杀进程的理由。                                             | 先核对 dry-run 与复现证据；只在受限恢复门禁同时命中精确命令、CPU 增量和无端口时停止 Node 子进程。 |
| 因一次性 Node CLI 卡死而停止它的父 `cmd.exe`。                                                     | 只先停止 `candidate-stuck-one-shot` 的 Node PID；父包装器是否退出必须人工复核。                   |
| 把 WorkBuddy 进程年龄或“最近没新子进程”当成僵尸证明。                                              | 年龄只作辅助门禁；会话归属或空闲无法证明时保持 `unknown` / `needs-confirmation`。                 |
| 不传精确 pool 选择器，或一次选多个 pool 就 Apply。                                                 | 每次只用一个 `-WorkBuddyPoolId` 或 `-WorkBuddyPoolPid`，并分别传入非当前会话与空闲双确认。        |
| 只传 `-ConfirmWorkBuddyPoolIdle` 就当成非当前会话。                                                | 空闲确认不改变 `SessionState`；还必须独立传入 `-ConfirmWorkBuddyPoolNotCurrent`。                 |
| 清理 WorkBuddy daemon、sidecar、MCP server、UI / renderer、未知角色、嵌套 pool 或 shell snapshot。 | 选中根之外的 WorkBuddy 角色全部永久保护；普通 Git Bash 和 shell snapshot bash 都只审计。          |
| 给 `topology-inferred` 中置信度池猜测 pool ID，或用非根 PID 清理。                                 | 不生成虚构 pool ID；只允许 dry-run 输出中的精确根 PID，并继续通过双确认与全部安全门禁。           |
| 先杀池内 node/cmd，再让 daemon 继续补拉。                                                          | 先停止 pool 根，等待 2 秒，再按冻结快照从叶到根处理遗留子孙；新 respawn 只报告。                  |

## 完成条件

- 目标 PID 已停止，且 `Verification.RemainingCandidatePids` 为空；未停止的 PID 已逐个说明阻断原因。
- dry-run、清理和恢复流程均未在当前工作区、仓库或 skill 目录生成 `agent-process-ledger*.json`、报告或其他产物。
- 临时 `-OutputPath` 位于操作系统临时目录，并已在同一段 `finally` 中删除。
- 清理决策来自脚本输出和 Windows 进程证据，不依赖具体 AI 模型、外部模型 CLI 或模型生成的报告。
- 受保护的长期服务、用户浏览器、编辑器和开发服务器未被误停。
- WorkBuddy Apply 只影响唯一选中池的冻结子树；核心进程、其他池、UI / renderer、外部 agent-browser、bash 和 PID 复用实例均未进入停止结果，respawn 已单独报告。

## 资源索引

| 路径                                  | 用途                                    |
| :------------------------------------ | :-------------------------------------- |
| `scripts/agent-team-node-cleanup.ps1` | Windows PowerShell 审计与门禁清理脚本。 |
| `scripts/lib/`                        | 入口按固定顺序加载的私有实现模块。      |
