# 2026-09-09 `clean-vercel-deployment-storage` 低频技能设计

## 目标

把 2026-09-08 Vercel 大规模部署清理的实战经验（845 → 27，0 失败）固化为一个可复用的低频外发技能：当 Vercel Deployment Storage 额度将满时，agent 能按本技能安全、分批、可回溯地完成「扫描 → dry-run 清单 → 用户确认 → 批量删除 → Retention 治理」全链路，并配置 Retention 防止额度复发。

**技能定位**：低频使用、低频维护。SKILL.md 正文极端简洁（目标 < 500 词），全部重上下文下沉到 `references/`。

## 用户可见结果

调用本技能的 agent 能：

1. 判定工具边界：官方 Vercel MCP 无 delete 能力，大规模删除走 REST API + Bearer token。
2. 生成 dry-run 清单（每项目保留最新 1 个 production，其余 preview/旧 production 标记 DELETE），交用户确认后才执行。
3. 用 TS 脚本（tsx 调度）批量删除，支持 `--limit` 小批量试跑验证，并发删除时 NOT_FOUND 归类为成功。
4. 为全部项目配置 Deployment Retention（端点 `PATCH /v9/projects/{id}/deployment-expiration`），知道 Hobby plan 的 production 上限是 `1m`。
5. 避开已踩过的坑：`vercel api` DELETE 必须加 `--dangerously-skip-permissions`；大规模并发 spawn CLI 会打挂本地凭据；retention 端点在官方文档/OpenAPI 中查不到。

## 已确认设计决策

### 文件架构：三层拆分，core 可单测

```text
src/core.ts   # 纯函数：buildPlan 保留策略、分页合并去重、摘要统计。零 IO。
src/api.ts    # 薄封装：fetch 直连 REST API（token 从外部注入），scan/execute/retention/verify 四个操作。
src/cli.ts    # 入口：解析 argv，组装 token 解析链与 api.ts，输出报告 JSON。不经 vitest 测试。
```

- 调度方式：`tsx src/cli.ts <子命令>`；测试经 vitest 直接相对路径 import `core.ts`。
- **只使用 Node 内置模块**（`node:child_process`、`node:fs`、`node:path`、`node:url`、`node:process`、全局 `fetch`），零第三方依赖——脚本随技能外发，在独立 Node 环境运行。
- 明确不做：CLI spawn 并发执行通道、自动读取 WorkBuddy 本地配置、交互式确认 UI、断点续删数据库。

### Token 解析链（按用户确认的优先级）

```text
1. CLI 本地凭据 auth.json（平台路径探测，读 token 字段）
2. 环境变量 VERCEL_TOKEN
3. 都取不到 → 以明确错误退出，提示 agent 向用户索要 token（Dashboard → Settings → Tokens）
```

`--token` / `--team-id` 参数始终可用作显式覆盖。不自动读取 `~/.workbuddy/.mcp.json`（WorkBuddy 专属路径，不可外发移植），该兜底路径只写入 references 供 agent 参考。

### 默认删除策略（烘焙进 core，不做配置项）

- 每项目保留最新 1 个 `target === "production"` 部署（不论 readyState）。
- 其余全部 DELETE；`readyState ∈ {BUILDING, QUEUED, INITIALIZING}` 标记 SKIP-BUILDING 不删。
- 团队、项目范围、时间门槛等变量通过子命令参数表达，不做成策略配置系统（YAGNI）。

### 子命令接口（四个动词，无嵌套）

```text
tsx src/cli.ts scan     --team-id <id> --out <report.json> [--limit N] [--token xxx]
tsx src/cli.ts execute  --report <report.json> [--concurrency 3] [--limit N]
tsx src/cli.ts retention --team-id <id> [--preview 1m --production 1m --canceled 1m --errored 1m]
tsx src/cli.ts verify   --team-id <id>
```

- `scan` 分页拉取（limit=100，until 游标 + uid 去重防死循环）并落盘 dry-run 清单。
- `execute` 读报告执行删除；404/NOT_FOUND 记为 `already-deleted` 成功；产出 execution-report。
- `retention` 逐项目 PATCH；非 200 时打印 Vercel 原始校验错误（这是发现 Hobby 上限的唯一途径）。
- `verify` 全量清点剩余部署数，输出每项目 total/production/preview。

