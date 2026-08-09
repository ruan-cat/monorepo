---
name: use-vercel-deploy-in-monorepo
description: >-
  用于 pnpm monorepo 或独立仓库部署到多个 Vercel Project，处理 Vercel Git Integration、
  本地 link 绑定、Project Settings 漂移、Shared Environment Variables、Node 22.x/24.x、
  Turbo 任务链、Nitro 产物或 Vercel 部署日志诊断。
metadata:
  version: "2.0.0"
---

# Monorepo 与独立仓库的 Vercel 部署

## 适用范围与排除范围

用于 pnpm workspace 或独立仓库的 Nuxt、Nitro、Vite、UniApp H5 等部署。一个 Git 仓库可关联多个 Vercel Project，但每个 Project 都必须单独验收。

不处理 GitHub Actions、GitHub Workflow 或其他自建 CI 部署。未经用户授权，不提交、推送、修改真实云端配置、unlink 或删除团队资源。

## 不可跳过纪律

1. **正式交付链是 Vercel Git Integration。** Git push 触发的目标 Project 部署才是正式验收；本地 CLI upload、MCP 触发和 Prebuilt 仅用于构建诊断、产物核验或已明确授权的应急辅助链。
2. **本地 link 是单槽绑定。** 每次切换目标 Project，或在任意目录执行交互式本地部署前，都先运行 `vercel link --project <project-name> --yes`，随后在同一执行目录读取 `.vercel/project.json`，将 `projectId` 和 `orgId` 分别与目标 Project、目标团队的远端值精确比较。字段缺失或不一致立即停止；不能只按项目名或目录名判断。`vercel link` 只绑定本地 CLI Project，绝不证明 Vercel Project 已连接 Git 仓库。
3. **先决定 Node，后设计构建。** 在编写 Build Command、Turbo 依赖和远端设置前，根据 `engines.node`、版本文件、包管理器、依赖兼容性、远端 `nodeVersion` 与当前官方支持范围，在 22.x 与 24.x 中做有证据的选择；两个均可用时沿用仓库基线，证据不足不升级。
4. **所有远端写入均需读后校验。** Settings 固定 GET → 比较 → 最小 PATCH → GET → inspect；Shared Environment Variables 固定 GET → 精确识别 → 冲突检查 → 增量 PATCH → GET。权限、字段或回读失败时停止，不猜测成功。
5. **不得泄露或替代团队资源。** 不打印 token、secret value 或私有认证文件；普通项目变量不等于 Shared Environment Variable link。默认仅补齐明确声明的缺失链接，unlink 需明确授权，删除默认禁止。

## P0 阶段门禁

