# ChatGPT Web Skill Router MCP Server 实施文档

## 文档定位

本目录是一套生产级 Remote MCP Server 实施规格。

产品目标：

```text
ChatGPT Web Developer Mode 真实可用
+
Cloudflare Worker 稳定部署
+
高频 Skill 更新无需 Worker redeploy
+
MCP Runtime 版本可查询/可回滚
+
Tool Contract 更新有 ChatGPT refresh gate
```

真实工作负载：Skill 数量中等，但会高频修改、维护和新增。

---

# 1. 核心技术决策

```text
Cloudflare Workers
+
Nitro v3
+
Nitro-managed H3
+
OpenAI 当前推荐的 @modelcontextprotocol/sdk
+
McpServer
+
Streamable HTTP
+
GitHub exact-commit Skill Source
```

首要原则：

> **生产 MCP compatibility 以 OpenAI 当前 ChatGPT 官方构建文档和真实 Developer Mode 验收为准，不抢跑 MCP upstream 尚未被 ChatGPT 明确支持的新 major/protocol。**

详细：

```text
chatgpt-web-mcp-compatibility-profile.md
```

---

# 2. AI Agent 强制阅读顺序

```text
ai-agent-implementation-plan.md
  ↓
README.md
  ↓
architecture.md
  ↓
implementation-spec.md
  ↓
chatgpt-web-mcp-compatibility-profile.md
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

真正修改 `release-ai-plugins` / registry generator / stale gate 时，继续进入：

```text
../2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/
```

---

# 3. MCP Server Identity

当前 OpenAI 官方推荐：

```ts
new McpServer({
  name: "skill-router-mcp",
  version: packageVersion,
})
```

MCP package `package.json.version` 是 application SemVer 唯一来源。

初始化/server info 让标准 MCP client 识别 server name/version。

---

# 4. 第一版核心 Tools

```text
get_server_info
list_skills
search_skills
load_skill
```

统一 `toolDefinitions` 驱动 SDK registration、`tools/list`、`get_server_info.tools` 和 tests。

## `get_server_info`

让 ChatGPT 可以直接回答：

- MCP 服务版本。
- Cloudflare Worker Version ID/tag/timestamp。
- Worker build Git SHA。
- Skill source repository/ref。
- Registry schema version。
- 当前全部 tools。

## `list_skills` / `search_skills`

返回 `sourceCommitSha`。

## `load_skill`

支持：

```text
latest HEAD
+
optional sourceCommitSha pin
```

---

# 5. 版本模型

分开：

```text
MCP application SemVer       package.json version
MCP negotiated protocol      SDK/initialization compatibility
Worker Version ID/tag        Cloudflare version metadata
Worker build Git SHA         code bundle commit
Skill sourceCommitSha        per Skill query snapshot
Skill metadata.version       per Skill version
Registry schemaVersion       registry format
```

Worker build commit 和 latest Skill source commit 可以不同，这是正常设计。

---

# 6. Skill Source / Registry

GitHub `ai-plugins` 是唯一 Skill Source of Truth。

Registry v1：

```text
id
plugin
name
description
version
entry
```

不枚举 references/templates/examples，避免高频 deep-file maintenance 制造第二套高 churn index。

默认：

```text
GITHUB_REF -> exact SHA once per unpinned call
```

可复现：

```text
search @ A -> sourceCommitSha=A
load(pin=A) -> A
```

---

# 7. 三种更新不能混为一谈

## Skill Content Update

```text
ai-plugins change
 -> release-ai-plugins
 -> Git push
 -> next Skill call reads new Git snapshot
```

不需要 Worker deploy，也不需要 ChatGPT tool rescan。

## MCP Runtime Internal Update

```text
code/config change
 -> MCP SemVer bump
 -> tests/build
 -> Worker version upload
 -> Preview/Staging
 -> exact production promote
 -> production smoke
