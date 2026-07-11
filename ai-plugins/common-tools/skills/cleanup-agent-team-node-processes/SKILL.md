---
name: cleanup-agent-team-node-processes
description: |-
  当 Windows 或 PowerShell 的 agent team 会话结束后，出现疑似孤儿 node 进程、残留 MCP 或开发服务器子进程、残留 Node 监听器，或多代理自动化后的 Node 进程归属不清时使用。
  Use when Windows or PowerShell agent-team sessions leave suspected orphan node processes, stale MCP or dev-server children, lingering Node listeners, or unclear Node ownership after multi-agent automation.
metadata:
  version: "1.0.0"
user-invocable: true
---

# 清理 Agent Team 孤儿 Node 进程

## 概述

在 Windows / PowerShell 环境中，高强度调用 agent team 后，如果怀疑残留了孤儿 `node.exe` 进程，请在安装后的 skill 目录内使用本技能。

核心原则是：先审计，生成进程归属台账，再只清理可复核、可解释、已明确收窄范围的进程。

本技能用于 agent team 运行后的事后清理，不用于日常进程管理。

## 安全规则

- 默认先执行 dry-run。脚本默认模式只输出 JSON 进程归属台账，不停止任何进程。
- 禁止按 `node.exe`、包装器命令或单一关键词批量杀进程。
- 判断归属时要同时看 PID、PPID、`CommandLine`、`ExecutablePath`、`CreationTime`、工作目录线索、监听端口、父进程是否仍存活，以及 agent 关键词命中情况。
- 证据缺失时要降低置信度。工作目录无法安全读取时，保留为未解析线索，不要编造确定性结论。
- 只有显式传入 `-Apply`、足够窄的 `-IncludePattern`，并保存 `-OutputPath` 台账时，才允许调用 `Stop-Process`。
- `-Force` 只能作为第二道门：普通停止路径失败后，且 PID 仍然可复核时才使用。
- 清理后必须重新采样目标 PID 和监听端口，确认结果后再说环境已清理。

## 工作流程

1. 先定义清理范围，不要一上来碰进程。
   - 刚结束的是哪一次 agent team 运行？
   - 哪个工作区、命令片段、MCP 名称或工具关键词能识别本次任务拥有的进程？
   - 哪些长期运行的开发服务器、编辑器、包管理器或终端任务必须排除？

2. 生成进程归属台账。

```powershell
powershell -ExecutionPolicy Bypass -File scripts/agent-team-node-cleanup.ps1 -OutputPath .\node-ledger.dry-run.json
```

3. 在执行清理前，逐行复核台账。

需要重点检查这些字段：

| 字段                          | 为什么重要                                                |
| :---------------------------- | :-------------------------------------------------------- |
| `Pid` / `ParentPid`           | 判断父子进程关系和孤儿状态。                              |
| `CommandLine`                 | 区分 agent worker、MCP 服务、包脚本和用户开发服务器。     |
| `ExecutablePath`              | 确认 Node 二进制路径，避免假设所有 Node 都可以清理。      |
| `CreationTime` / `AgeMinutes` | 避免停止刚生成、仍在工作的进程。                          |
| `WorkingDirectoryHint`        | 当命令行带有 cwd 相关参数时，辅助判断进程属于哪个工作区。 |
| `ListeningPorts`              | 标出开发服务器或 MCP transport，需要人工复核。            |
| `ParentAlive`                 | 父进程已不存在的候选项，更可能是孤儿进程。                |
| `AgentKeywordMatches`         | 辅助判断归属，但不能单独作为清理依据。                    |
| `SafetyIssues`                | 自动清理的阻断原因。                                      |

4. 只有收窄候选列表后，才允许执行清理。

```powershell
powershell -ExecutionPolicy Bypass -File scripts/agent-team-node-cleanup.ps1 -IncludePattern "codex|agent|mcp|workspace-fragment" -ExcludePattern "vite|next|storybook|keep-alive" -MinAgeMinutes 30 -OutputPath .\node-ledger.apply.json -Apply
```

脚本会拒绝没有 `-IncludePattern` 或没有 `-OutputPath` 的 `-Apply`。这样可以强制留下可复核台账，避免误触发宽泛清理。

只有第二道门才使用强制终止：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/agent-team-node-cleanup.ps1 -IncludePattern "codex|agent|workspace-fragment" -ExcludePattern "vite|next|storybook|mcp" -MinAgeMinutes 30 -OutputPath .\node-ledger.force.json -Apply -Force
```

5. 复核重新采样结果。
   - 确认 `Verification.RemainingCandidatePids` 为空；如果不为空，逐个解释剩余 PID。
   - 如果终端、编辑器或 MCP 运行时仍然明显变慢或噪音很大，再跑一次 dry-run 台账。
   - 如果已停止的 PID 重新出现，检查父级服务，不要重复盲目清理。

## 候选规则

内置脚本只有在所有安全检查通过后，才会把进程标记为 `candidate`：

- 它是 `node.exe` 进程；
- 它不是当前 PowerShell 进程、脚本宿主进程，也不在当前父进程链上；
- 它的存活时间达到 `-MinAgeMinutes`；
- 它至少命中一个 `-IncludePattern`；
- 它没有命中任何 `-ExcludePattern`；
- 它的父进程已经不存在；
- 它没有监听 TCP 端口。

其他进程都会保持为 `audit-only` 或 `excluded`。

## 常见错误

| 错误做法                               | 修正方式                                                                  |
| :------------------------------------- | :------------------------------------------------------------------------ |
| agent team 结束后杀掉所有 `node.exe`。 | 先生成台账，再复核归属证据。                                              |
| 把包装器关键词当作唯一证据。           | 组合命令行、父进程状态、年龄、路径、端口和 include/exclude 范围一起判断。 |
| 忽略监听端口。                         | 记录端口，并判断它是残留服务还是有意保留的开发服务器。                    |
| 不保存证据就运行 `-Apply`。            | 始终使用 `-OutputPath`，保证清理前后的台账可复核。                        |
| 不重新采样就宣称清理完成。             | 检查脚本的 `Verification` 区块，或清理后重新执行 dry-run。                |

## 资源索引

| 路径                                  | 用途                                    |
| :------------------------------------ | :-------------------------------------- |
| `scripts/agent-team-node-cleanup.ps1` | Windows PowerShell 审计与门禁清理脚本。 |
