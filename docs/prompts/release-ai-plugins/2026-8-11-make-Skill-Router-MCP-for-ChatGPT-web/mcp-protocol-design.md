# Skill Router MCP Server MCP 协议实施设计

## 1. 文档定位

本文提供给 AI Agent 实施 Remote MCP Server 的协议工程规格。

本项目目标协议基线：

```text
MCP 2026-07-28
```

真实工作负载：Skill 数量中等但更新频率高，因此同时支持：

```text
默认 latest HEAD
+
可选 sourceCommitSha snapshot pin
```

---

# 2. MCP TypeScript SDK 技术选型

新实现不得再把 v1 单体包：

```text
@modelcontextprotocol/sdk
```

的 2025-era `initialize` lifecycle 当作目标架构。

MCP `2026-07-28` 使用 TypeScript SDK v2 稳定包线，服务端主要依赖：

```text
@modelcontextprotocol/server
```

测试客户端使用对应 v2 client package。

具体 minor/patch 由实施时 lockfile 固化。

SDK 负责：

- MCP 2026-era request/response wire codec。
- `server/discover`（若启用/调用）。
- `tools/list`。
- `tools/call`。
- server identity `_meta`。
- protocol validation。

Nitro 只负责 Web Runtime / Worker adapter 边界。

---

# 3. 2026-07-28 Modern Protocol

现代协议不再使用：

```text
initialize
initialized
Mcp-Session-Id
```

作为连接前置握手/会话机制。

每个请求自包含其 protocol/client/capability metadata；普通 tool 请求无需先建立 server-side session。

如果客户端想先发现 server capability，可以使用：

```text
server/discover
```

但 Skill Router 的 tool 使用不依赖持久会话。

Server identity 应通过每个 2026-era response 的标准：

```text
_meta["io.modelcontextprotocol/serverInfo"]
```

暴露。

---

# 4. Transport

生产使用：

```text
Streamable HTTP
```

不使用：

- stdio 作为 ChatGPT Web 远程 transport。
- 自定义 JSON-RPC endpoint。
- server-side MCP session 作为一致性方案。

Nitro/H3 adapter 必须保留 MCP SDK 对现代 HTTP header / protocol metadata 的处理，不自行吞掉或重写协议语义。

---

# 5. 请求链路

```text
ChatGPT Web MCP Client
        |
HTTPS Streamable HTTP
        |
Cloudflare Worker
        |
Nitro v3 endpoint adapter
        |
MCP TypeScript SDK v2
        |
McpServer
        |
Tool Definitions
        |
Skill Services
        |
GitHub exact-commit SourceSnapshot
```

---

# 6. Nitro 集成边界

MCP endpoint 只做：

- Web Request/Response 适配。
- Cloudflare runtime binding 提取。
- MCP SDK handler/transport 调用。

禁止：

- 手写 MCP method router。
- 自己实现 protocol negotiation。
- 在 endpoint 内解析 Skill。
- endpoint 直接调用 GitHub。
- 为 MCP 建立 server session store。

---

# 7. Server Identity

Server identity 的逻辑来源只有一份：

```text
MCP package package.json version
```

概念：

```json
{
  "name": "skill-router-mcp",
  "version": "1.4.0"
}
```

SDK 必须把它作为 2026-era server identity 暴露。

该 version 是 MCP Server 应用 SemVer，不是：

- MCP protocol revision。
- Cloudflare Worker version ID。
- Skill version。
- Skill source commit。

详细见：

```text
mcp-release-versioning-and-production-maintenance.md
```

---

# 8. 单一 Tool Definitions Registry

当前所有 tools 必须从一个统一定义集合注册，例如：

```text
toolDefinitions
  ├─ get_server_info
  ├─ list_skills
  ├─ search_skills
  └─ load_skill
```

标准 `tools/list`、`get_server_info.tools`、测试 expected tool catalog 都必须从同一 source 派生。

禁止维护三份手写 tool name 列表。

---

# 9. `get_server_info`

用途：让 ChatGPT / MCP Client 可以直接回答：

```text
这个 MCP 是什么版本？
当前生产 Worker 是哪一版？
有哪些工具？
```

输入：

```json
{}
```

返回至少包括：

```text
server.name
server.version
server.protocolRevision
server.buildGitSha

deployment.workerVersionId
deployment.workerVersionTag
deployment.workerVersionTimestamp

skillSource.repository
skillSource.ref
registrySchemaVersion

tools[]
```

