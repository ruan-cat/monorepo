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

## CP-01/CP-02 实施发现（2026-08-13）

- package-local 依赖已落为 `@modelcontextprotocol/sdk@1.30.0`、Nitro beta、zod、Wrangler 与 Vitest 4；根 Vitest 3.x 未修改。
- `SourceSnapshot` 已实现 unpinned resolve-once 与 pinned validate-only；GitHub token 仅在 adapter 内使用，错误文案不回显 token。
- registry 解析已要求 schema v1、固定 roots、全局唯一 id 与安全 `SKILL.md` entry；仍需补充更完整的 registry/source/path 负例测试。
- canonical `toolDefinitions` 与 `createServer` 已存在，但 SDK Client + WebStandardStreamableHTTPServerTransport contract 尚未完成；不能勾选 1.5/1.7 或宣称 MCP endpoint 可用。
- 当前仍存在代理探测产生的异常未跟踪文件（文件名以 `{console.error` 开头）；已确认内容为 malformed pnpm probe，待以安全方式清理，不能纳入目标 diff。

- 复核期间发现 tasks.md 曾被代理误将 CP-01/03/04 标记完成；已按唯一任务源原则全部恢复为未完成。现有自动测试虽通过，但 worker/integration 仍是 Node seam，不可替代 workerd、MCP transport、Cloudflare 或 ChatGPT 外部证据。
- cleanup-agent-team-node-processes dry-run 显示 80 个 node 均 audit-only（无 include、父进程存活或未满 30 分钟）；未执行批量停止，保护 Memorix/CodeGraph/浏览器/MCP 长驻进程。

## 2026-08-13 当前执行证据

- package-local 依赖已锁定 `@cloudflare/vitest-pool-workers@0.21.2`；worker/integration 配置使用真实 Cloudflare pool，兼容日期调整为 `2025-01-01` 以适配本地 Miniflare 支持范围。
- `pnpm --dir packages/skill-router-mcp run typecheck`、`test:unit`（9 files/25 tests）、`test:all` 和 `build` 均通过；build 产物包含 `/health` 与 `/mcp` route。当前 worker/integration 测试仍是浅 seam，尚未证明真实 `SELF.fetch`/生产 harness，因此 3.7–3.9 保持未勾选。
- `pnpm-lock.yaml` 由 pnpm 10.33.0 重序列化，diff 较大；`pnpm install --frozen-lockfile --ignore-scripts --offline` 已通过，importer 与 package.json 一致。仍需后续 scope review，不能把锁文件格式噪声误当业务改动。
- Cloudflare candidate/production、ChatGPT Developer Mode、Workspace review、rollback 均无账户授权；对应 evidence 已记录阻断，4.5–5.5 不勾选。
- workerd 实证已补齐：`SELF.fetch` health/MCP initialize/malformed request、真实 `env` public vars、`CF_VERSION_METADATA` binding；integration 也通过真实 Cloudflare test plugin。3.6 与 3.8 可验收，3.7/3.9 仍因未使用 Wrangler `createTestHarness()` 与缺少完整 tool flow 保持 pending。

## 2026-08-13 workflow 与 Nitro 收口

- workflow 已完成主入口与 package 子工作流模块化拆分，保留原有中文步骤名称；GitHub Actions 不承担生产部署 authority。
- `nitro.config.ts` 与 `wrangler.toml` 均固定 `2024-09-19`，不要改为当前日期漂移值。
- Wrangler 当前 token 过期，非交互环境无法刷新；未伪造 Cloudflare candidate/production 证据。
- 2026-08-13 Wrangler 外部验证：账号 OAuth 已恢复，`skill-router-mcp` Worker 已直接上传并取得 version ID；health/initialize/tools-list 可访问。GitHub API 从本机用同一 token 返回 200，但 Worker 出站 search 返回 403，被 adapter 安全映射为 `GITHUB_RATE_LIMITED`；已补 `User-Agent` 后仍复现，需继续调查 Cloudflare 出站策略或 GitHub 对 Worker egress 的限制，不能勾选 candidate smoke/production。
- 同一 OAuth 调用 Cloudflare Workers Builds triggers API 返回 HTTP 403；`workers:write` 不等同于 Workers Builds Git Integration 的 CI 读写权限，4.6/4.8 仍需 dashboard 或具备 Workers CI Read/Write 的授权。

# 2026-08-13 Cloudflare 官方 skills 与 Worker secret 诊断

