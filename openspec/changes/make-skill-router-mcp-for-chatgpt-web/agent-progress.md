# 长任务执行进度

## 当前状态

- Change：`make-skill-router-mcp-for-chatgpt-web`
- Checkpoint：CP-01/CP-02 最小 package 与核心服务层（部分完成）
- 当前 task：已完成 package manifest、tsconfig、runtime metadata/bindings、GitHub adapter、SourceSnapshot、registry/search/router 基础层和 canonical tool registry；MCP transport/client contract、workerd、集成与外部发布仍未完成
- 唯一任务源：`tasks.md`

## 本轮已完成的工件工作

- 创建并阅读本 change 的 `proposal.md`、`design.md`、`specs/remote-skill-router-mcp/spec.md`、`tasks.md`。
- 创建前已扫描工作区的 `agent-progress.md` / `agent-findings.md`；仅发现既有独立 change 的规范位置文件，没有错位文件需要迁移。
- 已把长任务恢复纪律、试点批次、外部证据门和动态补全规则写入 `tasks.md`。
- 已记录匿名只读访问、Cloudflare Git Integration 单一生产部署 authority、仓库根目录 Worker root directory、Build Watch Paths 以及 SDK transport/session 与自定义 snapshot session 的边界。
- 已完成 0.1 官方兼容性审计并写入 `evidence/2026-08-13-cp00-compatibility-profile-audit.md`；仅标记 0.1 完成，未开始 runtime 实现。
- 已完成 0.2 registry 前置契约审计；generator `-Check` 通过，未修改 release-side 文件。
- 已完成 0.3 package/workspace/CI 落点审计；package 尚不存在，root Vitest 保持 3.x，未发现 Cloudflare Worker workflow。
- 已创建 CP-00 综合证据文件，完成 strict validation、diff check 与证据目录 secret 扫描；CP-00 全部任务已具备可复读证据，尚未创建 runtime 源码。
- 针对用户提出的“恢复时可能找不到原始 prompt 约束”风险，已创建完整 source-context index，并把每次恢复的强制读取顺序、来源层级、冲突处理和 task 映射写入 `tasks.md`。

## 验证摘要

- OpenSpec CLI 已确认 change root 和 spec-driven 工件依赖链。
- `pnpm --dir packages/skill-router-mcp run typecheck` 通过。
- `pnpm --dir packages/skill-router-mcp run test:unit` 通过（3 files / 4 tests）；当前测试仍是基础定义与运行时 seam，不等价于 SDK client/transport contract。
- 尚未运行 Cloudflare、ChatGPT 或生产部署验证；不得将外部 checkpoint 标记完成。

## 下一步

下一恢复点从 CP-01/1.1 开始。每次恢复前除本文件、`agent-findings.md`、proposal、design、spec 与 tasks 外，还必须读取 `evidence/2026-08-13-source-context-index.md` 及当前 task 映射的原始 prompt 文件；不要把 OpenSpec spec 当成原始约束的完整副本，也不要把 CP-00 的审计通过误报为 runtime、Cloudflare 或 ChatGPT 已完成。

## 2026-08-13 continuation

CP-03 已补入 Cloudflare Vitest pool，并以 `SELF.fetch` 验证实际 workerd 的 health、bindings、`CF_VERSION_METADATA`、MCP initialize、malformed request 与并发 transport 隔离；3.6、3.8 已完成。production harness 尚未采用 Wrangler `createTestHarness()`，且未覆盖全量 tool flow，3.7、3.9 保持 pending。CP-04 本地 README、`.dev.vars.example`、静态检查 workflow 与 smoke 脚本已完成；外部 candidate/Cloudflare dashboard 权限缺失，CP-04/CP-05 外部任务保持 pending。

## 2026-08-13 workflow 与 Nitro 收口

