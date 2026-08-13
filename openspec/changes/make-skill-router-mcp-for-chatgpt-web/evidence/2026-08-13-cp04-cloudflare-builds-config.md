# 2026-08-13 CP-04 Cloudflare Builds 配置

本证据由 Codex（GPT-5）记录。仓库内已提供 `wrangler.toml`、只读 GitHub source vars、`CF_VERSION_METADATA` binding 和不执行部署的 GitHub Actions 检查。初次检查时 Cloudflare Workers Builds Git Integration 的 root directory、watch paths、secret 与唯一 production authority 尚未取得账户级证据，未伪造 dashboard 结果。

本轮已恢复 Wrangler OAuth 并完成一次直接 candidate Worker 上传，作为运行时验证证据；该上传来源为 `Upload`，不等同于 Cloudflare Workers Builds Git Integration 配置证据，不能替代 4.6/4.8 的 dashboard 记录。Worker secret 名称已通过 `wrangler secret list` 确认存在，secret 值未写入仓库或 evidence。

补充命令证据：使用同一 Wrangler OAuth 调用 `GET /accounts/3412269ab0def154c8806e38acd1b493/builds/workers/skill-router-mcp/triggers` 返回 HTTP 403。当前 token 具备 Workers 上传权限，但没有可复读的 Workers Builds Git Integration 读取/配置权限；因此 4.6/4.8 继续 pending。

## 2026-08-13 授权复核

- `wrangler whoami` 已复核成功，当前账号仍具备 `workers:write`、`account:read` 等 Wrangler 权限。
- Cloudflare MCP Server 已在用户授权页面显示为已连接，但当前 Codex 会话实际只加载了 Cloudflare 文档工具，没有加载 `cloudflare-builds` API 工具，因此不能把授权页面截图当成 Builds API 操作证据。
- 直接调用 Workers Builds triggers API 仍返回 HTTP 403（Authentication error）；未取得 Git Integration 的仓库、根目录、watch paths、构建命令或预览 promotion 的可复读结果，4.6/4.8 继续保持未完成。

## 依据官方文档整理的待配置清单

以下内容是待在 Cloudflare Dashboard 的 Worker「Settings → Builds」中填写并保存的候选配置，不是已完成的账户操作证据：

