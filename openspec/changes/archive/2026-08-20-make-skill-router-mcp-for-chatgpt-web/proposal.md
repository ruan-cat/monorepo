## Why

现有 `ai-plugins` 已具备确定性的 `skill-registry.json`，但 ChatGPT Web 尚不能通过一个稳定、可审计的远程 MCP 端点发现和读取这些高频更新的 Skill。需要新增一个以 Git 精确提交为读取快照的 Cloudflare Worker 服务，同时把 Skill 数据发布、MCP Runtime 发布和 ChatGPT 工具元数据发布的边界固化为可验证流程。

## What Changes

- 新增基于 Nitro v3、Cloudflare Workers 和 OpenAI 当前 ChatGPT 兼容 MCP SDK 路径的 `Skill Router MCP` 包，提供 Streamable HTTP `/mcp` 与只读健康检查端点。
- 新增由同一 `toolDefinitions` 驱动的 `get_server_info`、`list_skills`、`search_skills`、`load_skill`；工具从 GitHub 中已提交的 `ai-plugins/skill-registry.json` 和 `SKILL.md` 读取数据。
- 实现 latest 与可选 `sourceCommitSha` pin 的 `SourceSnapshot`：一次工具调用内所有 registry、Skill 与按需关联文件读取必须使用同一精确 Git SHA。
- 增加运行时绑定、部署版本信息、构建 Git SHA、最小权限 GitHub 读取适配器，以及 Node、workerd、MCP 客户端、生产构建和远端 smoke 的分层验证。
- 增加版本化 Worker 发布、回滚、Skill-only 免部署和 Tool Contract 变更时 ChatGPT refresh/rescan 的显式门禁；不将这些外部账号操作伪装为自动测试已完成。

## Capabilities

### New Capabilities

- `remote-skill-router-mcp`: 面向 ChatGPT Web 的只读远程 MCP 服务、精确 Git Skill 快照、版本自描述、发布边界与可验证验收流程。

### Modified Capabilities

- 无。

## Impact

- 新增 MCP package（按 monorepo 现有 workspace 约定放置）及其 Nitro、Wrangler、package-local Vitest 与可选的 GitHub Actions 静态检查配置；生产构建、部署和 promotion 仅由 Cloudflare Workers Builds Git Integration 负责。
- 运行时依赖 Nitro v3、`@modelcontextprotocol/sdk`、zod、Wrangler，以及 package-local 的 Cloudflare Workers Vitest 栈；不要求升级根 Vitest 3.x。
- 读取已存在的 `ai-plugins/skill-registry.json` 和 GitHub `ruan-cat/monorepo`，部署需要 Cloudflare Worker 配置及最小只读 `GITHUB_TOKEN`。
- ChatGPT Developer Mode、Cloudflare production promotion 和 Workspace 审核属于外部可验证门禁，必须在任务执行时保留证据或明确标记为阻断。
