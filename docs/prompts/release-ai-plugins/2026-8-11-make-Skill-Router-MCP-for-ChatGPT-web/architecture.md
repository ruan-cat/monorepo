# Skill Router MCP Server 架构设计

## 文档定位

本文档定义生产级 Remote MCP Server 架构。

目标：

构建一个可被 ChatGPT Web Developer Mode 直接连接的 Cloudflare Remote MCP Server。

核心：

- Skill Router 提供技能上下文。
- MCP SDK 提供协议能力。
- 其他 MCP Server 提供执行能力。

---

# 1. 总体架构

```text
ChatGPT Web Developer Mode
          |
          v
Remote MCP Client
          |
          v
Streamable HTTP
          |
          v
Cloudflare Worker
          |
          v
Nitro v3 + H3
          |
          v
MCP TypeScript SDK
          |
          v
McpServer
          |
   ------------------------
   |                      |
   v                      v
Skill Tools          Runtime Adapter
   |                      |
   v                      v
Skill Services      Cloudflare Binding
   |
   v
Registry Repository
   |
   +---------+
             |
             v
   Cloudflare KV / GitHub ai-plugins
```

---

# 2. MCP 层职责

MCP SDK 负责：

- initialize
- capability negotiation
- tools/list
- tools/call
- resources

业务层不重复实现 MCP 协议。

---

# 3. Skill Router 职责

负责：

- Skill Discovery
- Skill Search
- Skill Loading
- Metadata
- Version

不负责：

- GitHub 修改
- Shell
- Docker
- CI
- 文件执行

---

# 4. 分层架构

## MCP Layer

```text
server/api/mcp.post.ts
```

负责 transport adapter。

---

## Application Layer

```text
services/
```

负责：

- skill routing
- search
- loading

---

## Repository Layer

```text
repositories/
```

负责：

- KV
- GitHub source
- Cache

---

# 5. 数据流

```text
ChatGPT
 |
search_skills
 |
McpServer Tool
 |
Skill Service
 |
KV Registry
 |
Return Context
```

---

# 6. GitHub 同步

运行时不扫描 GitHub。

```text
GitHub ai-plugins
        |
GitHub Actions
        |
Registry Builder
        |
Cloudflare KV
        |
MCP Server
```

---

# 7. Runtime 边界

部署：

```text
Cloudflare Workers
```

框架：

```text
Nitro v3
```

平台配置：

```text
Wrangler
```

禁止混合职责。

---

# 8. 最终形态

```text
ChatGPT Web
 |
Remote MCP
 |
Cloudflare Worker
 |
Nitro v3
 |
MCP SDK
 |
Skill Router
 |
Skill Registry
```