## 文件结构与职责

| 路径                                                                             | 变更职责                                                                                                                                                             |
| :------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/SKILL.md` | 极简入口：触发条件、四步流程、三条红线、references 导航。frontmatter `metadata.version: "1.0.0"`。                                                                   |
| `.../references/tool-landscape.md`                                               | 工具边界矩阵：MCP 无 delete / CLI 两个坑（确认标志、凭据失效根因）/ REST API 最优解。                                                                                |
| `.../references/rest-api-playbook.md`                                            | 端点速查：列表分页、删除、retention、token 来源；合法值表（1d/1w/1m/2m/3m/6m/1y/unlimited）；平台保留例外规则（最近 10/20 个部署不受 retention 约束）；30 天恢复期。 |
| `.../references/incident-2026-09-08.md`                                          | 实战复盘：845→27 全过程、并发 spawn 凭据失效根因（token 过期 + refreshToken 竞争）、MCP token 兜底路径、WorkBuddy 本地经验沉淀位置。                                 |
| `.../src/core.ts`、`.../src/api.ts`、`.../src/cli.ts`                            | TS 脚本三层实现，仅 Node 内置模块。                                                                                                                                  |
| `tests/clean-vercel-deployment-storage/core.test.ts`                             | 纯函数单测：保留策略、分页去重、SKIP-BUILDING、空输入、摘要。中文 describe/test 分场景，对齐 `tests/init-simple-memorix` 风格。                                      |
| `tests/clean-vercel-deployment-storage/skill-contract.test.ts`                   | 静态行为契约（仿 init-shadcn）：frontmatter 与版本 1.0.0、references 三文件存在、正文无内部绝对路径泄漏、src 无第三方 import、插件 README/CHANGELOG 已收录本技能。   |
| `ai-plugins/low-frequency-skill/README.md`                                       | Skills 清单追加本技能条目（release 脚本 `-NewSkill` 阻断校验的前置条件）。                                                                                           |
| `ai-plugins/low-frequency-skill/CHANGELOG.md`                                    | `[Unreleased] → Added` 记录新技能，注明 `1.0.0` 起步。                                                                                                               |

## 发布联动（本轮不做，另起一轮）

- 本轮只落文件 + README/CHANGELOG；**不执行** `release-ai-plugins` 脚本、不 bump 插件主版本、不生成 registry。
- 发布轮使用 `-NewSkill clean-vercel-deployment-storage -ChangeType added`，registry 由 canonical generator 唯一写入；发布前根 README / `ai-plugins/docs/README.md` 安装命令一致性按 release 契约复核。

## 非目标

- 不做交互式 CLI、进度条、断点续删、多团队批量编排。
- 不复刻 Vercel Dashboard 已有能力（单条删除、逐项目手工配置）。
- 不把 WorkBuddy 会话路径、SmallAliceWeb 项目信息写入外发正文（只允许出现在 incident 复盘的「背景」小节，脱敏为「某团队」）。
- 不做 E2E 真实 API smoke 测试。
- 不改 release-ai-plugins 技能与 CI workflow。

## 验收设计

### 测试驱动（先红后绿）

1. `core.test.ts`：对 `buildPlan`/分页合并/摘要写场景断言，先在无实现时失败，实现后转绿。
2. `skill-contract.test.ts`：对技能文件结构与发布联动写静态断言，缺失文件/未收录 README 时失败。

### 人工验收

- [ ] `pnpm vitest run tests/clean-vercel-deployment-storage` 全绿
- [ ] `tsx src/cli.ts scan --team-id <真实团队> --out /tmp/x.json --limit 1` 真实通道打通（token 取自 CLI auth.json）
- [ ] SKILL.md 正文词数 < 500，三条红线清晰可扫读
- [ ] README / CHANGELOG 收录，无残留占位符
- [ ] `git diff --check` 通过，工作区只含本次预期文件
