# MCP Server 构建框架选型与实施规范

## 文档目的

本文冻结 **ChatGPT Web compatibility-first** 的 MCP Server 框架选择。

最终分层：

```text
ChatGPT Web
  ↓
Remote MCP / Streamable HTTP
  ↓
Cloudflare Worker
  ↓
Nitro v3 Runtime
  ↓
@modelcontextprotocol/sdk / McpServer
  ↓
Tool Definitions
  ↓
Skill Router Services
```

---

# 1. 当前生产选型

当前 OpenAI 官方 `Build an MCP server` 文档明确使用：

```text
@modelcontextprotocol/sdk
zod
```

并：

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
```

因此当前 production baseline 固定为 OpenAI 官方这条 SDK 路径。

不要仅因为 MCP upstream 发布新 major/package split 就抢跑改成另一套 server/client package。

详细规则：

```text
chatgpt-web-mcp-compatibility-profile.md
```

---

# 2. 为什么不手写协议

禁止：

```text
Nitro Handler
  ↓
hand-written JSON-RPC / initialization / transport
```

官方 SDK 已提供：

- server scaffolding。
- schema helpers。
- initialization/protocol negotiation。
- tool registration/list/call。
- Streamable HTTP transport support。

Nitro 只负责 Worker HTTP runtime adapter。

---

# 3. 为什么当前不抢跑 MCP Upstream Major

MCP upstream 和 SDK 会演进，但我们的产品目标是：

```text
ChatGPT Web 真实使用
```

所以 protocol/SDK major 迁移的必要条件是：

```text
OpenAI 当前官方 ChatGPT MCP 文档支持
+
MCP Inspector pass
+
ChatGPT Web Developer Mode pass
```

如果 OpenAI 当前文档仍使用 `@modelcontextprotocol/sdk` + initialization，那么 production 继续保持该 compatibility profile。

---

# 4. Nitro / SDK 分工

## Nitro v3

- Cloudflare build/runtime abstraction。
- HTTP endpoint。
- bindings extraction。
- thin Request/Response adapter。

## MCP SDK

- MCP initialization / protocol handling。
- stable server name/version。
- server instructions。
- tools/list / tools/call。
- schemas/results/errors/annotations。

## Skill Router

- `get_server_info`。
- Skill discovery/search/load。
- SourceSnapshot。

---

# 5. Transport

生产：

```text
Streamable HTTP
```

推荐：

```text
/mcp
```

不使用 stdio 作为 ChatGPT Web 公网 transport，不创建自定义 REST imitation。

---

# 6. Core Tools

```text
get_server_info
list_skills
search_skills
load_skill
```

所有 tools 从统一 `toolDefinitions` 注册。

`tools/list` 是标准目录能力；`get_server_info` 是用户/ChatGPT 友好的版本与部署诊断 facade。

---

# 7. Server Identity

创建 server 时：

```text
name = skill-router-mcp
version = package.json.version
```

MCP application version 不与 Worker Version ID、Skill version 或 sourceCommitSha 混淆。

---

# 8. ChatGPT Tool Snapshot

框架层还必须承认 ChatGPT 产品自己的 metadata snapshot 生命周期。

Tool contract 不变的 runtime patch：Worker deploy 即可，但仍做 smoke。

Tool name/schema/description/annotation 变化：

```text
Worker candidate
  ↓
Inspector / Developer Mode
  ↓
refresh/rescan tool metadata
  ↓
review/publish when applicable
```

仅 Skill data 高频变化不触发该流程。

---

# 9. Cloudflare Worker 约束

MVP 不增加：

- KV/R2/D1/DO session/state。
- Node listening server。
- filesystem persistence。

Git snapshot consistency 使用 exact commit SHA，不使用 transport session 存储。

---

# 10. AI Agent 实施顺序

```text
1. 读取 OpenAI 当前 Build an MCP server 文档
2. 锁定当前 OpenAI-supported @modelcontextprotocol/sdk 版本
3. 创建 McpServer stable name/version
4. 创建统一 toolDefinitions
5. Nitro <-> MCP SDK Streamable HTTP adapter
6. get_server_info
7. list/search/load + SourceSnapshot
8. Node / Workers Vitest / production harness
9. MCP Inspector
10. ChatGPT Web Developer Mode
11. versioned Cloudflare release
12. Tool contract 变化时执行 ChatGPT refresh/review gate
```

---

# 11. Definition of Done

- [ ] SDK 与当前 OpenAI ChatGPT 官方文档一致。
- [ ] 不手写 MCP lifecycle/transport。
- [ ] initialization / server instructions / tool discovery 正常。
- [ ] Streamable HTTP 正常。
- [ ] server version 来自 package.json。
- [ ] `tools/list` / `get_server_info.tools` 同源。
- [ ] latest/pinned Skill snapshot 正常。
- [ ] Tool contract 更新考虑 ChatGPT metadata snapshot。
- [ ] Future MCP major 只在 OpenAI compatibility 明确后升级。
