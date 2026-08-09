# Shared Environment Variables

## 先区分资源类型

项目变量属于单个 Project；Shared Environment Variable 是团队资源，项目链接不是创建同名变量。普通 `vercel env add` 不能 Link Shared Variable，不能用它作为此流程的降级替代。MCP 当前公开工具也没有该写能力，不得声称 MCP 能完成 Shared Variable link。

默认只补齐用户已声明的缺失链接，不修改 value 或 target。unlink 必须有明确授权；删除团队共享变量默认禁止。环境变量变更只在新的部署中生效，必须重新运行 Git 主链验收。

## 固定 GET / PATCH / GET 流程

```text
确认 teamId 与 projectId
→ GET /v1/env
→ 按 key 精确匹配并取得 envId
→ 检查 target、类型、当前项目链接和项目变量遮蔽
→ PATCH /v1/env 增量 link
→ 检查 updated / failed
→ GET /v1/env 回读 envId 与 projectId
→ 触发新的 Vercel Git 部署
```

每个变量必须单独处理。没有精确 `envId`、变量不属于目标团队、target 不含声明所需环境、类型或值不符合部署合同、权限不足、PATCH 失败或回读不一致时，均停止；不得创建同名项目变量来绕过。

## PowerShell 安全请求骨架

只使用会话 `VERCEL_TOKEN`，不输出 token 或变量的 secret value：

```powershell
if (-not $env:VERCEL_TOKEN) { throw '缺少 VERCEL_TOKEN，停止。' }
$headers = @{ Authorization = "Bearer $env:VERCEL_TOKEN"; 'Content-Type' = 'application/json' }
$shared = Invoke-RestMethod -Method Get -Uri 'https://api.vercel.com/v1/env?teamId=<team-id>' -Headers $headers
$projectEnv = Invoke-RestMethod -Method Get -Uri 'https://api.vercel.com/v9/projects/<project-id>/env?teamId=<team-id>' -Headers $headers
```

在 `$shared` 中以 key 精确匹配，取得 `<shared-env-id>`。先审计其 target、类型、已链接项目集合；再在 `$projectEnv` 内精确查同名项目变量。存在同名项目变量即构成遮蔽风险：不要静默保留、删除或重建，报告 key、target 与存在状态，等待用户决定删除、改名或确认优先级。

仅当目标 `projectId` 尚未在该 Shared Variable 当前链接中时，使用最小 link 请求。请求不得附带 key、value、target 或完整项目数组：

```json
{
  "updates": {
    "<shared-env-id>": {
      "projectIdUpdates": {
        "link": ["<project-id>"]
      }
    }
  }
}
```

PowerShell 调用示例：

```powershell
$request = @{
  updates = @{
    '<shared-env-id>' = @{
      projectIdUpdates = @{ link = @('<project-id>') }
    }
  }
} | ConvertTo-Json -Depth 8 -Compress
$result = Invoke-RestMethod -Method Patch -Uri 'https://api.vercel.com/v1/env?teamId=<team-id>' -Headers $headers -Body $request
```

检查 `$result.updated` 与 `$result.failed`，然后再次 GET `/v1/env`，逐项验证目标 `projectId` 已出现、此前项目链接仍在、target/value 未被意外改变；最后再次 GET 项目变量，确认没有同名遮蔽。报告时遮蔽 value，仅记录 key、target、类型、链接状态和回读结果。

## pnpm / Git 历史常见约束示例

以下 key 只是部署合同的条件化示例，不是所有项目的默认环境变量。两者都必须复用目标 team 中已存在的 Shared Environment Variable，并按上文完成精确 `envId`、value、三个环境 target、遮蔽、增量 link 与回读验证；不得用 `vercel env add` 创建同名项目变量。修改共享变量的 value 或 target 不在默认授权内，发现不一致时停止并交给具备权限的团队管理员。

### `ENABLE_EXPERIMENTAL_COREPACK=1`

只有仓库根 `package.json#packageManager` 明确固定 pnpm 版本，且构建确实需要 Corepack 时，才把该 key/value 纳入部署合同。验证目标 team 的 Shared Variable 值为 `1`，target 覆盖 Production、Preview、Development，并已链接目标 `projectId`；缺少任一证据都不能宣称 Corepack 约束已满足。不要仅因仓库使用 pnpm 就把它设为所有项目默认值。

官方依据：

- [Vercel Corepack experimental changelog](https://vercel.com/changelog/corepack-experimental-is-now-available)
- [Vercel Error List：Pnpm engine unsupported](https://vercel.com/docs/errors/error-list#pnpm-engine-unsupported)

### `VERCEL_DEEP_CLONE=true`

只有目标项目 README、已有 AI 记忆或事故证据明确声明构建需要完整 Git 历史时，才把该 key/value 作为**项目声明约束**进行验证和 Shared link。若公开官方资料不足以证明其稳定通用语义，不得编造官方来源、推导平台保证或宣称所有 Git 部署都必需；只记录项目证据、预期值 `true`、三个环境 target、链接状态与新 Git 部署的验证结果。

## 常见停止条件

- 未精确获得目标 Shared Variable 的 `envId`。
- target 不能覆盖声明的 Production、Preview、Development 范围。
- 发现同名项目变量遮蔽共享变量。
- PATCH 返回 failed、权限不足，或回读未包含目标 `projectId`。
- 需要 unlink、删除、改 value 或改 target，但用户未明确授权。

保留已确认的现有链接，输出 API 响应摘要与待团队管理员动作；不部署，也不把项目变量作为默认替代。
