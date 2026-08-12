# 长任务发现与风险

## 核心发现

- `ai-plugins/skill-registry.json` 与 `generate-skill-registry.ps1` 当前已存在；本 change 消费该契约，不重做 release-side generator。
- 根 workspace 覆盖 `packages/*`；当前不存在 `packages/skill-router-mcp`，适合独立 package 边界。
- 根 Vitest 保持 3.x；Worker 侧测试必须 package-local，不得将本 change 扩大为全仓 Vitest 升级。
- OpenSpec 仅已有不相关的 `vite8-vitest4-foundation-upgrade` active change；本 change 的状态文件位于正确的唯一根目录。

## 用户确认的实施决策（2026-08-13）

- 公开匿名端点：任何拿到 URL 的人都可只读查询公开 Skill；v1 不引入 OAuth、API key、用户账户、数据库或自定义 session。
- 最小防护：必须在实现/验证阶段明确请求超时、请求体/响应大小上限与 Cloudflare 原生速率限制/WAF 等价策略，并验证超限错误不泄露敏感信息。
- 部署权威：Cloudflare Workers Builds 的 Git Integration 是唯一 production deploy/promotion authority；GitHub Actions 不执行 Wrangler deploy/promotion，也不持有 Cloudflare production credentials。
- 构建根目录与监听：Worker root directory 暂定仓库根目录，以便使用 pnpm workspace；Build Watch Paths 仅包含 `packages/skill-router-mcp/**`、`pnpm-lock.yaml`、`pnpm-workspace.yaml` 与必要共享配置，并排除 `ai-plugins/**` 与普通 docs。
- 生命周期边界：允许 MCP SDK 为 Streamable HTTP 合规维持必要 transport/session 生命周期；禁止自定义 Skill snapshot server session，Skill 数据仍按 request-local exact-SHA snapshot 读取。
- CP-00/0.1 已按 2026-08-13 官方资料完成：OpenAI 仍推荐 TypeScript `@modelcontextprotocol/sdk`、`McpServer`、Streamable HTTP、MCP Inspector 与 Developer Mode；Workspace/发布流程要求 refresh/rescan/review/publish 证据。当前资料未要求为通用 Workspace MCP 扩展成 Deep Research 的 `search`/`fetch` schema，也未采用 Skills extension 静态 submission snapshot。
- MCP TypeScript SDK 的远程实现支持 stateless 每请求生命周期；实现阶段必须结合锁定版本做多请求/并发隔离测试，不能跨请求复用 transport 或 `McpServer` 实例。
- 审计时上游 MCP TypeScript SDK v2 已发布，但 OpenAI 当前 ChatGPT Build MCP 文档仍采用 `@modelcontextprotocol/sdk` v1 线；因此暂不追随上游 v2，CP-01 必须记录实际锁定的 v1 版本与升级门槛。
- CP-00/0.2 已完成：`powershell.exe -NoProfile -ExecutionPolicy Bypass -File ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1 -Check` 输出 `skill-registry.json is current`；JSON `schemaVersion=1`、roots 为两个既有 skill roots，共 26 项，entry 均以 `SKILL.md` 结尾且 `Test-Path` 通过。未修改 generator 或 registry。
- CP-00/0.3 已完成：`packages/skill-router-mcp` 尚不存在；`pnpm-workspace.yaml` 包含 `packages/*`，root `package.json` 的 Vitest 为 `^3.2.4`，package manager 为 `pnpm@10.33.0`。现有 workflow 中 `ai-plugins-skill-registry-check.yml` 只负责 registry stale check，root `ci.yaml` 是 dev 分支全仓 build/test，其他 deploy workflow 属于既有 Vercel 路径；未发现 Cloudflare Worker workflow。新 MCP 的 Cloudflare Git Integration 不应与这些既有流程混成生产部署 authority。
- 用户提出的上下文丢失风险已处理：原始 prompt 目录当前有 25 个 Markdown 文件，新增 `evidence/2026-08-13-source-context-index.md` 记录完整清单、强制阅读顺序、task 映射和冲突协议；后续恢复不能只读 OpenSpec `spec.md`。

## 风险与禁止重复路径

- OpenAI ChatGPT MCP 文档、MCP SDK、Nitro Cloudflare adapter 与 ChatGPT/Workspace UI 均可能漂移；实施 checkpoint 必须重新验证当前官方资料，不能只依赖 2026-08-11 提示词。
- 不手写 MCP JSON-RPC lifecycle，不抢跑未获 OpenAI ChatGPT 明确支持的新 protocol/SDK major。
- 不用 KV/R2/D1/DO、server session 或 mutable cache 解决 Skill snapshot；使用 Git exact SHA 和 optional pin。
- 不将 Worker deployment、Skill Git push 或 ChatGPT tool refresh 混为同一完成证据；外部账号/权限缺失时保持 task pending 或记录阻断。
- 不把 token、Authorization header、raw env、内栈写入 MCP result、日志或 evidence。

## 证据索引

- 规划来源：`docs/prompts/release-ai-plugins/2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web/`
- registry 前置约束：`docs/prompts/release-ai-plugins/2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/`
- 后续执行证据落点：`evidence/YYYY-MM-DD-*.md`，由 `tasks.md` 的对应 task 创建。
