# Skill Router MCP Server 生产实现规格

## 文档定位

本文指导独立 AI Agent 实现生产级 Remote MCP Server。

目标：

```text
Cloudflare Workers
+
Nitro v3
+
OpenAI-current MCP compatibility profile
+
@modelcontextprotocol/sdk / McpServer
+
GitHub exact-commit Skill Source
+
versioned Worker production release
```

真实工作负载：Skill 数量中等、更新频率高。

---

# 1. 核心技术栈

| 层 | 技术 |
| --- | --- |
| Serverless Runtime | Cloudflare Workers |
| Application Runtime | Nitro v3 |
| HTTP Runtime | Nitro-managed H3 |
| MCP SDK | OpenAI 当前推荐的 `@modelcontextprotocol/sdk` |
| MCP Server | `McpServer` |
| Transport | Streamable HTTP |
| Skill Source | GitHub `ai-plugins` |
| Skill Snapshot | Git exact commit SHA |
| Registry | `ai-plugins/skill-registry.json` |
| Worker Release | Cloudflare Versions & Deployments |
| Persistent Cloudflare Storage | MVP 不需要 |

不要把 MCP upstream 比 OpenAI ChatGPT 当前支持更激进的 protocol/SDK major 写死为 production baseline。

---

# 2. 直接依赖原则

MCP package 直接管理：

```text
nitro
@modelcontextprotocol/sdk
zod
wrangler
```

测试使用同一 MCP SDK package/version。

H3 由 Nitro 依赖树管理。

具体 versions 由 package.json + `pnpm-lock.yaml` 固化。

---

# 3. MCP 实现原则

OpenAI 当前官方构建路径：

```text
McpServer
+
initialization / server info
+
tools/list / tools/call
+
Streamable HTTP
```

禁止：

- 手写 JSON-RPC lifecycle。
- 自定义 REST imitation。
- 在 Nitro handler 重写 MCP negotiation。

如果未来迁移 MCP SDK major，必须先通过 `chatgpt-web-mcp-compatibility-profile.md` 的迁移门槛。

---

# 4. 单一 Tool Definitions

第一版核心：

```text
get_server_info
list_skills
search_skills
load_skill
```

统一 `toolDefinitions` 驱动：

- SDK `registerTool`。
- 标准 `tools/list`。
- `get_server_info.tools`。
- tests。

---

# 5. `get_server_info`

返回面向 ChatGPT/人的生产自描述：

```text
server.name
server.version
server.buildGitSha

deployment.workerVersionId
deployment.workerVersionTag
deployment.workerVersionTimestamp

skillSource.repository
skillSource.ref
registrySchemaVersion

tools[]
```

MCP application version 来自 package.json。

Worker metadata 来自 `CF_VERSION_METADATA`。

build Git SHA 来自构建期注入。

默认不查询 GitHub HEAD。

---

# 6. SourceSnapshot

未 pin：

```text
GITHUB_REF
  ↓
resolve exact commit SHA once
  ↓
all Skill reads use that SHA
```

Pinned：

```text
sourceCommitSha input
  ↓
validate within configured repo
  ↓
use exact SHA
```

list/search/load 返回 `sourceCommitSha`。

---

# 7. 项目概念结构

```text
skill-router-mcp/
├── package.json
├── mcp/
│   ├── create-server.ts
│   ├── tool-definitions.ts
│   └── tools/
│       ├── get-server-info.ts
│       ├── list-skills.ts
│       ├── search-skills.ts
│       └── load-skill.ts
├── services/
│   ├── server-info.ts
│   ├── skill-router.ts
│   └── source-snapshot.ts
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

实际路径可按仓库 convention 调整，职责不可混淆。

---

# 8. GitHub Repository Adapter

唯一接触 `GITHUB_TOKEN`。

负责：

- ref -> SHA。
- registry @ SHA。
- selected Skill @ SHA。
- related file @ SHA。
- upstream errors -> domain errors。

Tool/Service 不自己拼 Authorization。

---

# 9. Registry

v1：

```text
id
plugin
name
description
version
entry
```

不枚举 deep files。

list/search 读 registry；load 根据 entry 读同 SHA SKILL.md。

---

# 10. 深层文件

先加载选中 `SKILL.md`。

后续 related files：

- 按需。
- 同 sourceCommitSha。
- path 不逃逸 Skill 范围。
- 不默认递归全部内容。

---

# 11. Runtime / Deployment Metadata

Wrangler：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

DeploymentInfo：

```text
workerVersionId
workerVersionTag
workerVersionTimestamp
buildGitSha
```

用于 `get_server_info` / health / logs / production smoke。

---

# 12. 三个发布域

## Skill Data

```text
ai-plugins change
 -> release-ai-plugins
 -> Git push
 -> next Skill call sees new source snapshot
