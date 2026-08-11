# Skill Router MCP Server 部署运行手册

## 目标

本文描述生产部署、版本确认、ChatGPT tool metadata 更新和回滚。

核心：

```text
Skill Content Release
!= Worker Runtime Release
!= ChatGPT Tool Metadata Release
```

---

# 1. Production Endpoint

```text
https://mcp.ai.ruan-cat.com/mcp
GET https://mcp.ai.ruan-cat.com/health
```

运行：Cloudflare Workers + Nitro v3 + OpenAI-current `@modelcontextprotocol/sdk` / `McpServer`。

---

# 2. Wrangler 配置

```toml
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

MVP 无 KV/R2/D1/DO。

---

# 3. MCP Application SemVer

MCP package `package.json.version` 是 server application version。

```text
PATCH = compatible internal fix
MINOR = backward-compatible new tool/optional contract
MAJOR = breaking tool/schema behavior
```

Skill version 更新不 bump MCP Server version。

---

# 4. Build / Deployment Metadata

Worker bundle 包含 buildGitSha。

Cloudflare binding 提供 Worker Version ID/tag/timestamp。

`get_server_info` / health 用于报告安全 metadata。

---

# 5. Local / CI Gate

```text
typecheck
Node unit
Workers Vitest/workerd
MCP SDK initialization/tools contract
Nitro production build
createTestHarness integration
```

SDK/protocol 标准以当前 OpenAI ChatGPT official compatibility profile 为准。

---

# 6. Candidate Version Upload

推荐：

```text
wrangler versions upload
```

Tag：

```text
skill-router-mcp-vX.Y.Z
```

Message：build Git SHA + summary。

获得 immutable Worker Version ID / Preview URL。

---

# 7. Preview / Staging Smoke

验证：

```text
GET /health
MCP initialization/server info
tools/list
get_server_info
search known Skill
load pinned
load latest
```

精确确认 candidate：

```text
MCP SemVer
Worker Version ID/tag
buildGitSha
```

---

# 8. Production Promotion

Preview/Staging 通过后，把刚测试过的 exact Worker version promote 到 production。

Tool contract 变化默认：

```text
100% atomic promotion
```

避免不兼容 Worker 同时返回不同 tool catalog/schema。

---

# 9. Production Post-deploy Smoke

```text
health
initialization/server info
tools/list
get_server_info
search known Skill
load pinned
```

必须确认线上 exact MCP/Worker/build version。

---

# 10. ChatGPT Tool Metadata Gate

如果 Runtime-only fix 且 tool metadata/schema 不变：Production smoke 后 Runtime release 完成。

如果以下变化：

```text
tool name/title/description
input/output schema
annotations
plugin/server metadata relevant to ChatGPT scan
```

继续：

```text
MCP Inspector
  ↓
ChatGPT Developer Mode refresh/rescan connection
  ↓
rerun evaluation/use cases
  ↓
Workspace review/publish when applicable
```

不要把 Cloudflare 上线误认为 ChatGPT 已经刷新新工具定义。

---

# 11. Standard Tool / Version Query

标准工具目录：

```text
tools/list
```

用户版本诊断：

```text
get_server_info
```

第一版：

```text
get_server_info
list_skills
search_skills
load_skill
```

`get_server_info.tools` 与 toolDefinitions 同源。

---

# 12. Skill-only Release

```text
ai-plugins change
  ↓
release-ai-plugins
  ↓
registry check/generation
  ↓
Git push
  ↓
next unpinned call reads new HEAD
```

不上传 Worker version，不刷新 ChatGPT tools。

---

# 13. Auto-deploy Trigger Boundary

Worker CI 只监听 MCP runtime/config/build inputs。

`ai-plugins/**` 和纯 docs 不单独触发 Worker deploy。

Cloudflare Build Watch Paths 或 GitHub Actions path filters 实现。

推荐 GitHub Actions + package-local Wrangler 为唯一 production deployment authority；若使用 Cloudflare Git integration，则停用另一条自动 production deploy。

---

# 14. OpenAI Compatibility Upgrade

每次 MCP SDK/protocol major upgrade，先重新核对 OpenAI 当前官方 `Build an MCP server` 文档。

必须：

```text
OpenAI docs support
Inspector pass
ChatGPT Developer Mode pass
```

再改 production baseline。

---

# 15. 回滚

## Runtime bug

```text
wrangler rollback stable Worker version
```

随后 health/initialization/tools/get_server_info smoke。

## Skill content bug

Git revert/fix，产生新 Skill source HEAD，不回滚 Worker。

## Tool-contract bug

Worker rollback 后，还要确认 ChatGPT 当前 tool metadata snapshot 与回滚版本兼容；必要时 refresh/review 恢复。

---

# 16. Release Completion Evidence

Runtime release：

```text
1. SemVer bump
2. automated gates green
3. production build green
4. immutable Worker version uploaded
5. Preview/Staging green
6. exact version promoted
7. Production smoke green
8. get_server_info returns expected version
9. tools/list matches expected catalog
10. rollback target known
```

Tool-contract release 额外：

```text
11. Developer Mode tools refreshed/rescanned
12. eval/use cases rerun
13. workspace review/publish completed when applicable
```

---

# 17. ChatGPT Web Acceptance

版本：

```text
告诉我当前 Skill Router MCP 的服务版本、Cloudflare 部署版本、构建 commit，以及全部可用工具。
```

Skill snapshot：

```text
搜索一个 Skill，并加载你刚才搜索到的同一个 sourceCommitSha 版本。
```
