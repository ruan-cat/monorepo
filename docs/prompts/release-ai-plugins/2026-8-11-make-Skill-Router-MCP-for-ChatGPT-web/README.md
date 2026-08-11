# ChatGPT Web Skill Router MCP Server 实施文档

## 文档定位

本目录是一套生产级 Remote MCP Server 实施规格，用于指导独立 AI Agent 完成：

```text
Cloudflare Workers
+
Nitro v3
+
MCP TypeScript SDK v2
+
MCP 2026-07-28
+
GitHub exact-commit Skill Router
+
可查询/可回滚的生产发版
```

真实工作负载：**Skill 数量中等，但会高频修改、维护和新增。**设计重点是 freshness、可复现、低维护成本、可测试、版本可查询和轻量增长。

---

# 1. 项目目标

- 将 `ruan-cat/monorepo` 的 `ai-plugins` skills 暴露为 MCP Skill Provider。
- Cloudflare Worker 提供公网 HTTPS Remote MCP。
- Nitro v3 作为应用 Runtime；H3 由 Nitro 依赖树管理。
- 使用 MCP TypeScript SDK v2 server package，实现 MCP `2026-07-28` modern protocol。
- Streamable HTTP 作为 transport。
- GitHub 是唯一 Skill Source of Truth。
- `GITHUB_REF` 默认解析 exact commit SHA。
- discovery 返回 `sourceCommitSha`，`load_skill` 可选 pin 同一 snapshot。
- 第一版不要求 KV/R2/D1/DO/vector DB。
- `skill-registry.json` 是低 churn discovery index。
- MCP Server 自身拥有独立 SemVer、Cloudflare Worker version metadata 和 build Git SHA。
- ChatGPT 可以通过 `get_server_info` 查询当前 MCP/Worker/工具信息。
- Skill-only 更新不触发 Worker redeploy；MCP Runtime 更新走 versioned Worker release pipeline。

---

# 2. 强制阅读顺序

```text
ai-agent-implementation-plan.md
        ↓
README.md
        ↓
architecture.md
        ↓
implementation-spec.md
        ↓
high-frequency-skill-churn-strategy.md
        ↓
skill-registry-schema.md
        ↓
release-ai-plugins-registry-integration.md
        ↓
runtime-dependency-version-policy.md
        ↓
nitro-v3-cloudflare-integration.md
        ↓
runtime-binding-contract.md
        ↓
mcp-server-framework-selection.md
        ↓
mcp-protocol-design.md
        ↓
mcp-release-versioning-and-production-maintenance.md
        ↓
vitest-development-testing-strategy.md
        ↓
cloudflare-worker-production-testing-strategy.md
        ↓
testing-plan.md
```

真正修改 `release-ai-plugins` / registry generator / stale gate 时继续阅读：

```text
../2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/
```

---

# 3. MCP 技术决策

## Modern Protocol

目标：

```text
MCP 2026-07-28
```

服务端 SDK：

```text
@modelcontextprotocol/server v2
```

测试客户端：

```text
@modelcontextprotocol/client v2
```

不再把旧 v1 `initialize/initialized` handshake/session 当作新项目的协议完成条件。

Modern era 是 per-request stateless core，server identity 通过标准 response metadata 暴露。

---

# 4. 第一版核心 Tools

```text
get_server_info
list_skills
search_skills
load_skill
```

所有工具从统一 `toolDefinitions` 注册。

标准：

```text
tools/list
```

是当前部署完整工具目录的协议真源。

`get_server_info` 是面向 ChatGPT/人的只读诊断 facade，返回：

```text
MCP app version
MCP protocol revision
Worker Version ID/tag/timestamp
build Git SHA
registry schema version
完整 tool catalog
```

---

# 5. 版本模型

必须分开：

```text
MCP application SemVer       X.Y.Z
MCP protocol revision        2026-07-28
Cloudflare Worker Version    id/tag/timestamp
Worker build Git SHA         code build commit
Skill sourceCommitSha        per Skill snapshot
Skill metadata.version       per Skill SemVer
Registry schemaVersion       1
```

Worker build commit 和当前 Skill source commit 可以不同，这是有意设计。

详细见：

```text
mcp-release-versioning-and-production-maintenance.md
```

---

# 6. Skill Source / Registry

```text
GitHub ai-plugins
+
exact commit SourceSnapshot
```

Registry v1：

```text
id
plugin
name
description
version
entry
```

不枚举 references/templates/examples。

默认 latest：

```text
GITHUB_REF -> current HEAD -> SHA
```

可复现：

```text
search @ A -> sourceCommitSha=A
load(pin=A) -> A
```

无 server-side snapshot session。

---

# 7. Skill 发布与 MCP Runtime 发版分离

## Skill-only

```text
ai-plugins change
 -> release-ai-plugins
 -> registry generation/check
 -> Git push
 -> next unpinned Skill call reads new HEAD
```

