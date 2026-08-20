## Context

本仓库已存在由 `release-ai-plugins` 生成并受 CI 校验的 `ai-plugins/skill-registry.json`，可作为 Git-native discovery manifest；当前没有 Skill Router MCP package。完整的业务与验收约束位于 `docs/prompts/release-ai-plugins/2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web/`，其中依赖版本和 ChatGPT 产品行为必须在实际实现/发布 checkpoint 重新按官方资料验证。

本设计落实 `proposal.md` 与 `specs/remote-skill-router-mcp/spec.md`，并将长任务唯一执行入口限定为 `tasks.md`。`agent-progress.md` 与 `agent-findings.md` 只保存 checkpoint 摘要、证据索引和风险，不维护第二份任务清单。

## Goals / Non-Goals

**Goals:**

- 在 `packages/skill-router-mcp/` 创建独立的 pnpm workspace package，隔离 MCP runtime 与 package-local Workers 测试栈，不升级根 Vitest 3.x。
- 以 OpenAI 实施时当前文档支持的 `@modelcontextprotocol/sdk`、`McpServer` 和 Streamable HTTP 为生产基线；Nitro 仅作 Cloudflare HTTP/runtime adapter。
- 以 Git exact commit 建立无状态 `SourceSnapshot`，实现 registry 驱动的 Skill list/search/load 与可选 pin。
- 让 `toolDefinitions` 成为 SDK 注册、标准工具目录、`get_server_info` 和 contract tests 的共同来源。
- 将外部发布/验收拆成可恢复 checkpoint，并保留真实证据与回滚目标。

**Non-Goals:**

- 不在 MVP 引入 KV、R2、D1、Durable Objects、向量数据库、embedding、后台同步或 server-side snapshot session。
- 不手写 JSON-RPC lifecycle、MCP negotiation 或以 REST 替代 MCP transport。
- 允许 MCP SDK 为 Streamable HTTP 合规所需的 transport/session 生命周期；禁止自定义 Skill snapshot server session、跨请求保存当前 Skill 或以其替代 request-local `SourceSnapshot`。
- 不修改既有 registry generator 的业务逻辑；它仅作为本 MCP 的已存在前置契约，若审计失败则另开 change。
- 不在没有 Cloudflare/OpenAI 账号证据时声称生产部署、ChatGPT refresh 或 Workspace 审核已完成。

## Decisions

### 1. Package 与边界布局

创建 `packages/skill-router-mcp/`，采用以下职责分离：

```text
server/api/mcp.post.ts, server/api/health.get.ts  Nitro routes / transport adapter
runtime/*                                         bindings、build 与 deployment metadata
repositories/github-skill-source.ts               唯一接触 GITHUB_TOKEN 的 HTTP boundary
services/source-snapshot.ts                        latest/pinned exact SHA creation
services/skill-router.ts                           registry validation、list/search/load orchestration
mcp/tool-definitions.ts                            canonical tool metadata and handlers
mcp/create-server.ts                               McpServer construction and canonical registration
tests/*                                            unit, workerd and external contract fixtures
```

选择 package-local 边界而非根目录 `skill-router-mcp/`，因为本仓库以 `packages/*` 管理可构建单元。相关配置、wrangler 命令与 CI path filter 都只覆盖该 package 和其直接 build inputs。

备选方案是把 Worker 放到现有 `ai-plugins/`：拒绝，因为该目录是静态 Skill/registry source，而非 Cloudflare application runtime；混放会模糊 Skill-only 更新与 Worker deploy 触发边界。

### 2. ChatGPT compatibility-first MCP adapter

