> **何时读**：仅在证据证明一次性 Node CLI 同步 CPU 自旋卡死（无输出、无端口、持续 CPU 增量）、且常规恢复路径无效时；执行前必须完整阅读本文件，不得凭记忆或猜测拼装命令。

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
