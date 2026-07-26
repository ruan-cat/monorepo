---
name: cleanup-agent-team-node-processes
description: |-
  当 Windows 或 PowerShell 的 agent team 会话结束后，出现疑似残留 node / npx / Windows 命令处理程序 / agent browser 浏览器或 CLI 进程、可证明归属当前 run 的残留 MCP 或开发服务器子进程、残留监听器，或多代理自动化后的进程归属不清时使用。
  Use when Windows or PowerShell agent-team sessions leave suspected stale node, npx, Windows command processor, agent-browser browser or CLI processes, stale MCP or dev-server children provably owned by the current run, lingering listeners, or unclear process ownership after multi-agent automation.
metadata:
  version: "1.2.0"
user-invocable: true
---

# 清理 Agent Team 残留进程

## 概述

在 Windows / PowerShell 环境中，高强度调用 agent team 后，如果怀疑残留了可归属当前 run 的 `node.exe`、`npx.exe`、Windows 命令处理程序 / 包装器（如 `cmd.exe`、`powershell.exe`、`pwsh.exe`、`conhost.exe`）、agent browser 浏览器进程（如 `chrome.exe` / `msedge.exe` / `chromium.exe`）或 agent browser CLI 进程，请在安装后的 skill 目录内使用本技能。

核心原则是：先审计，生成进程归属台账，再只清理可复核、可解释、已明确收窄范围的进程。

本技能用于 agent team 运行后的事后清理，不用于日常进程管理。

第一判断不是“有没有目标进程名”，而是资源消耗是否确实来自当前 agent run 的残留进程。若高 CPU、磁盘或内存来自 `Code.exe`、`rg.exe`、`tsserver.js`、文件 watcher、AI 索引器、Windows Defender、构建产物或缓存目录，应转为 VSCode 排除规则、搜索索引、文件监听、TypeScript Server、Defender 排除项或缓存治理，不执行清理。

## 安全规则

- 默认先执行 dry-run。脚本默认模式只输出 JSON 进程归属台账，不停止任何进程。
- 禁止按 `node.exe`、`npx.exe`、`cmd.exe`、`powershell.exe`、`pwsh.exe`、`conhost.exe`、浏览器进程名、包装器命令或单一关键词批量杀进程。
- 先诊断资源来源，不先 kill。不是当前 agent run 残留进程的问题，就不要套用本技能清理。
- 判断归属时要同时看 PID、PPID、`CommandLine`、`ExecutablePath`、`CreationTime`、工作目录线索、监听端口、父进程是否仍存活，以及 agent 关键词命中情况。
- Agent run 归属必须能回到 runId、sessionId、父 agent、任务名、checkpoint、执行日志、trace、失败重试 / scheduled retry、人工确认记录、监听端口、PPID 和命令行中的多个证据点；只有一个线索时只能记为待审计。
- 证据缺失时要降低置信度。工作目录无法安全读取时，保留为未解析线索，不要编造确定性结论。
- 清理前必须保存执行日志、checkpoint 位置和 dry-run 台账。涉及监听端口、长期服务关键词、父进程仍存活或归属不清的高风险停止，必须先取得人工确认。
- 只有显式传入 `-Apply`、足够窄的 `-IncludePattern`，并保存 `-OutputPath` 台账时，才允许调用 `Stop-Process`。
- `-Force` 只能作为第二道门：普通停止路径失败后，且 PID 仍然可复核时才使用。
- 保护长期服务：MCP gateway、工具市场、记忆服务、监控服务、定时任务、queue worker、SSE / chat session、RAG / vector 服务、IDE / 编辑器扩展宿主、用户明确保留的开发服务器和包管理器后台任务默认不清理。
- 清理后必须重新采样目标 PID 和监听端口，确认结果后再说环境已清理。

## 工作流程

1. 先诊断资源来源并定义清理范围，不要一上来碰进程。
   - 先区分资源来源是 `node.exe`、`Code.exe`、`rg.exe`、`tsserver.js`、watcher、AI 索引器、Windows Defender，还是构建产物 / 缓存目录引起的扫描。
   - 如果不是当前 agent run 遗留的残留进程，转去治理 `files.exclude`、`search.exclude`、`files.watcherExclude`、TypeScript Server 内存 / watch 配置、Defender 排除项或缓存清理。
   - 刚结束的是哪一次 agent team 运行？
   - 哪个 runId、sessionId、父 agent、任务名、checkpoint、日志片段、trace、失败重试 / scheduled retry、人工确认记录、工作区或命令片段能识别本次任务拥有的进程？
   - 哪些长期运行的开发服务器、编辑器、包管理器或终端任务必须排除？

2. 生成进程归属台账。

```powershell
powershell -ExecutionPolicy Bypass -File scripts/agent-team-node-cleanup.ps1 -OutputPath .\agent-process-ledger.dry-run.json
```