不部署 Worker。

## MCP Runtime / config

```text
code/config change
 -> bump MCP SemVer
 -> local/workerd/production-build tests
 -> immutable Worker version upload
 -> Preview/Staging smoke
 -> exact 100% promotion
 -> Production smoke
```

生产是否真的升级，通过 `get_server_info` + active Worker version + smoke 验证，不靠“push 成功”推断。

---

# 8. Cloudflare Deployment Metadata

Wrangler 启用：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

运行时读取：

```text
Worker Version ID
tag
timestamp
```

build Git SHA 由 CI/build 阶段注入 bundle。

---

# 9. Production Deploy 策略

默认不把裸 `wrangler deploy` 当成唯一生产流程。

推荐：

```text
versions upload
  ↓
versioned Preview/Staging
  ↓
smoke
  ↓
exact version 100% promotion
  ↓
production smoke
```

Tool schema/protocol-visible 变化默认原子发布；不要让不兼容旧新版本同时长期 split traffic。

---

# 10. 自动部署触发边界

Worker pipeline 只监听 MCP runtime/config/build inputs。

Skill-only：

```text
ai-plugins/**
```

不应触发 Worker rebuild/deploy。

使用 Cloudflare Build Watch Paths 或 GitHub Actions path filters。

生产部署只保留一个 authority；本项目推荐 GitHub Actions + Wrangler。如果改用 Cloudflare Git Integration，就不要同时让 GitHub Actions 自动部署同一 production Worker。

---

# 11. 测试架构

根 monorepo 保持 Vitest 3.x。

MCP package 使用 package-local Vitest 4.1+ compatible stack。

测试层：

```text
Node Unit
  ↓
Workers Vitest/workerd
  ↓
MCP v2 Client Contract
  ↓
Nitro production build
  ↓
Wrangler createTestHarness
  ↓
Cloudflare Preview/Staging
  ↓
Production read-only smoke
  ↓
ChatGPT Web acceptance
```

版本 contract 也必须自动测试：serverInfo / `get_server_info` / `tools/list` / Worker metadata / build SHA。

---

# 12. 文档索引

## 架构 / 实施

- `architecture.md`
- `implementation-spec.md`
- `high-frequency-skill-churn-strategy.md`
- `runtime-dependency-version-policy.md`

## MCP

- `mcp-server-framework-selection.md`
- `mcp-protocol-design.md`
- `mcp-release-versioning-and-production-maintenance.md`
- `mcp-client-validation-guide.md`

## Skill Registry / Release

- `skill-registry-schema.md`
- `release-ai-plugins-registry-integration.md`
- `../2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/`

## Cloudflare

- `nitro-v3-development-guide.md`
- `nitro-v3-cloudflare-integration.md`
- `runtime-binding-contract.md`
- `cloudflare-worker-deployment.md`
- `deployment-runbook.md`
- `cloudflare-ai-gateway-strategy.md`

## 测试 / 安全

- `vitest-development-testing-strategy.md`
- `cloudflare-worker-production-testing-strategy.md`
- `testing-plan.md`
- `security-model.md`

## Agent

- `ai-agent-implementation-plan.md`
- `agent-execution-guide.md`
- `agent-handoff-checklist.md`

---

# 13. 最终架构

```text
ChatGPT Web
  ↓
Remote MCP / Streamable HTTP / 2026-07-28
  ↓
Cloudflare active Worker Version
  ↓
Nitro v3
  ↓
MCP SDK v2 / McpServer
  ↓
Tool Definitions
  ├─ get_server_info
  ├─ list_skills
  ├─ search_skills
  └─ load_skill
  ↓
GitHub Repository Adapter
  ↓
SourceSnapshot(commit SHA)
```

---

# 14. Definition of Done

## Protocol

- [ ] MCP `2026-07-28` modern era。
- [ ] 不依赖 legacy initialize/session。
- [ ] server identity version 来自 package.json。
- [ ] standard `tools/list` 完整。
- [ ] `get_server_info` 可自描述 MCP/Worker/tool 版本。

## Skill

- [ ] Registry minimal/deterministic/low-churn。
- [ ] list/search 返回 sourceCommitSha。
- [ ] load latest/pin 正常。
- [ ] Skill-only push 不要求 Worker deploy。

## Release

- [ ] MCP runtime release 有 SemVer bump。
- [ ] Worker immutable version upload + Preview/Staging。
- [ ] exact version production promotion。
- [ ] production smoke 精确确认 MCP/Worker/build version。
- [ ] rollback 可执行。

## Tests

- [ ] Node/workerd/MCP v2 client/production harness 分层。
- [ ] Preview/Staging/Production smoke。
- [ ] tool catalog/version consistency 有自动测试。

## Growth

- [ ] 无 mandatory KV/R2/D1/DO/vector DB/session store。
- [ ] 后续优化只由真实指标触发。