- `ci.yaml` 保留原有中文步骤名称，仅增加 skill-router-mcp 的 PR path filter 与可复用 workflow 调度；`skill-router-mcp.yml` 仅使用 `workflow_call`，不执行 Wrangler deploy/promotion。
- Nitro 与 Wrangler 的兼容日期统一为 `2024-09-19`，符合 `nitro-api-development` 技能要求；本轮 typecheck、test:all、build 均通过。
- `pnpm exec wrangler whoami` 因本机 Cloudflare token 已过期且环境非交互而失败；candidate、Cloudflare Builds dashboard、production 与 ChatGPT/Workspace 外部证据继续保持 pending。

- 后续 Wrangler OAuth 已恢复；直接上传 Worker 成功并取得 URL/version ID，health smoke 通过。GitHub token secret 已配置，但 Worker 出站 GitHub search 返回 rate/access policy 错误，known-skill search 与 pinned load 未通过，CP-04 candidate smoke 仍 pending。
- 最新直接上传版本 `1dc18748-f8a0-4c3e-9796-e78d3b894697` 已包含安全的 GitHub 上游状态日志（仅 status/rate-limit headers，不含 token/正文）；线上 MCP 基础 contract 仍通过，GitHub search 仍被 403 拒绝。

# 2026-08-13 Cloudflare official agent setup and live smoke correction

- 按 Cloudflare 官方 `https://developers.cloudflare.com/agent-setup/prompt.md` 执行了 `npx -y skills add cloudflare/skills --skill '*' --yes --global`；13 个官方 skills 已复制到 `C:\Users\pc\.agents\skills`，其中 `cloudflare`、`wrangler`、`workers-best-practices` 已读取。安装器的 PromptScript 全局注册提示不影响文件落盘。
- 本项目新增 `.codex/config.toml`，仅定义 5 个 Cloudflare MCP：cloudflare、cloudflare-docs、cloudflare-bindings、cloudflare-builds、cloudflare-observability；未继续写入用户级 MCP 注册。`codex mcp get` 已确认项目层配置可见。Cloudflare MCP OAuth 首次回调曾报 issuer 缺失；用户随后确认已完成项目级授权，待 Codex 会话重载后使用远程工具复核。
- 修复 `scripts/smoke-mcp.ts` 对工具结果字段的错误假设：运行时 Skill 使用 `id`，脚本现在兼容 `id`/`skillId`，并从选中的候选传递 exact SHA。
- 使用 Node 子进程以无额外换行的精确字节写入 `GITHUB_TOKEN` secret；此前 PowerShell 管道隐式换行导致 Worker 出现 `TypeError: Invalid header value.`。随后直接 Wrangler 部署版本 `7c9c6934-a7a0-40eb-9218-db7ad464c428`，在线 smoke 已通过 health、MCP 初始化、tools/list、known-skill search 和 pinned load/exact-SHA。
- `pnpm --dir packages/skill-router-mcp run typecheck`、`test:all`（unit 23、worker 5、integration 3）、`openspec validate ... --strict`、`git diff --check` 均通过；Cloudflare Workers Builds Git Integration 仍未被直接上传替代，相关 authority task 继续保持 pending。
- 按官方 Workers best-practices 补充 `wrangler.toml` 的 structured observability（enabled/head sampling）；`wrangler deploy --dry-run` 通过。兼容日期仍按项目已批准的 Nitro 约束固定为 `2024-09-19`，未使用随当前日期漂移的值。
- 按 Cloudflare 官方 `createTestHarness()` 文档重构 integration 测试：`vitest.integration.config.ts` 使用 Node Vitest，先构建 Nitro Cloudflare 产物，再由 Wrangler harness 启动 `.output/server/wrangler.json`；测试通过本地 HTTP mock GitHub upstream 注入 `GITHUB_API_BASE_URL`，覆盖 health、initialize、tools/list、get_server_info、list/search/load latest+pin、错误路径及并发隔离。`tasks.md` 的 3.7、3.9 已据此勾选，证据写入 `evidence/2026-08-13-cp03-runtime-and-production-harness.md`。
