# 2026-08-09 cleanup-agent-team-node-processes 模块化设计

## 背景

`scripts/agent-team-node-cleanup.ps1` 已增长到 1717 行，包含 29 个函数和约 648 行顶层编排。当前脚本已经覆盖通用孤儿进程、一次性 Node CLI 卡死恢复、WorkBuddy prewarm 池分组、双确认、监听器阻断、PID 复用防护、冻结停止计划和 respawn 报告等多类行为。

现有实现的主要问题不是 PowerShell 语言能力不足，而是单文件同时承担参数入口、通用工具、进程观测、进程拓扑、WorkBuddy 领域判断、安全门禁、候选判定、清理执行和 JSON 输出。未来 agent 为修改一个局部规则，必须把整份脚本装入上下文，容易遗漏跨区域依赖或误改安全顺序。

## 目标

1. 把单文件拆成薄 CLI 入口和职责单一的私有 PowerShell 脚本。
2. 保持 Windows PowerShell 5.1 兼容，不引入 Node、TypeScript、C# 或额外模块安装依赖。
3. 保持现有 CLI 参数、JSON schema、退出行为和安全门禁兼容。
4. 保持 dry-run 只写标准输出，默认不生成 `agent-process-ledger*.json`。
5. 让未来 agent 可以只读取与目标行为相关的一个或两个文件完成维护。
6. 用结构测试阻止入口和私有模块再次无边界膨胀。

## 非目标

- 不重写 WorkBuddy 识别、会话归属、监听器判断或清理决策算法。
- 不新增候选类型、CLI 参数、JSON 字段或退出码。
- 不把脚本升级成 `.psm1/.psd1` 正式模块。
- 不把脚本改写为 TypeScript、Node 或其他语言。
- 不修改全局安装副本，不执行 Git 提交或插件发布。
- 不重构与本技能无关的 Vitest、插件或仓库配置。

## 方案选择

采用薄 CLI 入口加 `scripts/lib/*.ps1` 定序 dot-source。

选择该方案的原因：

- dot-source 与当前单脚本共享脚本作用域的语义最接近，迁移风险低于 PowerShell 模块作用域。
- Windows PowerShell 5.1 原生可运行，符合清理 Node 异常现场时不依赖 Node 的要求。
- 所有文件继续位于对外 skill 安装目录内部，使用 `$PSScriptRoot` 定位，不依赖 monorepo 路径。
- 现有 Vitest 可以继续通过 CLI 和 JSON 做黑盒验收。

只有出现第二个真实调用入口、需要导出稳定公共 API、需要独立模块版本或需要 PowerShell Gallery 分发时，才重新评估 `.psm1/.psd1`。

## 目标目录

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

入口负责参数声明、加载检查、按固定顺序 dot-source 私有脚本、构造显式调用参数并调用 `Invoke-AgentTeamNodeCleanup`。私有文件不自行 dot-source 其他文件，不在加载时采样进程或产生输出。

## 模块职责

### `common.ps1`

存放无领域副作用的通用转换与文本处理：

- `Assert-RegexList`
- `Convert-CimDate`
- `Get-RegexMatches`
- `Get-WorkingDirectoryHint`
- `Protect-SensitiveCommandLine`
- `ConvertTo-ProcessMap`
- `Normalize-ProcessNames`

### `process-observation.ps1`

存放实时或 fixture 进程观测、目标进程筛选和运行状态采样：

- `Read-ProcessObservation`
- `Get-ProcessMap`
- `Get-TargetProcesses`
- `Get-ProcessNameCounts`
- `Get-ListeningPortObservation`
- `Get-ListeningPorts`
- `Get-ProcessExists`
- `Get-ProcessCpuSeconds`
- `Get-ProcessCpuSamples`
- `Test-LiveProcessIdentity`

### `process-topology.ps1`

存放进程分类、父子链和 agent-browser 证据：

- `Get-ProcessFamily`
- `Get-AgentBrowserEvidenceMatches`
- `Get-ParentPidSet`
- `Get-DescendantRecords`
- `Get-DirectChildProcesses`

### `workbuddy-analysis.ps1`

存放 WorkBuddy 特有的 pool 识别和分组：

- `Get-WorkBuddyPoolId`
- `Get-WorkBuddyTopologyInference`
- `Build-WorkBuddyGrouping`

`Build-WorkBuddyGrouping` 当前约 249 行。本轮只机械迁移，不同时拆函数或修改算法。

### `safety-guards.ps1`

存放 Apply、命令范围和临时输出路径门禁：

- `Normalize-ApplyScopePattern`
- `Assert-ApplyScope`
- `Assert-OneShotCommandScope`
- `Assert-TemporaryOutputPath`

### `candidate-analysis.ps1`

新增内部函数，承接当前逐进程候选判定和台账基础数据构建：

- `New-CleanupAuditEntries`
- `New-CleanupLedger`

该模块只计算审计结果，不调用 `Stop-Process`，不写文件。

### `cleanup-execution.ps1`

新增内部函数，承接冻结停止计划、ShouldProcess、PID 三元组复核、停止顺序、复采样和 respawn 报告：

- `Invoke-WorkBuddyCleanupPlan`
- `Invoke-GeneralCleanupPlan`
- `Complete-CleanupVerification`

是否执行停止仍由现有 `-Apply`、双确认、范围门禁和 `$PSCmdlet.ShouldProcess` 决定。

### `workflow.ps1`

定义唯一顶层工作流 `Invoke-AgentTeamNodeCleanup`，按现有顺序协调：

1. 参数与组合门禁。
2. 进程和监听器采样。
3. WorkBuddy 分组与选择器解析。
4. 候选判定和台账组装。
5. 可选清理执行。
6. 验证结果和 JSON 输出准备。

