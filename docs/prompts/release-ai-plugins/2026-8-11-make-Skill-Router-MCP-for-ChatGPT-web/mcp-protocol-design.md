# Skill Router MCP Server MCP 协议实施设计

## 1. 文档定位

本文档是提供给 AI Agent 实施 Remote MCP Server 的工程规格。

目标：实现一个可以被 ChatGPT Web Developer Mode 直接连接的云端 MCP Server。

本项目不是手写 JSON-RPC 服务，而是基于 MCP TypeScript SDK 构建标准 MCP Server。

---

# 2. MCP 技术选型

## MCP Framework

必须使用：

```text
@modelcontextprotocol/sdk
```

职责：

- MCP lifecycle
- initialize
- capability negotiation
- tools/list
- tools/call
- resources
- prompts
- JSON-RPC protocol handling

禁止 AI Agent 自行实现 MCP 协议层。

---

# 3. Transport 设计

生产环境使用：

```text
Streamable HTTP Transport
```

原因：

- 适用于 Remote MCP Server。
- 适用于 Cloudflare Worker HTTPS 环境。
- 不依赖本地进程。

不使用：

- stdio（本地 MCP 场景）
- 自定义 JSON-RPC endpoint
- 长连接 session state

---

# 4. 请求链路

```text
ChatGPT Web MCP Client
        |
        v
HTTPS Streamable HTTP
        |
        v
Nitro v3 Endpoint
        |
        v
MCP TypeScript SDK Transport
        |
        v
McpServer
        |
        v
Skill Router Tools
```

---

# 5. Nitro 集成边界

文件：

```text
server/api/mcp.post.ts
```

只负责：

- 接收 HTTP 请求。
- 获取 runtime bindings。
- 调用 MCP SDK transport adapter。
- 返回 MCP response。

禁止：

- 手写 JSON-RPC。
- 解析 skill。
- 查询 GitHub。
- 操作 KV。

---

# 6. MCP Server Tools

## list_skills

返回：

- id
- name
- version
- description
- tags

---

## search_skills

用途：根据任务描述查找技能。

输入：

```json
{"query":"Nitro API development"}
```

---

## load_skill

用途：加载完整技能上下文。

输入：

```json
{"skillId":"nitro-api-development"}
```

返回：

- metadata
- SKILL.md
- references

---

# 7. Tool Annotation

Skill Router 是只读能力。

Tools 应标记：

```json
{
 "readOnlyHint": true,
 "destructiveHint": false
}
```

禁止伪装为执行工具。

---

# 8. Resources 扩展

未来可以增加：

```text
skills://registry
```

用于暴露技能资源。

第一阶段只实现 tools。

---

# 9. Serverless 约束

Cloudflare Worker 环境：

禁止：

- 本地 filesystem
- session memory
- websocket state
- 常驻进程

必须：

- stateless request
- KV
- Cache API

---

# 10. 验收标准

必须通过：

- initialize
- tools/list
- tools/call
- ChatGPT Web Developer Mode Remote MCP connection
