> **何时读**：执行清理前逐条自检；每一条都对应历史踩坑场景，命中任意一条立即停止并回到审计步骤。

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
