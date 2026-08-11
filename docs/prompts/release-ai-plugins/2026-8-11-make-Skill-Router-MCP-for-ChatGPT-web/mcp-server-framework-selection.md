# MCP Server 构建框架选型与实施规范

## 文档目的

本文用于指导 AI Agent 实现生产级 ChatGPT Web Remote MCP Server。

目标不是构建普通 HTTP API，而是构建符合 MCP 协议、可被 ChatGPT Web Developer Mode 连接的云端 MCP Server。

核心技术选择：

- MCP 协议层：`@modelcontextprotocol/sdk`
- Web Runtime：Nitro v3 + H3
- 部署环境：Cloudflare Workers
- Transport：Streamable HTTP

MCP TypeScript SDK 官方推荐远程 MCP Server 使用 Streamable HTTP transport，新项目不应继续采用旧 SSE transport。 

---

# 1. 禁止手写 MCP 协议

禁止：

```text
Nitro Handler
    |
手写 JSON-RPC
    |
返回 MCP JSON
```

原因：

- 容易遗漏协议生命周期。
- 容易实现错误的 capability negotiation。
- 难以跟随 MCP 协议升级。

正确方式：

```text
Nitro
 |
MCP SDK Adapter
 |
McpServer
 |
Tools / Resources / Prompts
```

---

# 2. MCP Server 分层

推荐：

```text
ChatGPT Web

↓

Streamable HTTP

↓

Nitro v3 Endpoint

↓

MCP TypeScript SDK

↓

McpServer

↓

Skill Tools

↓

Skill Services

↓

Repositories
```

---

# 3. MCP SDK 职责

由 SDK 负责：

- initialize
- capabilities
- tools/list
- tools/call
- resources
- prompts
- JSON-RPC lifecycle

业务代码只负责注册能力。

---

# 4. Skill Router Tools

## search_skills

用途：

根据用户任务描述寻找技能。

输入：

```ts
{
 query: string
}
```

---

## load_skill

用途：

加载完整 skill 上下文。

输入：

```ts
{
 skillId: string
}
```

---

## get_skill_metadata

用途：

返回：

- version
- tags
- compatibility
- security metadata

---

# 5. Transport 选择

生产环境：

```text
Streamable HTTP
```

原因：

- 适合公网 Remote MCP。
- 适合 Cloudflare Worker。
- 符合现代 MCP Server 方向。

不使用：

- stdio（本地 MCP）
- SSE（旧兼容方案）

---

# 6. Cloudflare Worker 适配原则

第一版本采用：

```text
Stateless Streamable HTTP
```

原因：

Cloudflare Worker 是 serverless edge runtime。

避免：

- 长生命周期 session
- 本地状态
- Node server

---

# 7. Nitro 集成职责

Nitro 负责：

- HTTP 生命周期
- Cloudflare runtime 接入
- handler

MCP SDK 负责：

- MCP 协议
- tool registration
- transport

二者不能混合。

---

# 8. AI Agent 实施要求

实现顺序：

1. 初始化 Nitro Worker 工程。
2. 接入 MCP TypeScript SDK。
3. 创建 Streamable HTTP adapter。
4. 创建 McpServer。
5. 注册 Skill Router tools。
6. 接入 Skill Service。
7. 接入 Runtime Binding。
8. 编写 MCP client validation tests。

---

# 9. 验收标准

必须验证：

- ChatGPT Web 可以连接 MCP endpoint。
- initialize 成功。
- tools/list 返回 Skill Router tools。
- tools/call 可以执行 search_skills。
- load_skill 可以返回 skill context。

该文档作为 MCP 实现阶段的强制技术约束。