```

## MCP Tool Contract Update

如果：

```text
tool name/title/description
input/output schema
annotations
```

变化，则在 Runtime release 之外必须：

```text
ChatGPT Developer Mode refresh/rescan
  ↓
rerun evaluation/use cases
  ↓
Workspace review/publish when applicable
```

Cloudflare 自动部署不会自动刷新 ChatGPT 已批准的 tool metadata snapshot。

---

# 8. Cloudflare Worker Version Metadata

Wrangler：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

运行时读取：

```text
id
tag
timestamp
```

build Git SHA 由构建期注入。

---

# 9. Production Release

生产推荐：

```text
all automated gates
  ↓
wrangler versions upload
  ↓
versioned Preview/Staging smoke
  ↓
exact candidate 100% promote
  ↓
Production smoke
```

Tool contract 变化默认原子上线，避免两个 Worker 版本同时暴露不同 catalog/schema。

---

# 10. 自动部署 Path Boundary

Worker build/deploy 只监听 MCP runtime/config/build input。

Skill-only：

```text
ai-plugins/**
```

不触发 Worker redeploy。

推荐 GitHub Actions + package-local Wrangler 为唯一 production deployment authority；若用 Cloudflare Git Integration，则避免另一条 pipeline 同时自动 deploy 同一 Worker。

---

# 11. Testing Architecture

root monorepo Vitest 3.x 保持现状。

MCP package 使用 package-local Vitest 4.1+ compatible Cloudflare stack。

```text
Node unit
  ↓
Workers Vitest/workerd
  ↓
MCP SDK client contract
  ↓
Nitro production build
  ↓
Wrangler createTestHarness
  ↓
Cloudflare Preview/Staging
  ↓
Production smoke
  ↓
ChatGPT Web acceptance
```

SDK/protocol 成功标准以当前 OpenAI ChatGPT compatibility profile 为准。

---

# 12. OpenAI Skills Import Extension 边界

当前 OpenAI 支持一个受限、submission-time 的 static Skills import snapshot。

它不作为本项目 live Skill Router 主通道，因为 Skill 高频变化后需要重新 Scan Tools/submit，不符合：

```text
next live tool call reads newest Git snapshot
```

的设计目标。

---

# 13. 文档索引

## 架构 / Compatibility / Release

- `architecture.md`
- `implementation-spec.md`
- `chatgpt-web-mcp-compatibility-profile.md`
- `mcp-release-versioning-and-production-maintenance.md`
- `high-frequency-skill-churn-strategy.md`
- `runtime-dependency-version-policy.md`

## MCP

- `mcp-server-framework-selection.md`
- `mcp-protocol-design.md`
- `mcp-client-validation-guide.md`

## Registry / Release Bridge

- `skill-registry-schema.md`
- `release-ai-plugins-registry-integration.md`
- `../2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/`

## Cloudflare

- `nitro-v3-development-guide.md`
- `nitro-v3-cloudflare-integration.md`
- `runtime-binding-contract.md`
- `cloudflare-worker-deployment.md`
- `deployment-runbook.md`

## Testing / Security / Agent

- `vitest-development-testing-strategy.md`
- `cloudflare-worker-production-testing-strategy.md`
- `testing-plan.md`
- `security-model.md`
- `agent-execution-guide.md`
- `agent-handoff-checklist.md`

---

# 14. Definition of Done

- [ ] ChatGPT Web 当前官方 MCP path 真实可用。
- [ ] McpServer stable name/version。
- [ ] initialization / tools/list / tools/call 正常。
- [ ] `get_server_info` 可查 MCP/Worker/build/tool 信息。
- [ ] Registry low-churn/deterministic。
- [ ] latest/pin 正常。
- [ ] Skill-only update 不触发 Worker/tool metadata release。
- [ ] Runtime update 有 versioned Worker release/smoke/rollback。
- [ ] Tool contract update 有 ChatGPT refresh/review gate。
- [ ] Future MCP major 仅在 OpenAI compatibility 明确后升级。
- [ ] 无 mandatory KV/R2/D1/DO/vector DB。
