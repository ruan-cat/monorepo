# cleanup-agent-team-node-processes 模块化实施计划

## 目标

将 `scripts/agent-team-node-cleanup.ps1` 拆成薄 CLI 入口和同目录私有
PowerShell 文件，降低局部维护的上下文成本；保持参数、JSON 输出、安全门禁和
Windows PowerShell 5.1 兼容。默认 dry-run 仍只输出 stdout，不生成
`agent-process-ledger*.json`。

## 范围与约束

- 仅修改对外分发 skill 内的 `scripts/`、其 `SKILL.md`，以及仓库内对应测试与本计划。
- 不修改全局 skill，不引入 Node、TypeScript、C#、`.psm1` 或额外依赖。
- 不重写 WorkBuddy 识别、监听器判断、停止顺序或候选算法。
- 不执行真实 `-Apply`、不暂存、不提交、不发布。
- `description` 两个自然语言段逐字符保留；仅将 `metadata.version` 从 `1.4.0` 升至 `1.4.1`。
- 入口保留 `[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = "High")]`。

## 目标结构

```text
scripts/
├── agent-team-node-cleanup.ps1
└── lib/
    ├── common.ps1
    ├── process-observation.ps1
    ├── process-topology.ps1
    ├── workbuddy-analysis.ps1
    ├── safety-guards.ps1
    ├── candidate-analysis.ps1
    ├── cleanup-execution.ps1
    └── workflow.ps1
```

入口按以下固定顺序加载，每个文件加载前检查存在性。私有文件不 dot-source
其他私有文件，加载时不采样进程、不输出 JSON、不写文件。

1. `common.ps1`
2. `process-observation.ps1`
3. `process-topology.ps1`
4. `workbuddy-analysis.ps1`
5. `safety-guards.ps1`
6. `candidate-analysis.ps1`
7. `cleanup-execution.ps1`
8. `workflow.ps1`

## 实施任务

### 1. 建立结构契约

文件：`tests/cleanup-agent-team-node-processes/agent-team-node-cleanup-structure.test.ts`、
`tests/cleanup-agent-team-node-processes/vitest.config.ts`。

测试使用 `describe` 和 `test`，并通过 PowerShell AST 验证：

- 八个私有文件精确存在；入口不超过 220 行；每个私有文件不超过 400 行。
- 29 个原函数与 6 个新工作流函数共 35 个定义，且每个函数唯一归属一个模块。
- 单个函数不超过 280 行；所有入口与私有文件无 AST 语法错误。
- 入口仅从 `$PSScriptRoot/lib` 按固定顺序 dot-source；私有模块不 dot-source。

先运行以下 RED 命令，确认旧单文件不满足该结构：

```powershell
pnpm vitest run --project cleanup-agent-team-node-processes agent-team-node-cleanup-structure.test.ts
```

### 2. 机械迁移基础函数

在不改变函数体算法的前提下移动 29 个既有函数：

| 模块                      | 函数                                                                                                                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `common.ps1`              | `Assert-RegexList`、`Convert-CimDate`、`Get-RegexMatches`、`Get-WorkingDirectoryHint`、`Protect-SensitiveCommandLine`、`ConvertTo-ProcessMap`、`Normalize-ProcessNames`                                                                              |
| `process-observation.ps1` | `Read-ProcessObservation`、`Get-ProcessMap`、`Get-TargetProcesses`、`Get-ProcessNameCounts`、`Get-ListeningPortObservation`、`Get-ListeningPorts`、`Get-ProcessExists`、`Get-ProcessCpuSeconds`、`Get-ProcessCpuSamples`、`Test-LiveProcessIdentity` |
| `process-topology.ps1`    | `Get-ProcessFamily`、`Get-AgentBrowserEvidenceMatches`、`Get-ParentPidSet`、`Get-DescendantRecords`、`Get-DirectChildProcesses`                                                                                                                      |
| `workbuddy-analysis.ps1`  | `Get-WorkBuddyPoolId`、`Get-WorkBuddyTopologyInference`、`Build-WorkBuddyGrouping`                                                                                                                                                                   |
| `safety-guards.ps1`       | `Normalize-ApplyScopePattern`、`Assert-ApplyScope`、`Assert-OneShotCommandScope`、`Assert-TemporaryOutputPath`                                                                                                                                       |

`Build-WorkBuddyGrouping` 本轮只迁移，不继续拆分；它仍必须小于 280 行。

### 3. 提取顶层编排

新增六个职责明确的函数：

- `New-CleanupAuditEntries`：候选逐项判定、关键字与 pool PID 映射；不停止进程。
- `New-CleanupLedger`：组装审计对象；不写文件。
- `Invoke-WorkBuddyCleanupPlan`：冻结 WorkBuddy 停止计划，保持 root-first 顺序。
- `Invoke-GeneralCleanupPlan`：执行通用路径的冻结计划。
- `Complete-CleanupVerification`：重采样 remaining 与 respawn；不追杀新 PID。
- `Invoke-AgentTeamNodeCleanup`：唯一工作流，协调采样、分组、候选、可选 Apply、JSON。

入口将 CLI 值显式传给 `Invoke-AgentTeamNodeCleanup`，其中包括当前 `$PSCmdlet`、
`$WhatIfPreference` 与当前 PID。执行层只能使用传入的命令上下文调用
`ShouldProcess`，不得依赖自身 `$PSCmdlet`。

必须保持下列行为顺序：

```text
参数与组合门禁
  -> sampledAt / process observation / CPU sample / listener observation
  -> WorkBuddy grouping 与选择器校验
  -> audit entries / frozen stop plan / ledger
  -> 可选 Apply
  -> remaining / respawn verification
  -> JSON stdout；仅显式 Apply + OutputPath 时写系统临时文件
```

`-Apply -WhatIf` 仍走停止计划和 `ShouldProcess`，但不停止进程；临时台账写入
必须保留 `Set-Content -WhatIf:$false`，并由调用方的 `try/finally` 删除。
所有数组结果用单一对象字段承载，避免 PowerShell 管道自动展开导致 JSON 形状漂移。

### 4. 收缩入口并同步分发说明

入口只包含参数块、`$PSScriptRoot/lib` 加载、缺失模块错误和一次工作流调用。
在 `SKILL.md`：

- 保留 description 原文。
- 版本改为 `1.4.1`。
- 在资源索引加入 `scripts/lib/` 的私有实现说明。
- 不增加本机绝对路径、事故报告路径、仓库测试路径或 CI 路径。

### 5. 验收

依次运行：

```powershell
pnpm vitest run --project cleanup-agent-team-node-processes agent-team-node-cleanup-structure.test.ts
pnpm vitest run --project cleanup-agent-team-node-processes
```

再执行独立 PowerShell AST 检查，确认入口和八个模块无语法错误。将整个 skill
复制到系统临时目录，从无关 cwd 运行 fixture dry-run，以证明仅依赖
`$PSScriptRoot`。运行一次真实 stdout-only dry-run，解析 JSON，并比较执行前后
工作区的 `agent-process-ledger*.json` 数量；默认路径不得新增文件。

最后检查：`git diff --check`、description 哈希、对外 skill 内绝对路径污染、模块
尺寸与函数唯一性。任何一项缺少可复现证据，都不能把这次重构描述为通过验收。
