# Skill Router MCP Server 架构设计

## 文档定位

本文档定义生产级 Remote MCP Server 架构。

目标：构建可被 ChatGPT Web Developer Mode 直接连接的 Cloudflare Remote MCP Server。

核心原则：

- MCP SDK 提供协议能力。
- Nitro v3 提供应用 Runtime。
- H3 作为 Nitro 管理的 HTTP Runtime Layer。
- Cloudflare Worker 提供 Serverless 平台。

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
Nitro v3 Runtime
          |
          v
H3 Runtime Layer
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

# 2. 依赖边界

## Nitro v3

负责：

- Runtime abstraction
- build
- routes
- Cloudflare adapter

## H3 Runtime Layer

由 Nitro 管理。

不作为独立 Web Framework 管理。

## MCP SDK

负责：

- initialize
- tools/list
- tools/call
- resources

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

---

# 4. 最终形态

```text
ChatGPT Web
 |
Remote MCP
 |
Streamable HTTP
 |
Cloudflare Worker
 |
Nitro v3 Runtime
 |
MCP SDK
 |
Skill Router
 |
Skill Registry
```