该函数通过显式参数接收 CLI 值，不依赖隐式全局配置。为保持 `SupportsShouldProcess` 行为，入口将当前 `$PSCmdlet` 作为命令上下文传入执行层；执行层使用该上下文调用 `ShouldProcess`，不自行创建第二套确认语义。

## 固定加载顺序

入口使用 `$PSScriptRoot` 解析并按以下顺序加载：

1. `common.ps1`
2. `process-observation.ps1`
3. `process-topology.ps1`
4. `workbuddy-analysis.ps1`
5. `safety-guards.ps1`
6. `candidate-analysis.ps1`
7. `cleanup-execution.ps1`
8. `workflow.ps1`

入口在 dot-source 前逐个确认文件存在。安装损坏时抛出包含缺失相对模块名的错误，不回退到其他目录，也不尝试从 monorepo 或全局 skill 加载。

## 数据流

```text
CLI 参数
  -> 参数组合与安全门禁
  -> ProcessObservation + ListenerObservation
  -> ProcessTopology + WorkBuddyGrouping
  -> AuditEntries + frozen StopPlan
  -> Ledger
  -> 可选 Apply + PID/名称/CreationTime 复核
  -> RemainingCandidatePids + RespawnedProcessPids
  -> JSON stdout
  -> 仅 Apply 且显式 OutputPath 时写系统临时文件
```

本轮不改变字段名称、数组顺序和停止顺序。对同一 fixture，拆分前后的 JSON 结构和决策结果必须一致。

## 尺寸门禁

- `agent-team-node-cleanup.ps1` 物理行数不超过 220 行。
- 单个 `scripts/lib/*.ps1` 物理行数不超过 400 行。
- 单个函数物理行数不超过 280 行。
- 29 个现有函数在入口和私有脚本中必须各定义一次，不允许复制兼容版本。
- 新增工作流辅助函数必须对应真实职责，不为单次调用创建无意义包装层。

尺寸门禁用于防止职责再次失控，不以压缩换行、删除可读性或把多个职责塞入单个长表达式来规避。

## 测试策略

### RED

在实现前新增结构测试，至少证明当前状态不满足：

- 入口超过 220 行。
- `scripts/lib` 目标文件不存在。
- 入口尚未使用固定 `$PSScriptRoot` 加载清单。

### GREEN

拆分后必须通过：

1. 原有 13 个 WorkBuddy 和 CLI 黑盒测试。
2. PowerShell AST 解析入口与全部私有脚本，且无语法错误。
3. 29 个现有函数名称集合保持一致，每个函数只定义一次。
4. 入口按固定顺序加载八个私有脚本，私有脚本不互相 dot-source。
5. 入口和私有脚本满足尺寸门禁。
6. 将整个 skill 复制到系统临时目录，从与安装目录无关的 cwd 使用 fixture 执行 dry-run，验证 `$PSScriptRoot` 路径正确。
7. dry-run 不传 `-OutputPath`，确认工作区没有新增 `agent-process-ledger*.json`。
8. 真实 stdout-only dry-run JSON 可解析，`ListenerObservation.Status` 有明确值。

结构测试继续放在仓库的 `tests/cleanup-agent-team-node-processes/`，不写进对外分发 skill 的资源索引。

## SKILL.md 处理

- 中英文 `description` 原样保留，不压缩、不改写触发条件。
- 正文现有清理流程和安全规则原样保留，不因脚本拆分迁移到仓库内部文档。
- `metadata.version` 从 `1.4.0` 调整为 `1.4.1`，表示分发结构和维护性修正，不宣称新增清理能力。
- `资源索引` 增加 `scripts/lib/` 私有实现说明，示例仍只调用 `scripts/agent-team-node-cleanup.ps1`。
- 不暴露本机绝对路径、WorkBuddy 报告路径、仓库测试路径或 CI 路径。

## 风险与控制

### PowerShell 作用域变化

把顶层代码放进函数会改变变量作用域。控制方式是显式参数传递、统一返回对象，并通过 fixture 黑盒测试验证 JSON 和决策结果。禁止让新模块依赖偶然存在的调用方局部变量。

### `ShouldProcess` 语义变化

入口继续保留 `[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = "High")]`。执行函数接收入口的 `$PSCmdlet`，所有停止动作继续通过同一个命令上下文确认。

### Windows PowerShell 5.1 编码

现有脚本主要使用 ASCII 代码和英文字符串。新增 PowerShell 文件默认保持 ASCII，避免 Windows PowerShell 5.1 对无 BOM UTF-8 中文文本的解析差异。

### 安装路径变化

入口只从 `$PSScriptRoot/lib` 加载，不使用当前工作目录。安装态临时复制测试作为强制验收。

### 行为测试覆盖不足

结构测试不能替代现有行为测试。任何结构测试通过但 13 个黑盒用例失败的实现都视为未完成，不通过修改旧断言来迁就重构结果。

## 验收标准

- 用户批准的方案 A 已按本规格落地。
- CLI 参数、JSON schema、安全门禁和退出行为没有有意变化。
- 入口不超过 220 行，私有脚本不超过 400 行，函数不超过 280 行。
- 现有 29 个函数唯一归属，新增工作流函数职责清楚。
- 原有 13 个测试和新增结构测试全部通过。
- 所有 PowerShell 文件通过 AST 语法解析。
- 安装态临时复制测试通过。
- 真实 dry-run 可解析、候选结果可解释，工作区不产生进程台账。
- `description` 未过度删改，全局 skill 未修改，未执行 Git 提交。