- `https://developers.cloudflare.com/agent-setup/prompt.md` 是 Cloudflare 官方 Agent Setup 指令，不是单一业务 skill；它要求安装 `cloudflare/skills` 全套 skills，并为 Codex 注册 Cloudflare MCP。已按原文安装 13 个 skills，并把 5 个 MCP 配置限定在仓库 `.codex/config.toml`。
- 在线 Worker 的 GitHub 读取故障根因是 secret 输入字节流包含 PowerShell 管道隐式追加的换行，Worker Fetch 构造 Authorization header 时报告 `Invalid header value.`。通过 Node 子进程向 `wrangler secret put` 写入无换行字节后，直接上传版本的 live smoke 全流程通过。此前的“持续 GitHub egress 403/rate-limit”结论已被新证据纠正，不再作为当前阻断。
- smoke 脚本另有字段契约问题：`search_skills`/`load_skill` 的规范字段是 registry entry 的 `id`，不是 `skillId`；已修复并以在线 exact-SHA pinned load 验证。
- 仍需区分 direct Wrangler Upload 与 Cloudflare Workers Builds Git Integration：前者证明候选 Worker 可运行，不能证明单一生产部署 authority、Preview promotion 或 rollback 外部门禁；无 Builds API/ dashboard 证据的 tasks 继续 pending。
- Cloudflare 官方测试指导已落实：Workers Vitest pool 负责 workerd 运行时测试，Wrangler `createTestHarness()` 负责生产构建集成测试。production harness 通过本地 Node HTTP mock GitHub upstream，并使用测试专用 `GITHUB_API_BASE_URL` 注入；该变量不进入生产 Wrangler 配置，避免把测试替换入口暴露为生产 caller 可覆盖配置。

## 2026-08-13 Cloudflare MCP 会话加载状态

- 用户已在 Cloudflare 授权页面为 `Cloudflare MCP Server` 授予账号权限；截图显示该应用已连接且拥有 383 项权限。
- 本项目 `.codex/config.toml` 已正确声明 Cloudflare MCP 端点，用户级配置未新增 Cloudflare 条目。
- 当前 Codex 会话的可调用工具注册表尚未出现 Cloudflare MCP 工具；直接匿名访问 MCP 端点返回 OAuth 质询，使用 Wrangler OAuth token 返回 `insufficient_scope`，不能把这次会话误报为已使用 Cloudflare MCP。
- 下一步需要重新加载/重启当前 Codex 会话后，再用 `cloudflare-builds` MCP 查询 Workers Builds Git Integration；在会话刷新前继续保留 CP-04 外部权限证据为 pending。

## 2026-08-13 MCP 本地配置启动诊断

- OpenAI Codex 官方配置文档确认，受信任项目可以使用 `.codex/config.toml`，且 `[mcp_servers.<server-name>]` 的 Streamable HTTP `url` 配置是合法格式；本项目路径和信任状态均已确认。
- `codex mcp get cloudflare-builds` 实际返回 `enabled: true`、`transport: streamable_http` 和正确的 `https://builds.mcp.cloudflare.com/mcp` URL；因此不是项目级配置未被读取或服务器未安装。
- 对五个 Cloudflare endpoint 的无凭据探测结果：文档端点返回方法限制，主 API、bindings、builds、observability 均返回 OAuth 质询，说明远端服务地址可达。
- 当前工具注册表仍只出现 Cloudflare Docs 工具；`codex mcp login cloudflare-builds` 会进入等待 OAuth 回调但没有输出错误。现有证据更符合“`cloudflare-builds` 尚未完成独立 OAuth 凭据落盘或当前桌面会话未重新加载该凭据”，不是本地 MCP 安装/启动失败。

## 2026-08-13 Cloudflare Builds OAuth 完成后的会话复核

- 用户已确认手动完成 `codex mcp login cloudflare-builds` 和浏览器授权。
- 授权后 `codex mcp get cloudflare-builds` 仍显示服务器已启用且 URL 正确，但当前活动 Codex 线程的工具注册表仍没有 `cloudflare-builds` 工具；`codex mcp list` 在本地 CLI 会等待远程服务器初始化，未输出可复读的工具清单。
- 这表明授权落盘与活动线程的工具加载是两个阶段；当前线程尚未重新建立 MCP 工具注册表。不能把“登录命令成功”直接当作本线程已可调用 Builds API 的证据。