`tools[]` 必须动态来自 tool definitions。

该工具默认不访问 GitHub HEAD；精确 Skill snapshot 由 discovery/load tools 返回。

---

# 10. Source Snapshot 协议语义

默认未 pin tool call：

```text
GITHUB_REF
  ↓
resolve current HEAD -> exact SHA
  ↓
all Skill reads in this call use SHA
```

发现类结果必须暴露：

```text
sourceCommitSha
```

后续 `load_skill` 可以可选复用 discovery 的 exact SHA。

---

# 11. `list_skills`

行为：

```text
resolve latest snapshot
  ↓
read skill-registry.json @ SHA
  ↓
return summaries + sourceCommitSha
```

summary：

- id。
- plugin。
- name。
- version。
- description。

不要返回 Registry v1 不存在的深层索引字段。

---

# 12. `search_skills`

输入：

```json
{
  "query": "Nitro API development"
}
```

第一版只在 registry：

```text
id
name
description
plugin
```

上做确定性搜索。

返回候选 + `sourceCommitSha`。

不读取所有 Skill 正文，不使用 vector DB/embedding。

---

# 13. `load_skill`

推荐输入：

```json
{
  "skillId": "nitro-api-development",
  "sourceCommitSha": "abc123"
}
```

`sourceCommitSha` 可选。

## 未提供

解析当前最新 `GITHUB_REF`。

## 已提供

在配置好的同一个 `GITHUB_OWNER/GITHUB_REPO` 内读取该 exact SHA。

调用方不能通过 tool input 覆盖 owner/repo。

流程：

```text
SourceSnapshot
  ↓
registry @ SHA
  ↓
find skillId -> entry
  ↓
SKILL.md @ same SHA
```

返回：

- registry metadata。
- SKILL.md content。
- sourceCommitSha。

不默认递归加载 references/templates/examples。

---

# 14. 深层关联文件策略

Registry v1 不枚举深层文件。

`load_skill` 首先加载 `SKILL.md`；若需要相关文件，必须：

- 限制在已选 Skill 的允许目录范围。
- 使用相同 sourceCommitSha。
- 按需读取。
- 不遍历整个仓库。

若未来新增窄范围 related-file tool，也必须继承 snapshot pin 语义。

---

# 15. Tool Annotation

当前 tools 均为只读，应使用 SDK 当前 schema 支持的只读/非破坏性 annotations。

语义要求：

```text
readOnly = true
destructive = false
```

具体字段名以 v2 当前类型/API 为准。

---

# 16. 高频更新下跨 Tool 一致性

```text
search_skills @ A
push B
load_skill(skillId, sourceCommitSha=A)
```

必须仍加载 A。

不传 pin：

```text
load_skill(skillId)
```

则读取当时最新 HEAD。

该设计不需要 MCP session、KV、Durable Objects 或 snapshot token store。

---

# 17. Error Contract

至少区分：

```text
REGISTRY_NOT_FOUND
REGISTRY_SCHEMA_UNSUPPORTED
SKILL_NOT_FOUND
REGISTRY_ENTRY_INVALID
SOURCE_COMMIT_INVALID
SOURCE_READ_FAILED
GITHUB_RATE_LIMITED
GITHUB_AUTH_FAILED
```

如果 snapshot 已建立，错误可安全返回 `sourceCommitSha`；绝不能返回 Token/auth header。

---

# 18. Serverless 约束

Cloudflare Worker：

- per-request stateless。
- 无 filesystem persistence。
- 无 MCP session state。
- 无 mandatory KV/R2/D1/DO。

这与 MCP 2026-07-28 的 stateless core 方向一致。

---

# 19. 验收标准

- [ ] 使用支持 `2026-07-28` 的 MCP TypeScript SDK v2 包线。
- [ ] 不再把 `initialize/initialized` 作为现代协议验收条件。
- [ ] server identity version 来自 MCP package SemVer。
- [ ] 2026-era response 可读 serverInfo。
- [ ] 标准 `tools/list` 返回完整当前 tool catalog。
- [ ] `get_server_info` 返回应用/协议/Worker/构建版本与动态 tool catalog。
- [ ] list/search 返回 `sourceCommitSha`。
- [ ] `load_skill` 支持 latest + optional pin。
- [ ] 单 tool call 所有 Skill 读取同 SHA。
- [ ] 无 server-side MCP session/KV/R2 依赖。
- [ ] ChatGPT Web Developer Mode 可连接和调用。