以实施当日 OpenAI 官方 Build an MCP server 文档为版本选择证据。使用官方支持的 MCP SDK `McpServer` 承担 initialization、tools/list、tools/call、schema、annotation 和 Streamable HTTP 协议处理；`server/api/mcp.post.ts` 只负责将 Nitro 当前 Cloudflare request runtime 适配到 SDK transport。远程 v1 优先采用 SDK 支持的无状态/每请求 transport 生命周期；不得跨请求复用 transport 或 `McpServer` 实例，具体 factory 方式由实施时 SDK 文档和 workerd 并发隔离测试确定。
试点还必须验证最终 transport 配置（例如 stateless、JSON response 与 session ID 选项）对 ChatGPT/Inspector 的实际要求，不能仅凭 `mcp.post.ts` 文件名假定 POST-only；若兼容测试证明需要 GET/DELETE 或 SSE 路由，再在 CP-01/CP-03 动态补充对应 adapter 任务。

不固定未经再验证的 SDK major、Nitro adapter API 或 protocol revision。即使上游 MCP TypeScript SDK v2 已发布，实施时仍以 OpenAI 当前 ChatGPT 兼容文档为生产基线，锁定实际采用的 v1 版本；只有 OpenAI 文档与真实 Developer Mode 证据同时支持后才另开升级决策。实现前的试点 checkpoint 必须用官方文档、package lockfile、MCP Inspector 和最小 contract test 证明所选 API；若 ChatGPT 当前文档与既有 prompt 冲突，以官方当前兼容路径为准并更新 design/spec/tasks 后再继续。

备选方案是手写 JSON-RPC 或采用 upstream 最新 package split：均拒绝，因为前者重复协议生命周期，后者可能领先 ChatGPT 兼容基线。

### 3. 单一工具定义与只读模型

`toolDefinitions` 以一个 typed registry 定义四个工具的名称、description、input schema、annotation 和 handler factory。`create-server.ts` 遍历它注册工具；`get_server_info` 从同一 registry 投影安全摘要；tests 从同一 registry 生成 expected catalog。

`get_server_info` 不建立 `SourceSnapshot`，仅使用 package version、build info、runtime deployment info、固定 source config 与 registry schema 常量；其他三类 Skill 工具在每次调用中创建一个 snapshot。所有 v1 tool 是只读；外部 GitHub 数据的 `openWorldHint` 由实施时官方语义和真实行为决定，不能机械复制。

### 4. GitHub 读取、SourceSnapshot 与 registry

`github-skill-source.ts` 是唯一能使用 `GITHUB_TOKEN` 的模块。它负责将 configured `GITHUB_REF` resolve 为 SHA、验证 pin 属于 configured owner/repo、按 SHA 读取 registry/Skill/关联文件，并将 HTTP 失败转换为安全领域错误。

`SourceSnapshot` 是 request-local 值：

```text
unpinned: configured ref -> resolve once -> commit SHA A
pinned:  supplied sourceCommitSha -> validate configured repository -> SHA A
registry @ A -> Skill/related file @ A
```

不在 module scope 保存“current Skill”，也不新增 session、KV 或 mutable cache。相关文件仅能在已选 Skill 根目录内以规范化 repo-relative path 按需读取；registry 不合法、entry 不合法或路径越界均显式报错而不 fallback 全仓扫描。

### 5. Runtime bindings、版本和安全诊断

`runtime/bindings.ts` 使用 Nitro v3 当前 Cloudflare request runtime API 提取 `GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_REF`、`GITHUB_TOKEN`、`CF_VERSION_METADATA`，并将其收敛成 source config、repository adapter 和 `DeploymentInfo`。业务 service 不接收完整 env 或 token，禁止 `process.env.GITHUB_TOKEN`。

版本值保持分离：MCP application SemVer 唯一来自 package.json；Worker Version ID/tag/timestamp 来自 `CF_VERSION_METADATA`；`buildGitSha` 由 build 阶段生成模块注入；每次 Skill 读取另返回 `sourceCommitSha`。`wrangler.toml` 只声明公开 source vars 与 version metadata，`GITHUB_TOKEN` 通过 Cloudflare secret 上传，`.dev.vars` 仅作本地 gitignored 输入。

### 6. 测试分层与发布域

