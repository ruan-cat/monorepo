# Skill Router MCP Server 生产实现规格

## 文档定位

本文档用于指导独立 AI Agent 实现生产级 Remote MCP Server。

目标：

构建：

```text
Cloudflare Worker
+
Nitro v3
+
MCP TypeScript SDK
+
Skill Router
```

使 ChatGPT Web Developer Mode 可以连接并动态获取 ai-plugins skills。

---

# 1. 核心技术栈

固定：

|层|技术|
|-|-|
|Runtime|Cloudflare Workers|
|Web Framework|Nitro v3 + H3|
|MCP Protocol|@modelcontextprotocol/sdk|
|Transport|Streamable HTTP|
|Cache|Cloudflare KV / Cache API|

禁止替换 MCP 协议层实现。

---

# 2. 项目结构

```text
skill-router-mcp/

├── server/
│
├── mcp/
│   ├── server.ts
│   └── tools/
│       ├── search-skills.ts
│       ├── load-skill.ts
│       └── metadata.ts
│
├── services/
│   └── skill-service.ts
│
├── repositories/
│   ├── kv-registry.ts
│   └── github-source.ts
│
└── api/
    └── mcp.post.ts
```

---

# 3. MCP 实现层

不要手写：

- JSON-RPC
- initialize
- tools/list
- tools/call

必须使用 MCP SDK：

```text
McpServer

+

Streamable HTTP Transport
```

---

# 4. 请求链路

```text
ChatGPT
 |
MCP Client
 |
Streamable HTTP
 |
Nitro Handler
 |
MCP SDK
 |
McpServer
 |
Tools
 |
Services
```

---

# 5. Handler 职责

`mcp.post.ts`：

负责：

- 接收请求。
- 提供 runtime binding。
- 调用 MCP adapter。

禁止：

- GitHub API。
- KV 查询。
- Skill parsing。

---

# 6. Skill Tools

必须实现：

## list_skills

返回技能摘要。

## search_skills

根据 query 匹配技能。

## load_skill

返回完整技能上下文。

---

# 7. Cloudflare Runtime

环境来源：

```text
Worker bindings
        |
Nitro runtime
        |
Dependency Injection
        |
Repository Adapter
```

禁止：

```text
process.env
```

---

# 8. 实施顺序

AI Agent 必须：

1. 初始化 Nitro Worker 项目。
2. 配置 Wrangler。
3. 接入 MCP SDK。
4. 创建 McpServer。
5. 注册 tools。
6. 实现 Skill Service。
7. 接入 KV Registry。
8. 编写测试。

---

# 9. Definition of Done

必须：

- ChatGPT Web 可连接。
- initialize 成功。
- tools/list 成功。
- tools/call 成功。
- Skill 可搜索。
- Skill 可加载。
- Worker 可部署。
