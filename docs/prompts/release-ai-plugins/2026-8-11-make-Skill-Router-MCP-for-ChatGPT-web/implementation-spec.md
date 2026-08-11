# Skill Router MCP Server 生产实现规格

## 文档定位

本文指导独立 AI Agent 实现生产级 Remote MCP Server。

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
GitHub exact-commit Skill Source
+
可查询/可回滚的 Worker release
```

真实工作负载：Skill 数量中等、更新频率高。

---

# 1. 核心技术栈

| 层 | 技术 |
| --- | --- |
| Serverless Runtime | Cloudflare Workers |
| Application Runtime | Nitro v3 |
| HTTP Runtime Layer | Nitro-managed H3 |
| MCP Server SDK | `@modelcontextprotocol/server` v2 |
| MCP Protocol | `2026-07-28` modern era |
| Transport | Streamable HTTP |
| Skill Source of Truth | GitHub `ai-plugins` |
| Skill Version Boundary | Git commit SHA |
| Discovery Index | `ai-plugins/skill-registry.json` |
| Worker Release | Cloudflare Versions & Deployments |
| Persistent Storage | MVP 不需要 KV/R2/D1/DO |
| Search | Registry 内存关键词/token matching |

---

# 2. 依赖与版本原则

MCP package 直接管理：

```text
nitro
@modelcontextprotocol/server
@modelcontextprotocol/client   # 测试/contract 使用
wrangler
```

H3 由 Nitro 依赖树管理。

MCP package `package.json.version` 是 MCP application SemVer 的唯一来源。

所有具体依赖版本由 package.json + `pnpm-lock.yaml` 固化。

---

# 3. MCP Modern Protocol

禁止新实现继续以 v1 legacy 模型为架构：

```text
initialize
initialized
Mcp-Session-Id
```

MCP `2026-07-28` 是 per-request stateless core。

SDK v2 负责：

- modern wire protocol。
- server identity `_meta`。
- discovery/capability protocol surface。
- `tools/list` / `tools/call`。
- schema/error handling。

Nitro endpoint 只做最薄 runtime adapter。

---

# 4. 统一 Tool Definitions

第一版核心 tools：

```text
get_server_info
list_skills
search_skills
load_skill
```

实现必须有单一 `toolDefinitions` source，同步驱动：

- SDK tool registration。
- 标准 `tools/list`。
- `get_server_info.tools`。
- tests。

禁止硬编码多份 tool catalog。

---

# 5. `get_server_info`

该 tool 提供面向 ChatGPT/人的自描述信息：

```text
MCP server name/version
MCP protocol revision
Worker Version ID/tag/timestamp
Worker build Git SHA
Skill source repository/ref
Registry schemaVersion
完整当前 tool catalog
```

它默认不访问 GitHub HEAD。

MCP Server SemVer 来自 package.json；Worker metadata 来自 `CF_VERSION_METADATA`；build Git SHA 来自 build-time injection。

---

# 6. Source Snapshot

未 pin tool call：

```text
GITHUB_REF
  ↓
resolve exact SHA once
  ↓
SourceSnapshot
  ↓
all Skill reads use commitSha
```

概念类型：

```ts
interface SourceSnapshot {
  repository: string
  ref?: string
  commitSha: string
}
```

list/search/load 返回 `sourceCommitSha`。

---

# 7. Optional Cross-tool Snapshot Pin

```text
search @ A
push B
load(pin=A) -> A
load(no pin) -> latest B
```

`sourceCommitSha` pin 只能指定 configured owner/repo 内的 exact commit，不允许输入任意 repository。

不需要 KV/DO/session token store。

---

# 8. 项目概念结构

```text
skill-router-mcp/
├── package.json                  # MCP application SemVer
├── mcp/
│   ├── create-server.ts
│   ├── tool-definitions.ts
│   └── tools/
│       ├── get-server-info.ts
│       ├── list-skills.ts
│       ├── search-skills.ts
│       └── load-skill.ts
├── services/
│   ├── skill-router.ts
│   ├── source-snapshot.ts
│   └── server-info.ts
├── repositories/
│   └── github-skill-source.ts
├── runtime/
│   ├── bindings.ts
│   ├── deployment-info.ts
│   └── build-info.generated.ts
├── server/api/
│   ├── mcp.post.ts
│   └── health.get.ts
├── tests/
├── nitro.config.ts
└── wrangler.toml
```

实际路径可按 monorepo/Nitro 约定调整，职责边界不可改变。

---

# 9. GitHub Repository Adapter

唯一接触 `GITHUB_TOKEN` 的边界。

负责：

- resolve configured ref -> exact SHA。
- registry @ SHA。
- selected Skill @ SHA。
- related file @ SHA。
- GitHub error -> domain error。

禁止 tool/service 自己拼 GitHub authorization header。

---

# 10. Skill Registry

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

运行时：

```text
registry @ SourceSnapshot
  ↓
