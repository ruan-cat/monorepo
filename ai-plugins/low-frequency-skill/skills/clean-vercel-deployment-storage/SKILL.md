---
name: clean-vercel-deployment-storage
description: 使用时机：当 Vercel Deployment Storage 部署存储额度将满或已满、需要批量删除历史部署、需要为 Vercel 项目配置 Deployment Retention 自动清理、或删除部署时遇到 vercel api 要求确认、CLI 凭据失效等问题时使用。
user-invocable: true
metadata:
  version: "1.0.0"
---

# clean-vercel-deployment-storage：批量清理 Vercel 部署存储

## 核心认知

官方 Vercel MCP 无删除能力；大规模删除的最优解是 **REST API + Bearer token**（`DELETE /v13/deployments/{id}`）。CLI 可用但有两个坑（见 references）。

## 执行流程（严格按序）

1. **扫描**：`pnpm dlx tsx src/cli.ts scan --team-id <id> --out report.json`。scan 自动执行权限预检（token 身份 + 团队归属 + OWNER/DEVELOPER 角色判定），未通过直接退出；通过后生成 dry-run 清单（每项目保留最新 1 个 production，其余标记 DELETE），preflight 证据写入报告。
2. **确认**：把清单摘要（总数/删除数/每项目分布 + preflight 身份与角色）交给用户审核，**未经确认禁止执行**。
3. **删除**：先用 `execute --limit 10` 试跑验证通道，独立复查成功后再全量执行（默认并发 3，NOT_FOUND 视为已删）。
4. **治理**：`retention --team-id <id>` 为全部项目配置自动过期，防止额度复发；`verify` 复查最终状态。

## 红线

- 删除不可逆：无 dry-run 清单与用户确认，不得调用 execute 全量；execute 只接受携带 PASS preflight 证据的报告。
- 禁止大规模并发 spawn `vercel` CLI 执行删除——会把本地凭据打挂；脚本走 fetch 直连 REST API。
- 项目一律不删，只删部署；保留例外（平台自动保留最近 10/20 个 Ready 部署与带 alias 部署）见 references。

## 深入阅读（按需加载）

- [references/tool-landscape.md](./references/tool-landscape.md)：MCP/CLI/API 三通道边界与 CLI 两个坑的根因。
- [references/rest-api-playbook.md](./references/rest-api-playbook.md)：端点速查、retention 合法值、token 获取、平台保留例外、30 天恢复期。
- [references/incident-2026-09-08.md](./references/incident-2026-09-08.md)：845→27 实战复盘与凭据失效事故。