1. 侦察目标仓库、生产分支、目标团队/Project、Root Directory、Git 连接和当前部署来源。
2. 明确 Git Integration 为正式主链；确认本地 Prebuilt 只作辅助。
3. 为每个目标 Project 分别建立或核实 Git repository connection 与 Production Branch。新 Project 从 Dashboard 导入 Git 仓库；既有 Project 在 Settings 中连接/更换仓库并设置 Production Branch。公共文档没有稳定写 API 时必须停在 Dashboard 人工 gate，完成回读前标记阻塞；完整路径与证据见[Git 部署与诊断](references/vercel-git-deployment-and-diagnostics.md#git-integration-连接与生产分支门禁)。
4. 决定 Node 22.x 或 24.x，并写下依据与远端当前值。
5. 如需本地人工操作，完成 CLI 单槽 link 与 `projectId`/`orgId` 双 ID gate（见[CLI 与远端读取](references/vercel-cli-remote-inspection.md)）。
6. 读取、比较并最小化更新 Project Settings（见[Settings 写回](references/vercel-project-settings-writeback.md)）。Root Directory 不在默认 PATCH allowlist；修改它需要用户单独授权并重新评估命令和产物。
7. 分别审计 Production、Preview、Development 的项目变量与 Shared Environment Variables；仅按[共享变量](references/vercel-shared-environment-variables.md)完成真实的团队变量链接。
8. 在本地运行构建并检查 `.vercel/output`，但不将其等同于 Git 主链成功。
9. 获得推送授权后，以可识别 commit SHA 触发 Git 部署，并完成[Git E2E](references/vercel-git-deployment-and-diagnostics.md)。
10. 更新目标项目 README 与已存在的 AI 记忆（见[项目部署文档](references/project-deployment-documentation.md)）。

## P1 交付质量门禁

- 审查 `.vercelignore`，避免忽略 workspace、构建输入、运行时文件或错误排除 `.vercel/output`。
- 按上传、安装、构建、产物、运行时、域名六层分诊日志；先确认部署来源是 Git clone、CLI upload 还是 Prebuilt。
- 对 Nitro，核验 `serverDir` 与真实目录、functions 产物和 API 冒烟；对 Turbo，使用 `dependsOn` 和 `outputs` 表达跨包依赖，禁止用多步骤 shell 串接替代任务图。
- 分别验证 Production、Preview、Development 作用域；保留首次 E2E 的逐项证据而非只勾选。

## Git 主链与本地辅助链

Git 主链的证据顺序为：推送 commit → Vercel 克隆/checkout 仓库 → Install → Build → Output → READY → 目标 URL 冒烟。日志中的 `Cloning` 或等价 Git checkout，加上匹配的 commit SHA，才可证明 Git 主链；`Downloading deployment files` 只可证明文件上传或 Prebuilt 路径。

本地 Prebuilt 只可验证本地 build 与 `.vercel/output`，或帮助区分本地代码问题与云端 Git 环境问题。本地 READY 不能关闭任何 Git E2E 项。完整分诊和 E2E 见[Git 部署与诊断](references/vercel-git-deployment-and-diagnostics.md)。

## 写入与能力路由

优先级固定为：CLI 专用命令 → `vercel api` → 直接 REST API → MCP → Dashboard。

- CLI 用于 link、project inspect、部署和日志；先探测 `vercel api --help`，再决定是否可调用 API。
- `vercel api` 或直接 REST API 用于 Settings、Shared Variable 等没有 CLI 专用写命令的场景；REST token 只读 `VERCEL_TOKEN` 环境变量。
- MCP 仅辅助项目、部署和日志读取；它不是 Settings 或 Shared Variable 写入的替代，尤其不得声称 MCP 能 Link Shared Variable。能力边界见[MCP 操作](references/vercel-mcp-operations.md)。
- 上述自动写入路径均不可用时，给出 Dashboard 操作位置并标记为阻塞，不能虚构配置已写入。

## 构建、产物与框架路由

按[monorepo 部署模式](references/monorepo-deployment-patterns.md)先选择模式 A（根 `.vercel/output`）或模式 B（子包直接产物），并保持 Root Directory、Build Command、Install Command 与 Output Directory 同一口径。

按实际框架使用可复制模板，并同时选择对应 Turbo 任务模板：

- [Nuxt 脚本](templates/package-scripts-nuxt.md) / [Nuxt Turbo](templates/turbo-task-nuxt.json)
- [Nitro 脚本](templates/package-scripts-nitro.md) / [Nitro Turbo](templates/turbo-task-nitro.json)
- [Vite 脚本](templates/package-scripts-vite.md) / [Vite Turbo](templates/turbo-task-vite.json)
- [UniApp H5 脚本](templates/package-scripts-uniapp-h5.md) / [UniApp H5 Turbo](templates/turbo-task-uniapp-h5.json)
- [独立 Nitro](templates/standalone-repo-nitro.md)
- 需要根产物搬运时，再参阅 [搬运任务](templates/turbo-task-move-vercel-output.md)。

Nitro 的服务端源码不在默认位置时，先读取 `nitro.config.*`，核对 `serverDir` 与目录存在性；构建后检查 functions 产物，首次 Git E2E 覆盖该目录提供的 API。不要用 build 成功代替运行时验证。

## README 与 AI 记忆收口

部署事实必须写回目标项目 README，并等价更新已存在的 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md`。三份 AI 记忆均缺失时转交 `init-ai-md`，不创建项目专属部署 skill。字段和安全边界见[项目部署文档](references/project-deployment-documentation.md)。

## 首次 Git E2E checklist

- [ ] Git 仓库、生产分支、目标团队/Project 和 Root Directory 已核实。
- [ ] 每个 Project 已独立完成 Git repository connection 与 Production Branch 设置；Project GET 的 `link` 实际字段及 Dashboard Branch Tracking 证据已回读，缺失项标为阻塞。
- [ ] Node 22.x/24.x 选择与理由已记录，远端 `nodeVersion` 已比较。
- [ ] 若执行本地操作，`vercel link --project` 后 `.vercel/project.json` 的 `projectId`、`orgId` 已与远端目标精确一致。
- [ ] Settings 已完成最小 PATCH、GET 回读与 `vercel project inspect` 交叉验证，或明确记录无需变更。
- [ ] 项目变量与 Shared Environment Variables 均已覆盖三环境；Shared link 无同名项目变量遮蔽并已回读。
- [ ] `.vercelignore`、Turbo DAG、Nitro `serverDir` 和 `.vercel/output` 已检查。
- [ ] 在获得授权后，已推送可识别 commit，并以 SHA、Git checkout 日志、READY 与 URL 冒烟完成正式 Git E2E。
- [ ] README 与已有 AI 记忆已收口；未记录 token、secret 或本机私有路径。