脚本默认审计这些目标进程名：`node.exe`、`npx.exe`、`cmd.exe`、`powershell.exe`、`pwsh.exe`、`conhost.exe`、`chrome.exe`、`msedge.exe`、`chromium.exe`、`agent-browser.exe`、`agent-browser-cli.exe`。如需收窄审计范围，可显式传入 `-ProcessName node.exe,cmd.exe`；这只影响台账采样范围，不会绕过候选阻断规则。

3. 在执行清理前，逐行复核台账。

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
| `ParentAlive`                 | 父进程已不存在的候选项，更可能是孤儿进程。                                                                                                                         |
| `AgentKeywordMatches`         | 辅助判断归属，包含 `agent-browser`、`agent_browser`、`playwright`、`remote-debugging-port` 等线索，但不能单独作为清理依据。                                        |
| `AgentBrowserEvidence`        | 浏览器进程专用证据，至少需要 agent browser / Playwright / profile / run / session / workspace 等线索配合 include 或工作目录，普通 Chrome / Edge 默认不会成为候选。 |
| `SafetyIssues`                | 自动清理的阻断原因。                                                                                                                                               |

`Summary.NodeProcessCount` 保留兼容旧台账；新台账应优先看 `Summary.TargetProcessCount` 和 `Summary.ProcessNameCounts`。

脚本字段之外，还要在本次执行记录里补充 agent run 维度证据：runId / sessionId、父 agent 或父任务、checkpoint、日志位置、trace、失败重试 / scheduled retry 状态、人工确认结论、端口用途、PPID 链路和完整命令行。补不齐这些证据时，不要把进程升级为可清理候选。

4. 只有收窄候选列表后，才允许执行清理。

```powershell
powershell -ExecutionPolicy Bypass -File scripts/agent-team-node-cleanup.ps1 -IncludePattern "run-id-fragment|session-id-fragment|workspace-fragment|task-token" -ExcludePattern "vite|next|storybook|mcp|gateway|tool-market|memory|monitor|cron|scheduler|queue|sse|rag|vector|extensionHost|tsserver|keep-alive" -MinAgeMinutes 30 -OutputPath .\agent-process-ledger.apply.json -Apply
```

脚本会拒绝没有 `-IncludePattern` 或没有 `-OutputPath` 的 `-Apply`，并拒绝只用进程名或 `agent`、`agent-browser`、`playwright`、`codex` 等宽泛关键词作为 include。这样可以强制留下可复核台账，避免误触发宽泛清理。

只有第二道门才使用强制终止：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/agent-team-node-cleanup.ps1 -IncludePattern "run-id-fragment|session-id-fragment|workspace-fragment|task-token" -ExcludePattern "vite|next|storybook|mcp|gateway|tool-market|memory|monitor|cron|scheduler|queue|sse|rag|vector|extensionHost|tsserver" -MinAgeMinutes 30 -OutputPath .\agent-process-ledger.force.json -Apply -Force
```

5. 复核重新采样结果。
   - 确认 `Verification.RemainingCandidatePids` 为空；如果不为空，逐个解释剩余 PID。
   - 如果终端、编辑器或 MCP 运行时仍然明显变慢或噪音很大，再跑一次 dry-run 台账。
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

其他进程都会保持为 `audit-only` 或 `excluded`。

## 常见错误

| 错误做法                                                           | 修正方式                                                                        |
| :----------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| agent team 结束后杀掉所有 `node.exe`、命令处理程序或浏览器进程。   | 先生成台账，再复核归属证据。                                                    |
| 把 VSCode、搜索、TS Server 或 Defender 的高占用当成残留进程。      | 先定位资源来源；不是当前 agent run 残留时转配置治理。                           |
| 把包装器关键词当作唯一证据。                                       | 组合命令行、父进程状态、年龄、路径、端口和 include/exclude 范围一起判断。       |
| 只看父进程不存在就清理。                                           | 继续核对 runId、sessionId、checkpoint、日志、trace、端口、PPID 链路和人工确认。 |
| 误伤 MCP gateway、记忆、监控、队列、SSE、RAG / vector 或定时任务。 | 把长期服务加入排除规则；高风险停止必须先人工确认。                              |
| 忽略监听端口。                                                     | 记录端口，并判断它是残留服务还是有意保留的开发服务器。                          |
| 不保存证据就运行 `-Apply`。                                        | 始终使用 `-OutputPath`，保证清理前后的台账可复核。                              |
| 不重新采样就宣称清理完成。                                         | 检查脚本的 `Verification` 区块，或清理后重新执行 dry-run。                      |

## 资源索引

| 路径                                  | 用途                                    |
| :------------------------------------ | :-------------------------------------- |
| `scripts/agent-team-node-cleanup.ps1` | Windows PowerShell 审计与门禁清理脚本。 |