- Git 仓库：`ruan-cat/monorepo`；生产分支：`dev`。
- Root directory：仓库根目录 `/`，因为本项目的 `pnpm-workspace.yaml` 和 `pnpm-lock.yaml` 位于根目录。
- Build command：`pnpm --dir packages/skill-router-mcp run build`。
- Production deploy command：`pnpm --dir packages/skill-router-mcp exec wrangler deploy --config wrangler.toml`。
- Non-production preview deploy command：`pnpm --dir packages/skill-router-mcp exec wrangler versions upload --config wrangler.toml`。
- Build watch paths include：`packages/skill-router-mcp/**`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`；exclude：`ai-plugins/**` 与普通文档路径。
- Runtime secret 只配置 `GITHUB_TOKEN`；公开变量继续由 `wrangler.toml` 的 `[vars]` 管理，不把 secret 写入仓库或构建日志。

官方依据：Workers Builds 要求在 Worker 的「Settings → Builds」连接 Git 仓库并配置 root directory、构建命令和部署命令；monorepo 可使用 watch paths。以上清单只有在 Dashboard 保存成功并产生真实 build ID、Preview URL 与日志后，才能转化为 4.6/4.8 的完成证据。

## 官方权限说明

Cloudflare 官方文档说明，Workers Builds 使用的 API token 需要能够读取账户设置并编辑 Workers Scripts、KV、R2，以及读取用户详情和成员关系；Workers Builds 页面可以自动创建该 token，也可以在「My Profile → API Tokens」中调整已有 user token。这个 token 是 Cloudflare Builds 自己使用的构建授权，不是 GitHub Actions 的 secret，也不要求把生产部署权限加到本仓库的 GitHub workflow。

## 2026-08-13 新 token 实测结论

- 用户提供的新 token 已在单次隔离命令中通过 `CLOUDFLARE_API_TOKEN` 交给 Wrangler；`wrangler whoami` 成功，并明确显示 `Account API Token`。
- 同一 token 调用 `GET /client/v4/accounts/3412269ab0def154c8806e38acd1b493/builds/workers/skill-router-mcp/triggers` 返回 HTTP 401，错误码 `12006 Invalid token`；调用普通 Worker Scripts API 则返回 200。
- Cloudflare 官方 Builds API 文档明确写出：Workers Builds API 要求 **User-scoped API token**，不支持 Account-scoped token；创建 trigger 至少需要 `Workers CI Write` 权限。因此当前 token 能完成 Wrangler Worker 操作，但不能完成 Builds Git Integration API 操作。
- token 未写入文件、环境变量已在命令结束时删除，未写入日志或证据正文。

## 2026-08-13 新 User-scoped token 与 Git 集成实测

- 新 token 仅通过临时环境变量使用，未写入仓库、日志或证据正文。
- `GET /user/tokens/verify` 返回 HTTP 200，状态为 `active`。
- `GET /accounts/3412269ab0def154c8806e38acd1b493/workers/scripts` 返回 HTTP 200，找到 Worker `skill-router-mcp` 及其固定脚本标签。
- `GET /accounts/3412269ab0def154c8806e38acd1b493/builds/tokens` 返回 HTTP 200，读取到现有构建令牌列表。
- GitHub 仓库连接已按官方 API 成功创建/更新：仓库为 `ruan-cat/monorepo`，分支配置使用 `dev`；Cloudflare 返回连接 UUID `060a6371-9c3f-4c63-9537-1ff4f42e6d9a`。
- 已创建两个 Workers Builds 触发器：生产触发器 UUID `114479bf-7aec-4152-b022-8d15ba165279`，预览触发器 UUID `8b1f2207-978c-4c60-868a-7665b06573c5`。生产仅监听 `dev`，预览监听其他分支；两者均限制到 `packages/skill-router-mcp/**`、锁文件和 workspace 文件，并排除 `ai-plugins/**` 与普通文档。
- 已通过生产触发器对远程 `dev` 分支发起第一次构建，构建 UUID 为 `1186fadf-507f-4d9a-8327-91d428e28a4a`。Cloudflare 已接收并执行，但最终失败：构建环境中的远程 `dev` 提交不包含 `packages/skill-router-mcp` 目录，执行 `pnpm --dir packages/skill-router-mcp run build` 时报告目录不存在。
- 本地 `HEAD` 与远程 `dev` 当时指向同一提交，但本地 skill-router-mcp 改动尚未提交并推送，因此失败属于 GitHub 远程源码尚未包含本次实现，不是 token 或 Cloudflare API 授权失败。
- 结论：Cloudflare Workers Builds Git Integration 的仓库连接、生产/预览触发器和 API 访问权限已真实建立；4.7/4.8 仍需在提交并推送包含该包的 Git 提交后重新触发，取得成功构建、部署和预览证据后才能勾选。

## 2026-08-13 推送触发与部署复核

- 本次实现已分组提交并推送到远程 `dev`。Cloudflare 自动生成 production push 构建 `5d06b99f-ecf9-4b10-9826-6bd9c930b298`，对应提交 `99bd0c9d954f34d227b4c137c158d2cf0f605fc0`，状态为 `success`。
- 生产构建实际采用仓库根目录 `/`、`pnpm --dir packages/skill-router-mcp run build` 和 `pnpm --dir packages/skill-router-mcp exec wrangler deploy --config wrangler.toml`。Worker 部署记录显示新的 100% 版本 `ad1102d4-647d-4bed-9be2-6bae1a407b2b`。
- 同一提交推送到候选分支后，Cloudflare 自动生成 preview push 构建 `dadd3803-b8d0-4a14-a80c-c932551b4167`，状态为 `success`，并返回 Preview URL `https://codex-skill-router-mcp-candidate-skill-router-mcp.1219043956.workers.dev`。
- 候选与生产端点均已运行只读 smoke；候选 smoke 覆盖 health、MCP 初始化、tools/list、get_server_info、known-skill 搜索和 pinned load。GitHub Actions 工作流仅运行校验，不包含 Wrangler deploy/promotion，也未写入 Cloudflare 凭据。
