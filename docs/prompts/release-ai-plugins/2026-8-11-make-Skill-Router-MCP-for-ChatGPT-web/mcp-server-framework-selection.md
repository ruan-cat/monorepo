# MCP Server 构建框架选型与实施规范

## 文档目的

本文冻结 ChatGPT Web Remote MCP Server 的协议框架选择。

目标协议基线：

```text
MCP 2026-07-28
```

最终分层：

```text
ChatGPT Web
  ↓
Streamable HTTP
  ↓
Cloudflare Worker
  ↓
Nitro v3 Runtime
  ↓
MCP TypeScript SDK v2 server package
  ↓
McpServer / tool definitions
  ↓
Skill Router domain services
```

---

# 1. 选型更新：MCP TypeScript SDK v2

早期规格曾固定：

```text
@modelcontextprotocol/sdk
```

该包属于 v1 单体 SDK，并以 2025-era initialize/session lifecycle 为主要模型。

本项目在真正实现时应使用支持最终 MCP `2026-07-28` 的 v2 稳定包线：

```text
@modelcontextprotocol/server
```

测试客户端使用对应 v2 client package。

不要为了保留早期文档而新建一个现代 Remote MCP Server 却继续锁在 legacy protocol era。

具体 minor/patch 必须实施时核对官方 release 并由 lockfile 固化。

---

# 2. 为什么不手写协议

禁止：

```text
Nitro Handler
  ↓
手写 JSON-RPC lifecycle / headers / negotiation
  ↓
MCP response
```

原因：

- 2026-era 协议已经改变 handshake/session 模型。
- HTTP method/name/version metadata 有正式 wire contract。
- server identity / tools / errors 应由 SDK schema 保证。
- 手写实现会把协议升级成本转嫁给本项目。

Nitro 只提供最薄 HTTP/runtime adapter。

---

# 3. Modern MCP 生命周期

MCP `2026-07-28` 不再把：

```text
initialize
initialized
Mcp-Session-Id
```

作为现代协议的前置握手/session。

协议采用 per-request stateless core。

如果客户端需要预先查看 server capability，可使用现代 discovery RPC；Tool catalog 仍通过标准：

```text
tools/list
```

取得。

Server identity 通过每个 modern response 的 serverInfo `_meta` 暴露。

---

# 4. Nitro / MCP SDK 职责

## Nitro v3

负责：

- Cloudflare Worker build/runtime abstraction。
- HTTP route/handler。
- runtime bindings 提取。
- Request/Response 与 MCP handler 的薄适配。

## MCP SDK v2

负责：

- 2026-era wire protocol。
- protocol version handling。
- discovery/capabilities。
- server identity metadata。
- `tools/list` / `tools/call`。
- tool schemas/results/errors。

## Skill Router

负责：

- tool definitions。
- Skill discovery/search/load 业务逻辑。
- Git exact-commit SourceSnapshot。

---

# 5. Transport

生产：

```text
Streamable HTTP
```

不使用：

- stdio 作为公网 ChatGPT Web transport。
- 自定义 MCP-over-REST。
- 旧式 server session 作为 consistency 机制。

MCP 2026-era stateless 请求模型与 Cloudflare Worker 横向扩展边界天然一致。

---

# 6. Core Tools

第一版核心工具固定为：

```text
get_server_info
list_skills
search_skills
load_skill
```

其中：

## `get_server_info`

返回 MCP application/protocol/Worker/build 版本以及动态 tool catalog。

## `list_skills`

读取当前 exact Git snapshot 的 registry summary。

## `search_skills`

在 minimal registry 内做确定性搜索。

## `load_skill`

支持 latest 或 optional `sourceCommitSha` pin。

如果以后需要 `get_skill_metadata`，必须由真实使用需求驱动，不要和 `list/search/load` 重复堆工具。

---

# 7. Tool Registry 单一真源

实现必须拥有统一：

```text
toolDefinitions
```

它同时驱动：

- MCP tool registration。
- 标准 `tools/list`。
- `get_server_info.tools`。
- contract tests。

不要硬编码多套 tool names。

---

# 8. Server Identity 与版本

MCP package `package.json` version 是唯一 MCP application SemVer 来源。

SDK Server identity：

```text
name = skill-router-mcp
version = package.json version
```

它与：

- protocol revision `2026-07-28`。
- Cloudflare Worker Version ID/tag。
- build Git SHA。
- Skill source commit SHA。

必须分别表达。

详细见：

```text
mcp-release-versioning-and-production-maintenance.md
```

---

# 9. Cloudflare Worker 适配约束

第一版：

```text
stateless modern MCP over Streamable HTTP
```

禁止因为框架选择引入：

- Durable Object session store。
- KV session table。
- local memory session affinity。
- Node HTTP listening server。

Git source snapshot consistency 使用显式 commit SHA，而不是 transport session。

---

# 10. AI Agent 实施顺序

```text
1. 核对 MCP 2026-07-28 + TypeScript SDK v2 当前官方 API
2. 安装 package-local v2 server/client 依赖并锁版本
3. 创建 server identity / tool definitions
4. 创建 Nitro <-> MCP SDK HTTP adapter
5. 实现 get_server_info
6. 实现 list/search/load + SourceSnapshot
7. Node Vitest contract tests
8. Workers Vitest/workerd tests
9. production build harness
10. Cloudflare Preview / production smoke
11. ChatGPT Web Developer Mode 验收
```

---

# 11. 验收标准

- [ ] 不使用 v1 legacy `initialize` 作为现代协议完成证据。
- [ ] MCP SDK v2 支持 `2026-07-28`。
- [ ] serverInfo 可读并包含 MCP application version。
- [ ] `tools/list` 返回完整 tool catalog。
- [ ] `get_server_info` 与 `tools/list` 同源。
- [ ] Streamable HTTP / Cloudflare Worker 正常。
- [ ] 无 server-side MCP session requirement。
- [ ] latest/pinned Skill snapshot 正常。
- [ ] ChatGPT Web 可以连接和调用。
