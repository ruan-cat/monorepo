# Skill Router MCP Server 架构设计

## 文档定位

本文定义生产级 Remote MCP Server 主架构。

真实工作负载：Skill 数量中等、更新频率高；MCP Runtime 本身需要长期版本化发布和可回滚维护。

优先级：

```text
correctness / freshness
>
protocol compatibility
>
production version visibility
>
simple deployment/debugging
>
measured optimization
```

---

# 1. 总体架构

```text
ChatGPT Web
  ↓
Remote MCP / Streamable HTTP / MCP 2026-07-28
  ↓
Cloudflare Active Worker Version
  ↓
Nitro v3 Runtime
  ↓
MCP TypeScript SDK v2 / McpServer
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
  ├─ skill-registry.json @ SHA
  └─ selected Skill/related files @ same SHA
```

MVP 没有 mandatory：

```text
KV
R2
D1
Durable Objects
vector DB
MCP session store
```

---

# 2. Protocol Architecture

目标协议：

```text
MCP 2026-07-28
```

TypeScript SDK：v2 split packages。

Modern core 是 per-request stateless；不再把：

```text
initialize
initialized
Mcp-Session-Id
```

作为新架构前置 lifecycle。

Server identity 由 modern response serverInfo metadata 暴露；工具目录由标准 `tools/list` 暴露。

---

# 3. Runtime Version Architecture

MCP Runtime 必须同时可区分：

```text
MCP app SemVer             package.json version
MCP protocol revision      2026-07-28
Worker Version ID/tag      Cloudflare version metadata
Worker build Git SHA       build-time injected commit
```

Wrangler：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

`get_server_info` 把这些安全 metadata 组合成面向 ChatGPT/人的只读诊断结果。

不要把 Worker Version ID 填成 MCP SemVer。

---

# 4. SourceSnapshot 一致性

## Latest

```text
GITHUB_REF=dev
  ↓
resolve once -> A
  ↓
all Skill reads in this tool call use A
```

## Pinned

```text
search -> sourceCommitSha=A
branch -> B
load(pin=A) -> A
load(no pin) -> B
```

Git commit SHA 是已有不可变 snapshot identifier，不需要 server session/state store。

---

# 5. 版本维度分离

Skill 数据还有：

```text
Skill sourceCommitSha
Skill metadata.version
Registry schemaVersion
```

因此：

```text
Worker build at code commit X
Skill repository later advances A -> B -> C
production Worker stays version N
latest Skill call may read C
```

这是正常行为。

---

# 6. Skill Registry

`ai-plugins/skill-registry.json` 是 Git-native discovery manifest，不是数据库/缓存/事实来源。

v1：

```text
id
plugin
name
description
version
entry
```

不保存 references/templates/examples/content copy/sourceCommitSha/cache metadata。

---

# 7. 高频 Skill 维护

发布侧：

```text
many Skill changes
  ↓
release-ai-plugins
  ↓
one registry generation
  ↓
one Git commit
```

运行时：

```text
one tool call
  ↓
one SourceSnapshot
  ↓
one registry read
  ↓
selected Skill only
```

Skill-only push 不要求 Worker redeploy。

---

# 8. MCP Runtime Release Lane

MCP code/config/tool contract 变化：

```text
SemVer bump
  ↓
Node/workerd/MCP client tests
  ↓
Nitro production build
  ↓
createTestHarness
  ↓
Worker versions upload
  ↓
Preview/Staging smoke
  ↓
exact version 100% promote
  ↓
Production smoke
```

Tool schema/protocol-visible 变化默认原子 promote，避免两个版本返回不同 tool catalog。

详细见：

```text
mcp-release-versioning-and-production-maintenance.md
```

---

# 9. Tool Catalog / Self-description

统一：

```text
toolDefinitions
```

驱动：

- SDK registration。
- `tools/list`。
- `get_server_info.tools`。
- contract tests。

用户问“当前 MCP 是什么版本、有哪些工具”时，ChatGPT 可以调用 `get_server_info`；标准客户端仍以 `tools/list` 为正式工具目录。

---

# 10. 深层文件

先读 `SKILL.md @ SHA`，related files 按需、同 SHA、限制在已选 Skill 允许范围。

不默认递归 Skill tree，不把 deep-file index 放回 Registry v1。

---

# 11. Search

中等 Skill 数量：

```text
one registry
  ↓
in-memory id/name/description/plugin matching
```

MVP 不使用 vector DB/embedding/search database。

---

# 12. Cache 演进

只有真实指标需要时：

```text
registry:{commitSha}
skill:{commitSha}:{skillId}
```

使用 immutable commit-addressed cache。

Release side 永远不感知 cache。

---

# 13. 依赖边界

## Nitro v3

Runtime/build/routes/Cloudflare adapter。

## H3

Nitro-managed HTTP runtime layer。

## MCP SDK v2

MCP `2026-07-28` wire protocol、server identity、tools lifecycle。

## GitHub Adapter

只读 credential、ref/SHA/content/error mapping。

## DeploymentInfo Provider

Cloudflare Worker version metadata + build Git SHA；不访问 GitHub Token。

---

# 14. 部署触发边界

Skill-only `ai-plugins/**` 不应自动部署 Worker。

Worker pipeline 只监听 MCP runtime/config/shared build inputs，通过 Cloudflare Build Watch Paths 或 GitHub Actions path filters 实现。

同一个 production Worker 只能有一个自动 deployment authority。

---

# 15. 回滚边界

```text
MCP Runtime bug -> Cloudflare Worker rollback
Skill content bug -> Git revert/fix Skill source
```

不要混用。

---

# 16. 轻量观测

至少记录/可查：

```text
mcpServerVersion
workerVersionId/tag
buildGitSha
sourceCommitSha
tool name
GitHub request/error category
latency
```

不记录 Secret。

---

# 17. 演进 Guardrails

```text
Level 0: exact Git + small registry + in-memory search + versioned Worker deploy
Level 1: request dedupe/conditional fetch/observability improvements
Level 2: immutable cache only if measured
Level 3: complex storage/search only if real scale/quality requires
```

禁止因为“高频维护”直接跳到数据库/vector/cache/session 架构。