自动测试分为：pure Node unit（registry、search、snapshot、error、安全投影）、workerd（bindings、Nitro adapter、MCP transport）、外部 MCP SDK/production build harness（health、initialize、tools/list 和代表性 tool calls）。所有生产/测试 SDK 使用同一 lockfile 版本。

发布在 `tasks.md` 中严格分域：

```text
Skill data:    release-ai-plugins -> Git commit -> next unpinned call
Runtime:       SemVer -> all gates -> versions upload -> preview -> exact promote -> smoke
Tool contract: Runtime path + Inspector/ChatGPT refresh-rescan/evaluation/review
```

生产部署 authority 固定为 Cloudflare Workers Builds 的 Git Integration；不把生产部署、promotion 或 Cloudflare credentials 放入 GitHub Actions。Cloudflare Worker 的 root directory 暂定为仓库根目录，以便正常解析 pnpm workspace；实际构建/部署由 Wrangler 配置和 Cloudflare Builds 设置指向 `packages/skill-router-mcp` 的 runtime 产物。Build Watch Paths 只监听 `packages/skill-router-mcp/**`、`pnpm-lock.yaml`、`pnpm-workspace.yaml` 与必要的共享构建配置，并排除纯 `ai-plugins/**` 与普通文档变更。若未来保留 GitHub Actions，只能承担无部署权限的静态检查，不得形成第二个 production authority。Runtime 回滚使用 Cloudflare stable Worker version；Skill 内容问题使用 Git revert/fix。

### 7. 匿名公开端点与最小边缘防护

v1 的 `/mcp` 与 `/health` 允许任何拿到 URL 的调用方匿名只读访问，不引入 OAuth、API key、用户系统、数据库或自定义 session 管理。由于没有调用方认证，Worker 必须使用 Cloudflare 原生的最小边缘防护（速率限制/WAF 等可用能力）并在 runtime 明确设置请求超时、请求体/响应大小上限和安全错误映射；所有工具保持只读，GitHub token 只存在于 Worker secret binding，绝不回显。

## Risks / Trade-offs

- [OpenAI、MCP SDK 与 Nitro API 会演进] → 每个 compatibility checkpoint 重新读取官方资料；不以旧 prompt 的版本号替代当前证据。
- [Cloudflare/ChatGPT 权限和 UI 是外部状态] → 将 preview、promotion、Developer Mode refresh、Workspace review 定义为证据门，不用本地绿灯代替。
- [GitHub 高并发更新使跨调用 HEAD 断言不稳定] → 测试 search A -> pinned load A 与调用内一致性，不比较几秒前独立读取的 HEAD。
- [registry 与实际 Skill tree 可能脱节] → consumer 明确拒绝缺失/不支持/entry 无效；registry generator CI 仍是 release-side 责任。
- [Worker adapter 接口不确定] → 在试点 batch 先搭最小官方 SDK/Nitro/Worker contract，并在失败时记录具体 API/版本证据，再扩展业务 tools。
- [四层测试仍不能证明 ChatGPT 产品接受新 schema] → tool contract release 额外保留 Inspector、Developer Mode 与 Workspace 人工 gate。

## Migration Plan

1. 先完成 package 最小闭环和 Node/workerd/production-harness 自动验证；任何 SDK/Nitro 选择写入 lockfile 与 `agent-findings.md` 摘要。
2. 以 candidate Worker version 上传而非直接生产流量，记录 Preview URL、精确 Worker ID/tag、MCP SemVer 与 build SHA 到任务定义的 evidence 文件。
3. preview smoke 通过后 promote 同一 immutable Worker version，并运行 production read-only smoke。
4. 若 tool contract 改变，继续执行 ChatGPT refresh/rescan、评估及适用 Workspace 审核；缺少权限时任务保持 pending/blocked，不误勾选。
5. Runtime 故障回滚到已记录的 stable Worker version，再验证 health、initialization、tools/list、get_server_info；Skill 内容故障只通过 Git revert/fix 处理。
