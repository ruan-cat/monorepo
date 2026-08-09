# Project Settings 写回

## 目标与边界

本流程只处理以下默认 allowlist：`framework`、`buildCommand`、`outputDirectory`、`installCommand`、`nodeVersion`。`rootDirectory` 影响部署拓扑，不在默认 PATCH 范围；只有调用者明确授权后，才可单独评估和修改。

在确定 Node 22.x 或 24.x 之前不得写 Settings。选择依据必须包括仓库 Node 约束、包管理器、框架与原生依赖兼容性、当前远端 `nodeVersion` 和官方支持范围；若两者均可用，沿用仓库基线，证据不足即停止。

## 固定闭环

```text
vercel api --help
→ GET /v9/projects/<id-or-name>
→ 字段级比较
→ PATCH /v9/projects/<id-or-name>（仅差异 allowlist 字段）
→ GET /v9/projects/<id-or-name>
→ vercel project inspect 交叉验证
```

执行前确认目标 team、目标 Project 和目标字段期望值。`vercel api --help` 仅用于能力探测：当前 CLI 显示可发起所需请求才使用 CLI API；否则使用下方直接 REST 降级。收到 404、字段拒绝或 schema 漂移时停止写入并重新查官方文档，不猜测替代 endpoint 或字段。

## 读取、比较与最小 PATCH

以下示例使用 PowerShell 与当前会话的 `VERCEL_TOKEN`。它不会读取或打印任何 CLI 私有认证文件：

```powershell
if (-not $env:VERCEL_TOKEN) { throw '缺少 VERCEL_TOKEN，停止。' }
$headers = @{ Authorization = "Bearer $env:VERCEL_TOKEN"; 'Content-Type' = 'application/json' }
$project = Invoke-RestMethod -Method Get -Uri 'https://api.vercel.com/v9/projects/<id-or-name>?teamId=<team-id>' -Headers $headers

$desired = [ordered]@{
  framework = '<framework>'
  buildCommand = '<build-command>'
  outputDirectory = '<output-directory>'
  installCommand = '<install-command>'
  nodeVersion = '<node-22-or-24>'
}
$patch = [ordered]@{}
foreach ($key in $desired.Keys) {
  if ($project.$key -ne $desired[$key]) { $patch[$key] = $desired[$key] }
}
```

若 `$patch.Count` 为零，记录“无需变更”并仍执行最终 inspect。否则只发送 `$patch`，不得发送完整 project 对象、未知字段或 Root Directory：

```powershell
$body = $patch | ConvertTo-Json -Depth 8 -Compress
$updated = Invoke-RestMethod -Method Patch -Uri 'https://api.vercel.com/v9/projects/<id-or-name>?teamId=<team-id>' -Headers $headers -Body $body
$readback = Invoke-RestMethod -Method Get -Uri 'https://api.vercel.com/v9/projects/<id-or-name>?teamId=<team-id>' -Headers $headers
vercel project inspect <project-name>
```

逐项比对 `$readback` 与 `$desired` 中五个 allowlist 字段；任一字段未返回或不一致即停止部署结论。`vercel project inspect` 只作交叉验证，不能替代 API GET 回读。不要打印 `$body` 中可能含敏感构建参数的内容，报告时只列出字段名和变更状态。

## 写入路径与停止条件

1. 先使用 CLI 专用命令处理 link、inspect、部署和日志。
2. 无专用写命令时，先探测 `vercel api --help`；已验证可用再调用 CLI API。
3. CLI API 不可用时，使用 `VERCEL_TOKEN` 的直接 REST。
4. MCP 仅辅助项目/部署/日志读取，不能用 list/get 伪造 PATCH 成功。
5. 自动写入路径都不可用时，提供 Dashboard 的人工修改位置并标记阻塞；不得自行宣布配置已完成。

Settings 改动只影响新部署。完成回读后仍须通过新的 Vercel Git Integration 部署验证实际行为。
