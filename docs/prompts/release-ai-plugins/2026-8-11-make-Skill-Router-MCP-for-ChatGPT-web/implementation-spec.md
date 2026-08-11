# Skill Router MCP Server 生产实现规格

## 文档定位

本文档用于指导独立 AI Agent 实现生产级 Remote MCP Server。

目标：

构建：

```text
Cloudflare Worker
+
Nitro v3 Runtime
+
MCP TypeScript SDK
+
Skill Router
```

---

# 1. 核心技术栈

固定：

|层|技术|
|-|-|
|Runtime|Cloudflare Workers|
|Application Runtime|Nitro v3|
|HTTP Runtime Layer|Nitro 管理的 H3 Runtime Layer|
|MCP Protocol|@modelcontextprotocol/sdk|
|Transport|Streamable HTTP|
|Cache|Cloudflare KV / Cache API|

重要：

不要单独安装并管理 H3 主版本。

H3 由 Nitro v3 依赖树管理。

---

# 2. 依赖管理原则

package.json 直接管理：

```text
nitro
@modelcontextprotocol/sdk
```

不要：

```text
手动升级 h3
覆盖 Nitro runtime dependency
```

必须提交 lockfile。

---

# 3. MCP 实现层

禁止手写：

- JSON-RPC
- initialize
- tools/list
- tools/call
- transport

必须使用：

```text
MCP TypeScript SDK

+

McpServer

+

Streamable HTTP Transport
```

---

# 4. 请求链路

```text
ChatGPT Web
 |
Remote MCP Client
 |
Streamable HTTP
 |
Nitro Handler
 |
MCP SDK Transport
 |
McpServer
 |
Tools
 |
Services
```

---

# 5. 项目结构

```text
skill-router-mcp/

├── mcp/
│   ├── server.ts
│   └── tools/
│
├── services/
│
├── repositories/
│
├── server/api/
│   └── mcp.post.ts
│
├── nitro.config.ts
└── wrangler.toml
```

---

# 6. AI Agent 实施顺序

1. 初始化 Nitro v3 项目。
2. 配置 Wrangler。
3. 安装 MCP SDK。
4. 创建 McpServer factory。
5. 注册 tools。
6. 实现 Skill Service。
7. 接入 KV Registry。
8. 编写测试。

---

# Definition of Done

- ChatGPT Web 可连接。
- MCP initialize 成功。
- tools/list 成功。
- tools/call 成功。
- Skill 可搜索。
- Skill 可加载。
- Worker 可部署。