```

不部署 Worker，不刷新 ChatGPT tool metadata。

## MCP Runtime Internal

```text
code/config change
 -> SemVer bump
 -> tests/build
 -> Worker version upload
 -> Preview/Staging
 -> production promotion
 -> smoke
```

## MCP Tool Contract

当 tool name/schema/description/annotation 变化：

```text
Runtime release
+
ChatGPT Developer Mode refresh/rescan
+
evaluation rerun
+
Workspace review/publish when applicable
```

Cloudflare 自动部署不能替代 ChatGPT 对工具定义的审核 snapshot。

---

# 13. Worker Release 默认策略

生产推荐：

```text
versions upload
  ↓
Preview URL / staging smoke
  ↓
exact version 100% promote
  ↓
Production smoke
```

Tool contract 变化默认不用不兼容双版本长期 split traffic。

---

# 14. 自动部署 Path Boundary

Worker build/deploy 只监听 MCP runtime/config/build inputs。

Skill-only：

```text
ai-plugins/**
```

不触发 Worker redeploy。

推荐 GitHub Actions + package-local Wrangler 作为唯一 production deployment authority；若改用 Cloudflare Git integration，则停用另一条自动 production deploy。

---

# 15. Testing

```text
Node unit
Workers Vitest/workerd
MCP SDK client/Inspector-compatible contract
Nitro production build
Wrangler createTestHarness
Cloudflare Preview/Staging smoke
Production read-only smoke
ChatGPT Web acceptance
```

重点 contract：

- server version == package.json version。
- tools/list == toolDefinitions。
- get_server_info.tools 同源。
- Worker version metadata/build SHA 正确。
- latest/pin 正确。
- Tool contract release 要求 ChatGPT refresh gate。

---

# 16. OpenAI Skills Import Extension

第一版不把 OpenAI submission-time Skills import 作为 live Skill Router 主通道。

原因：它是静态导入 snapshot，Skill 更新需要重新 Scan Tools/submit，不符合我们的高频 live Git source 模型。

---

# 17. 实施顺序

```text
1. package + SemVer + lockfile
2. Nitro Worker + Wrangler
3. OpenAI-current @modelcontextprotocol/sdk + McpServer
4. unified toolDefinitions
5. get_server_info
6. version metadata/build SHA
7. GitHub Repository Adapter
8. latest/pinned SourceSnapshot
9. registry list/search
10. exact-SHA load_skill
11. Node/workerd/production harness tests
12. version upload + Preview/Staging + production promote
13. Production smoke
14. ChatGPT Developer Mode
15. Tool contract 变化时 refresh/rescan/review
```

---

# 18. Definition of Done

- [ ] SDK 与当前 OpenAI ChatGPT MCP 官方路径一致。
- [ ] initialization / server identity 正常。
- [ ] `get_server_info` 可查服务/Worker/build/tool 信息。
- [ ] `tools/list` 完整。
- [ ] latest/pin 正常。
- [ ] CF_VERSION_METADATA 可读。
- [ ] Skill-only update 不部署 Worker/刷新 tools。
- [ ] Runtime release 有 versioned deploy/smoke/rollback。
- [ ] Tool contract release 有 ChatGPT refresh/review gate。
- [ ] 无 mandatory KV/R2/D1/DO。
