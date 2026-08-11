# Skill Router MCP Server 架构设计

## 文档定位

本文定义生产级 Remote MCP Server 主架构。

真实工作负载：Skill 数量中等、更新频率高；MCP Runtime 自身需要版本化发布、ChatGPT 兼容验收和快速回滚。

---

# 1. 总体架构

```text
ChatGPT Web
  ↓
Remote MCP / Streamable HTTP
  ↓
Cloudflare Active Worker Version
  ↓
Nitro v3 Runtime
  ↓
@modelcontextprotocol/sdk / McpServer
  ↓
Tool Definitions
  ├─ get_server_info
  ├─ list_skills
  ├─ search_skills
  └─ load_skill
  ↓
Skill Services
  ↓
GitHub Repository Adapter
  ├─ latest: GITHUB_REF -> exact SHA
  ├─ pinned: sourceCommitSha -> exact SHA
  ├─ registry @ SHA
  └─ selected Skill/related files @ same SHA
```

MVP 不要求：KV/R2/D1/DO/vector DB/snapshot session store。

---

# 2. ChatGPT Compatibility Architecture

生产协议实现优先遵循 **OpenAI 当前官方 ChatGPT MCP 构建路径**：

```text
@modelcontextprotocol/sdk
McpServer
initialization
Streamable HTTP
tools/list / tools/call
```

不要仅因为 MCP upstream 发布新 revision/SDK major 就先行改变 production server。

升级协议/SDK major 的必要条件：

```text
OpenAI current docs support
+
Inspector pass
+
ChatGPT Web Developer Mode pass
```

详细见 `chatgpt-web-mcp-compatibility-profile.md`。

---

# 3. Runtime Version Architecture

必须区分：

```text
MCP application SemVer       package.json version
negotiated MCP protocol      SDK/client initialization result
Worker Version ID/tag        Cloudflare version metadata
Worker build Git SHA         bundle build commit
Skill sourceCommitSha        per Skill snapshot
Skill metadata.version       per Skill SemVer
Registry schemaVersion       registry schema
```

这些不是同一个版本号。

---

# 4. Server Identity / Self-description

`McpServer`：

```text
name = skill-router-mcp
version = package.json.version
```

标准 MCP client 可以通过初始化/server info 识别该版本。

额外提供只读：

```text
get_server_info
```

用于返回：

- MCP application version。
- Worker Version ID/tag/timestamp。
- build Git SHA。
- Skill source repository/ref。
- Registry schema version。
- 当前完整 tools。

标准 `tools/list` 仍是 protocol tool catalog；`get_server_info.tools` 与其同源。

---

# 5. SourceSnapshot

## Latest

```text
GITHUB_REF=dev
  ↓
resolve once -> A
  ↓
all Skill reads use A
```

## Pinned

```text
search -> A
push B
load(pin=A) -> A
load(no pin) -> B
```

Git SHA 已经是可靠 snapshot id，不需要 server-side snapshot state。

---

# 6. Skill Registry

`ai-plugins/skill-registry.json` 是 Git-native discovery manifest，不是第二 Source of Truth。

v1：

```text
id
plugin
name
description
version
entry
```

不保存 deep-file mirror/content copy/cache metadata/current commit SHA。

---

# 7. 高频 Skill Maintenance

发布侧：

```text
many Skill changes
  ↓
release-ai-plugins
  ↓
one deterministic registry generation
  ↓
Git commit
```

Runtime：

```text
one call
  ↓
one exact SourceSnapshot
  ↓
one registry read
  ↓
selected Skill only
```

Skill-only push 不重新部署 Worker，也不刷新 ChatGPT tool schema。

---

# 8. 三个 Freshness Domains

## Skill Data Freshness

```text
Git HEAD / sourceCommitSha
```

Skill 内容更新由 Git source 直接驱动。

## Worker Runtime Freshness

```text
Cloudflare Active Worker Version
```

Runtime/code/config 通过 versioned Worker release 更新。

## ChatGPT Tool Metadata Freshness

```text
ChatGPT connection/workspace approved tool snapshot
```

如果 tool schema/metadata 改变，需要 ChatGPT refresh/rescan/review；Cloudflare Worker 更新不会自动刷新这一产品层 snapshot。

---

# 9. MCP Runtime Release Lane

```text
MCP Runtime change
  ↓
SemVer bump
  ↓
Node/workerd/MCP contract tests
  ↓
Nitro production build + harness
  ↓
Worker versions upload
  ↓
Preview/Staging smoke
  ↓
exact candidate production promote
  ↓
Production smoke
```

Tool contract 不变：此处即可完成 Runtime 上线。

Tool contract 变化：再执行 ChatGPT refresh/rescan/evaluation/admin review。

---

# 10. Cloudflare Version Metadata

Wrangler：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

提供 Worker ID/tag/timestamp。

build Git SHA 由构建期注入；Worker metadata 与 MCP SemVer 分开。

---

# 11. Deployment Trigger Boundary

Worker pipeline 只监听 MCP runtime/config/build inputs。

Skill-only：

```text
ai-plugins/**
```

不触发 Worker rebuild。

可用 Cloudflare Build Watch Paths 或 GitHub Actions path filters。

只允许一个 production deployment authority，避免 Cloudflare Git Integration 与 GitHub Actions 双重自动部署同一 Worker。

---

# 12. Tool Contract Release Strategy

Tool schema/metadata 属于 ChatGPT-visible contract。

默认：

```text
candidate Worker
  ↓
Preview/Staging
  ↓
100% atomic promote
  ↓
ChatGPT refresh/review（若 contract 变化）
```

不要默认让两个不兼容 tool catalog 长期 split traffic。

---

# 13. OpenAI Static Skills Import 边界

OpenAI 当前提供受限 submission-time Skills import snapshot；Skill 更新后需要重新 Scan Tools/submit。

这不作为本项目主通道。

本项目保留 live tools：

```text
list_skills
search_skills
load_skill
```

以适应高频 Git Skill 更新。

---

# 14. Search / Cache 演进

当前：

```text
one small registry
  ↓
in-memory search
```

只有真实指标要求时，才增加 commit-addressed immutable cache：

```text
registry:{commitSha}
skill:{commitSha}:{skillId}
```

不因“高频更新”误判为“数据规模巨大”。

---

# 15. Rollback Boundary

```text
Runtime code bug -> Worker rollback
Skill content bug -> Git revert/fix
Bad tool-contract release -> Worker rollback + ChatGPT tool snapshot compatibility check/refresh
```

---

# 16. Observability

安全记录/可查：

```text
mcpServerVersion
workerVersionId/tag
buildGitSha
tool name
sourceCommitSha
latency
GitHub error category
```

不记录 Secret。

---

# 17. 架构优先级

```text
ChatGPT compatibility
>
freshness / snapshot correctness
>
production version visibility / rollback
>
simple deployment/debugging
>
measured optimization
```
