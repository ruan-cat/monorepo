# Vercel CLI 与远端读取

## 使用边界

CLI 用于本地单槽 link、Project inspect、部署、日志和 `vercel api` 能力探测。项目名是人类可读标识，不可替代 `projectId` 与 `orgId` 的成对核验。`vercel link` 只把当前本地目录绑定到一个 CLI Project，绝不等于该 Vercel Project 已连接 Git repository 或已设置 Production Branch。

## 本地单槽 link 门禁

在将要执行本地操作的**同一目录**运行：

```powershell
vercel link --project <project-name> --yes
Get-Content .vercel/project.json | ConvertFrom-Json
```

从目标团队与该团队内目标项目的远端响应取得精确的 `orgId` 和 `projectId`，再比较本地文件。任一字段不存在、不完全相等、或远端对象无法取得时，停止本地部署。重新 link 覆盖该目录 `.vercel/project.json` 是预期单槽副作用；一个目录不能同时保存多个目标绑定。

`vercel project inspect <project-name>` 可交叉确认目标设置；使用团队参数的具体语法以当前 `vercel project inspect --help` 为准。不要读取、复制或打印 CLI 私有认证文件。

## Node 与项目读取

在写任何命令前读取根与目标包的 `package.json#engines.node`、`.nvmrc`、`.node-version`、`packageManager` 和锁文件；同时从远端对象读取 `nodeVersion`。在 22.x 与 24.x 中选择唯一有证据的版本，或在两者都满足时沿用现有基线。记录选择、约束和远端原值。

远端读取至少覆盖：`framework`、`rootDirectory`、`buildCommand`、`outputDirectory`、`installCommand`、`nodeVersion`、Git 连接与部署来源。字段未返回应标记为“未返回”，不能填充猜测值。

## `vercel api` 探测与降级

先执行：

```powershell
vercel api --help
```

已知 `vercel@50.5.1` 提供 `api` 命令，但实际安装版本、参数名与 API schema 可能变化。仅当 help 明确支持所需 HTTP 方法、body 输入和 endpoint 调用时才使用它；必要时再用 `vercel api ls` 查找可用端点。若不支持、返回 404、字段被拒绝或 schema 漂移，停止猜测 CLI 参数，转到受同等权限保护的直接 REST API，并重新核对官方文档。

直接 REST 的 token 仅来自当前会话的 `VERCEL_TOKEN`：

```powershell
if (-not $env:VERCEL_TOKEN) { throw '缺少 VERCEL_TOKEN，停止远端写入。' }
$headers = @{ Authorization = "Bearer $env:VERCEL_TOKEN"; 'Content-Type' = 'application/json' }
```

不得从 CLI 私有认证文件读取 token，也不得打印 `$env:VERCEL_TOKEN`、Authorization header 或 secret value。

## 远端读取后的行动

- Project Settings 的 GET、差异和写后回读：见[Settings 写回](vercel-project-settings-writeback.md)。
- Shared Environment Variables 的识别与真实链接：见[共享环境变量](vercel-shared-environment-variables.md)。
- Git/Prebuilt 部署来源、日志与 E2E：见[Git 部署与诊断](vercel-git-deployment-and-diagnostics.md)。
