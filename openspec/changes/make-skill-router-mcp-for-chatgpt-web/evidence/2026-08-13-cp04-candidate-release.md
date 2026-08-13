# 2026-08-13 CP-04 候选发布验证

本证据由 Codex（GPT-5）记录。代码、Nitro 构建和本地 MCP 合约已完成；初次检查时本机 Cloudflare OAuth 已过期，无法取得 Workers Builds 候选版本证据。该任务保持未勾选，禁止把本地构建当作外部发布证据。

阻断项（初次检查）：需要刷新 OAuth 并取得 Cloudflare Workers Builds 候选版本的真实证据。

## 2026-08-13 Wrangler 候选版本验证补充

- Wrangler 账号授权已恢复，执行 `pnpm --dir packages/skill-router-mcp exec wrangler deploy --config wrangler.toml` 成功。
- Worker URL：`https://skill-router-mcp.1219043956.workers.dev`。
- 部署版本：`e849f24b-db82-46da-8c05-d42a0df6625d`。
- `/health` 实测 200，返回 MCP SemVer `0.1.0`、构建 SHA `047587cd136d546506cebd9af02f4ce4c5eb5172` 与 Worker version metadata。
- 初次 secret 写入后，smoke 的已知 Skill 搜索返回 `GITHUB_RATE_LIMITED`；后续诊断确认原因是 PowerShell 管道追加换行造成的请求头错误。该初次失败记录已由下方更正记录取代，不代表当前线上状态。

## 2026-08-13 Wrangler 候选验证更正

- 当前 Worker 是通过 Wrangler 直接上传，不是 Cloudflare Workers Builds Git Integration 生成的候选版本。两者部署权威不同，因此 CP-04 中要求 Git Integration 的部署权威任务仍保持未完成。
- 使用不带额外换行的精确字节重新写入 GitHub secret 后，线上 smoke 已通过：`/health`、MCP 初始化、`tools/list`、已知 Skill 搜索，以及带精确 SHA 校验的固定版本 `load_skill`。
- 之前的 `GITHUB_RATE_LIMITED`/`SOURCE_READ_FAILED` 是 secret 字节流被 PowerShell 管道追加换行导致的请求头错误，并非已经确认的持续 GitHub 出站策略阻断。smoke 脚本同时存在把规范字段 `id` 误写成旧字段 `skillId` 的问题，现已修复。
- 最近一次直接上传版本：`7c9c6934-a7a0-40eb-9218-db7ad464c428`。Worker 地址：`https://skill-router-mcp.1219043956.workers.dev`。

## 2026-08-13 当前直接上传复验

- Wrangler OAuth 当前有效；使用当前工作区构建执行 `wrangler deploy --config wrangler.toml` 成功。
- 最新直接上传版本：`e4ec9375-465f-4e0f-8303-fed03c7a15f5`。
- Worker 地址：`https://skill-router-mcp.1219043956.workers.dev`。
- 只读 smoke 已通过：health、MCP 初始化、`tools/list` 四项工具发现、known-skill 搜索、带精确 SHA 的 pinned load。
- 该版本仍是 Wrangler 直接 Upload，不是 Cloudflare Workers Builds Git Integration candidate；因此 CP-04 的 Git Integration、Preview promotion 和单一生产部署 authority 任务仍保持未完成。

## 2026-08-13 Workers Builds 候选版本成功验证

- 候选分支 `codex/skill-router-mcp-candidate` 已推送到 `ruan-cat/monorepo`；其提交为 `99bd0c9d954f34d227b4c137c158d2cf0f605fc0`。
- Cloudflare Workers Builds 自动创建 push 构建 `dadd3803-b8d0-4a14-a80c-c932551b4167`，状态为 `success`；构建来源是 `push_event`，并使用预览触发器的 `wrangler versions upload` 命令。
- Preview URL：`https://codex-skill-router-mcp-candidate-skill-router-mcp.1219043956.workers.dev`。
- 对该 Preview URL 执行只读 smoke 已通过：`/health`、MCP 初始化、`tools/list` 四项工具发现、`get_server_info`、known-skill 搜索及精确 SHA 的 pinned `load_skill`。
- Preview 构建与生产构建均使用固定 Worker 脚本标签；候选分支不承载生产部署权威，生产仅由 `dev` 触发器执行 `wrangler deploy`。
