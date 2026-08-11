# Cloudflare Worker 部署实施规范

## 1. 部署目标

将 Skill Router MCP Server 部署为 ChatGPT Web 可用的公网 Remote MCP。

目标：

```text
Cloudflare Workers
+
Nitro v3
+
MCP TypeScript SDK v2
+
MCP 2026-07-28
+
versioned production deployment
```

MVP 不要求 KV/R2/D1/Durable Objects。

---

# 2. 配置职责

## Nitro

- Cloudflare preset。
- build。
- route/runtime adapter。

## Wrangler

- Worker name / compatibility_date。
- vars / Secrets。
- custom domain/routes。
- `version_metadata` binding。
- Worker version upload/deployment/rollback。

不要把 Cloudflare platform config 复制进 Nitro config。

---

# 3. Endpoint

推荐：

```text
https://mcp.ai.ruan-cat.com/mcp
GET https://mcp.ai.ruan-cat.com/health
```

不要暴露未受控 GitHub proxy/debug route。

---

# 4. Wrangler MVP 配置示意

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

不要无需求增加 storage bindings。

---

# 5. Worker Runtime Version 信息

`CF_VERSION_METADATA` 用于运行时读取：

```text
Worker Version ID
Worker Version Tag
Worker Version Timestamp
```

MCP bundle 另注入：

```text
buildGitSha
```

MCP package 另提供：

```text
mcpServerVersion = package.json.version
```

三者不得混用。

---

# 6. Worker Runtime 链路

```text
Request
  ↓
Cloudflare Edge
  ↓
Nitro Worker
  ↓
MCP SDK v2 / modern protocol
  ↓
Tool Definitions
  ↓
Skill Service
  ↓
GitHub Repository Adapter
  ↓
exact commit SourceSnapshot
```

---

# 7. Runtime 约束

禁止：

```text
fs persistence
child_process
listen()
Node HTTP server
MCP session store
```

允许 Worker/Web APIs。

MCP 2026-era 的 per-request stateless model 不需要 transport session persistence。

---

# 8. Skill Freshness

```text
GITHUB_REF=dev
  ↓
resolve HEAD -> exact SHA once per unpinned call
  ↓
registry @ SHA
  ↓
selected SKILL.md @ SHA
```

Pinned `sourceCommitSha` 使用 exact historical snapshot。

Skill-only update 不要求 Worker redeploy。

---

# 9. 两条 CI/CD 触发链

## Skill-only

```text
ai-plugins/**
  ↓
release-ai-plugins / registry check
  ↓
Git push
  ↓
NO Worker deploy
```

## MCP Runtime

```text
MCP package / config / runtime dependency change
  ↓
MCP SemVer bump
  ↓
tests/build
  ↓
Worker version upload
  ↓
Preview/Staging
  ↓
production promotion
```

使用 Cloudflare Build Watch Paths 或 GitHub Actions path filters 防止 Skill 高频更新触发无意义 Worker rebuild。

---

# 10. Production Deployment Authority

本项目推荐：

```text
GitHub Actions + package-local Wrangler
```

作为唯一 production deployment authority，因为需要多层 tests、version tag、preview smoke 与 exact promotion。

Cloudflare Git Integration 也是有效方案，但如果使用它，就不要再让 GitHub Actions 自动部署同一个 production Worker。

---

# 11. 推荐 Versioned Deploy

对 production 不推荐直接把裸：

```bash
wrangler deploy
```

作为唯一流程，因为它创建版本并立即切 100% traffic。

推荐：

```text
wrangler versions upload
  ↓
versioned Preview URL
  ↓
smoke
  ↓
wrangler versions deploy exact-version@100%
```

Version tag：

```text
skill-router-mcp-vX.Y.Z
```

Version message：

```text
build Git SHA + release summary
```

---

# 12. Tool Contract 发布策略

新增/删除/修改 tool schema 属于 protocol-visible change。

默认：Preview/Staging 通过后原子 promote 100%。

不要默认让旧新不兼容 Worker 版本长期 split traffic。

Gradual deployment 仅用于完全 backward-compatible internal change，并在单独设计 compatibility/version affinity 后使用。

---

# 13. Production 验收

发布 candidate：

```text
health
modern serverInfo
tools/list
get_server_info
search known Skill
load pinned
```

production promote 后重复最小 smoke，并精确确认：

```text
expected MCP SemVer
expected Worker Version ID/tag
expected buildGitSha
```

不再使用 legacy `initialize` 作为 MCP `2026-07-28` production 成功条件。

---

# 14. 自描述版本/工具能力

标准：

```text
tools/list
```

返回完整当前工具目录。

额外只读：

```text
get_server_info
```

返回：

- MCP server application version。
- protocol revision。
- build Git SHA。
- Worker version metadata。
- registry schema version。
- current tool catalog。

这样可以从 ChatGPT 对话直接验证线上真正部署的是哪一版。

---

# 15. 回滚

MCP Runtime 代码问题：

```bash
wrangler rollback <stable-version-id>
```

然后重新验证 health/serverInfo/tools/get_server_info。

Skill 内容问题：Git revert/fix 目标 branch，不回滚 Worker。

---

# 16. AI Agent 实施顺序

```text
1. Nitro Worker
2. MCP SDK v2 modern protocol
3. toolDefinitions + get_server_info
4. vars/Secret/version_metadata binding/build SHA
5. GitHub SourceSnapshot
6. automated tests
7. Worker version upload
8. Preview/Staging smoke
9. exact 100% production promotion
10. production smoke / ChatGPT Web acceptance
```

详细长期发版规范：

```text
mcp-release-versioning-and-production-maintenance.md
```