list/search
  ↓
selected entry
  ↓
SKILL.md @ same SHA
```

---

# 11. 深层文件

Cloud MCP：

1. 先读取选中 `SKILL.md`。
2. 只有实际需要才读取 related file。
3. 限制路径在允许 Skill 范围。
4. 所有读取同 SHA。

不要默认递归加载 Skill 目录。

---

# 12. Runtime / Deployment Metadata

Wrangler 增加：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

运行时 DeploymentInfo：

```text
workerVersionId
workerVersionTag
workerVersionTimestamp
buildGitSha
```

其中 `buildGitSha` 在 CI/build 阶段注入 bundle。

这些信息供：

- `get_server_info`。
- `/health`。
- logs。
- production smoke。

---

# 13. Skill 发布与 Worker 发版分离

## Skill-only

```text
ai-plugins change
 -> release-ai-plugins
 -> Git push
 -> new MCP Skill snapshot
```

不部署 Worker。

## MCP runtime/config

```text
MCP code/config change
 -> bump MCP SemVer
 -> tests/build
 -> Worker version upload
 -> preview/staging smoke
 -> 100% promote
 -> production smoke
```

详细见：

```text
mcp-release-versioning-and-production-maintenance.md
```

---

# 14. Worker Release 默认策略

生产 protocol-visible 改动默认采用：

```text
immutable version upload
  ↓
preview/staging validation
  ↓
exact version 100% promote
```

不建议 tool schema 改动直接做双版本 gradual split，因为两个版本可能暴露不同 tool catalog。

Gradual rollout 仅用于明确向后兼容的内部改动，并在另行验证 version-affinity/compatibility 后采用。

---

# 15. 自动部署 Path Boundary

Worker pipeline 只应在 MCP runtime/config/build input 变化时触发。

Skill-only：

```text
ai-plugins/**
```

不应导致 Worker redeploy。

如果使用 Cloudflare Git integration，配置 Build Watch Paths；如果使用 GitHub Actions，则配置 workflow path filter。

不要同时让 Cloudflare Git integration 与 GitHub Actions 对同一 production Worker 自动 deploy。

---

# 16. Testing

必须分层：

```text
Node Vitest unit
Workers Vitest/workerd
Nitro production build
Wrangler createTestHarness integration
Cloudflare preview/staging smoke
production read-only smoke
ChatGPT Web acceptance
```

重点新增版本 contract tests：

- serverInfo.version = package version。
- `get_server_info.server.version` = package version。
- `get_server_info.tools` 与 toolDefinitions 同源。
- Worker version metadata 可读。
- buildGitSha 可读。
- production promote 后线上返回预期版本。

---

# 17. Search / Storage

中等 Skill 数量继续使用：

```text
one registry fetch
+
in-memory matching
+
selected Skill fetch
```

MVP 不需要：

- KV/R2/D1/DO。
- vector DB。
- embedding pipeline。
- incremental Registry DB。

未来 cache 仅使用 commit-addressed immutable keys。

---

# 18. 实施顺序

```text
1. package + SemVer + lockfile
2. Nitro v3 Cloudflare Worker
3. MCP SDK v2 modern protocol
4. server identity + toolDefinitions
5. get_server_info
6. runtime binding + version metadata + build SHA
7. GitHub Repository Adapter
8. latest/pinned SourceSnapshot
9. registry list/search
10. exact-SHA load_skill
11. Node/workerd/production harness tests
12. version upload + preview/staging + promote pipeline
13. production smoke + ChatGPT Web acceptance
```

---

# 19. Definition of Done

- [ ] MCP `2026-07-28` modern era 工作。
- [ ] 不以 legacy initialize/session 为完成条件。
- [ ] MCP server identity version 来自 package.json。
- [ ] `get_server_info` 可查询 MCP/Worker/build/tool metadata。
- [ ] 标准 `tools/list` 返回完整 tool catalog。
- [ ] list/search 返回 sourceCommitSha。
- [ ] load 支持 latest/pin。
- [ ] Worker version metadata 可读。
- [ ] Skill-only change 不重新部署 Worker。
- [ ] MCP runtime change 有 versioned preview/promote/rollback 流程。
- [ ] Worker 无 mandatory Cloudflare storage 也完整运行。
- [ ] GitHub Token 不泄露。
