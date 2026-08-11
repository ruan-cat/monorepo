# Cloudflare Worker 部署实施规范

## 1. 部署目标

将 Skill Router MCP 部署为 ChatGPT Web 可用的公网 Remote MCP。

生产协议实现以 OpenAI 当前 `Build an MCP server` compatibility profile 为准：

```text
@modelcontextprotocol/sdk
McpServer
Streamable HTTP
initialization
```

Cloudflare 负责 Worker runtime/version/deployment，不决定 ChatGPT 已批准的 tool metadata snapshot。

---

# 2. 配置职责

## Nitro

- Cloudflare preset。
- build。
- routes/runtime adapter。

## Wrangler

- Worker name / compatibility_date。
- vars / Secrets。
- custom domain/routes。
- Version Metadata binding。
- Worker versions/deployments/rollback。

MVP 不创建 KV/R2/D1/DO。

---

# 3. Endpoint

```text
https://mcp.ai.ruan-cat.com/mcp
https://mcp.ai.ruan-cat.com/health
```

MCP endpoint 使用 Streamable HTTP。

---

# 4. Wrangler MVP 示例

```toml
name = "skill-router-mcp"
compatibility_date = "<implementation-date>"

[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"

[version_metadata]
binding = "CF_VERSION_METADATA"
```

Secret：

```bash
wrangler secret put GITHUB_TOKEN
```

---

# 5. 版本信息

MCP Server：

```text
package.json.version
```

Worker runtime：

```text
CF_VERSION_METADATA.id/tag/timestamp
```

Build：

```text
buildGitSha
```

Skill：

```text
sourceCommitSha
metadata.version
```

这些必须分别表达。

---

# 6. Runtime 链路

```text
Request
  ↓
Cloudflare Edge
  ↓
Nitro Worker
  ↓
@modelcontextprotocol/sdk / McpServer
  ↓
Tool Definitions
  ↓
Skill Services
  ↓
GitHub exact SourceSnapshot
```

---

# 7. Runtime 约束

禁止：

```text
fs persistence
child_process
listen()
Node HTTP server
module-scope “current Skill” state
```

MVP 不依赖 Cloudflare storage。

---

# 8. Skill Freshness

```text
GITHUB_REF -> exact SHA once
  ↓
registry @ SHA
  ↓
selected SKILL.md @ SHA
```

Pinned load 使用 `sourceCommitSha` exact snapshot。

Skill-only update 不要求 Worker redeploy。

---

# 9. 两条 Cloudflare Trigger Lane

## Skill-only

```text
ai-plugins/**
  ↓
release/registry checks
  ↓
Git push
  ↓
NO Worker deploy
```

## MCP Runtime

```text
MCP package/config/build-input change
  ↓
SemVer bump
  ↓
tests/build
  ↓
Worker version upload
  ↓
Preview/Staging
  ↓
production promote
```

使用 Cloudflare Build Watch Paths 或 GitHub Actions path filters 防止高频 Skill 改动制造 Worker rebuild。

---

# 10. Production Deployment Authority

推荐：

```text
GitHub Actions + package-local Wrangler
```

作为唯一 production deployment authority，因为需要 tests、version tag、preview smoke、promotion、production smoke。

Cloudflare Git Integration 可替代，但不要与 GitHub Actions 同时自动部署同一个 production Worker。

---

# 11. Versioned Deploy

裸 `wrangler deploy` 会创建 version 并立即让其承担 production traffic。

更适合生产 MCP：

```text
wrangler versions upload
  ↓
Versioned Preview URL
  ↓
smoke
  ↓
wrangler versions deploy exact candidate @ 100%
```

Tag：

```text
skill-router-mcp-vX.Y.Z
```

---

# 12. Production Smoke

Candidate / active production 都验证：

```text
GET /health
MCP initialization/server info
tools/list
get_server_info
search known Skill
load pinned
```

精确确认 MCP SemVer、Worker Version ID/tag、buildGitSha。

---

# 13. ChatGPT Tool Metadata Gate

如果 tool contract 不变，Worker release + production smoke 即可更新 Runtime。

如果 tool name/schema/description/annotation 变化：

```text
Worker candidate
  ↓
MCP Inspector
  ↓
ChatGPT Developer Mode refresh/rescan
  ↓
rerun evaluation
  ↓
Workspace review/publish when applicable
```

Cloudflare Git/Actions pipeline 不会自动完成 ChatGPT 这一层。

---

# 14. 自描述

标准：

```text
tools/list
```

返回完整工具目录。

额外：

```text
get_server_info
```

返回 MCP app version、Worker metadata、build SHA、registry schema、tool catalog。

---

# 15. OpenAI Compatibility

每次 MCP SDK/protocol major upgrade 都重新核对 OpenAI 当前官方构建文档，并以 MCP Inspector + ChatGPT Web Developer Mode 真实通过为迁移条件。

不要在 Cloudflare deployment 层抢跑协议升级。

---

# 16. Rollback

Runtime bug：

```text
wrangler rollback <stable-version-id>
```

Skill content bug：Git revert/fix source，不回滚 Worker。

Tool-contract bug：Worker rollback 后同时确认 ChatGPT tool snapshot 与回滚版本兼容，必要时 refresh/review。

---

# 17. Definition of Done

- [ ] stable HTTPS `/mcp`。
- [ ] OpenAI-current MCP initialization/tools 正常。
- [ ] Version Metadata binding 正常。
- [ ] versioned candidate preview + production promote。
- [ ] get_server_info / tools/list 可验证线上版本和工具。
- [ ] Skill-only update 不触发 Worker deploy。
- [ ] Tool-contract update 有 ChatGPT refresh gate。
- [ ] 无 mandatory KV/R2/D1/DO。
