> **何时读**：工作流程步骤 3 逐行复核 dry-run 输出时；逐字段含义与 `Summary` 兼容字段说明以本文件为准。

## dry-run 输出字段字典

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
