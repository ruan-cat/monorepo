# Skill Router MCP Server 架构设计

## 文档定位

本文档定义 Skill Router MCP Server 的生产级系统架构。

目标不是构建一个执行型 Agent，而是构建一个专门向 ChatGPT Web Developer Mode 提供技能上下文的 Remote MCP 服务。

核心职责：

> 负责技能发现、技能检索、技能加载和技能版本管理。

不负责代码执行。

---

# 1. 总体架构

```text
ChatGPT Web Developer Mode
          |
          | MCP Client
          |
          v
Remote MCP Endpoint
          |
          v
Cloudflare Worker
          |
          v
Nitro v3 + H3 Application Layer
          |
   -----------------------------
   |             |              |
   v             v              v
MCP Handler  Skill Services  Cache Layer
   |             |              |
   |             |              |
   v             v              v
JSON-RPC     Registry       KV / Cache API
                 |
                 |
                 v
        GitHub ai-plugins/dev-skills
```

---

# 2. 系统边界

## Skill Router MCP Server 负责

- Skill Discovery
- Skill Search
- Skill Loading
- Skill Metadata
- Skill Version

## Skill Router MCP Server 不负责

禁止承担：

- 修改代码
- 创建 GitHub PR
- 执行 Shell
- 执行 Docker
- 运行 CI
- 管理开发环境

这些能力由其他 MCP Server 提供。

---

# 3. MCP 生态分工

```text
Skill Router MCP
        |
        | 提供方法论和上下文
        v
Agent
        |
        +------ GitHub MCP
        |          |
        |          v
        |      修改代码
        |
        +------ Docker MCP
        |          |
        |          v
        |      执行测试
        |
        +------ Filesystem MCP
                   |
                   v
              文件操作
```

核心原则：

> Skill 决定如何做，Tool 决定能做什么。

---

# 4. 分层架构

## 4.1 MCP Transport Layer

职责：

- 接收 MCP 请求
- JSON-RPC 校验
- 返回 MCP Response

实现：

```text
server/api/mcp.post.ts
```

禁止包含业务逻辑。

---

## 4.2 Application Layer

职责：

- Skill Router
- Skill Search
- Skill Loading

实现：

```text
server/services/
```

---

## 4.3 Repository Layer

职责：

访问数据来源：

- Cloudflare KV
- Cache API
- GitHub Source

实现：

```text
server/repositories/
```

---

# 5. 数据流

## Skill 查询流程

```text
ChatGPT
 |
 tools/list
 |
search_skills
 |
Skill Registry
 |
KV
 |
Response
```

---

## Skill 加载流程

```text
ChatGPT
 |
load_skill
 |
skill id
 |
Registry Lookup
 |
KV content
 |
返回 SKILL.md
```

---

# 6. 数据同步架构

运行时不直接扫描 GitHub。

推荐：

```text
GitHub ai-plugins
        |
        |
GitHub Actions
        |
        |
Registry Builder
        |
        |
Cloudflare KV
        |
        |
Skill Router MCP
```

原因：

- 降低延迟
- 避免 GitHub API 限制
- 提高稳定性

---

# 7. Runtime 架构

部署环境：

```text
Cloudflare Workers
```

框架：

```text
Nitro v3 + H3
```

禁止：

- Node Server
- filesystem
- child_process
- 长驻内存状态

必须：

- fetch API
- KV
- Cache API
- Web Crypto

---

# 8. Nitro 与 Wrangler 边界

## Nitro

负责：

- 应用构建
- Handler
- Runtime abstraction
- 路由

## Wrangler

负责：

- Worker 部署
- KV binding
- Secrets
- Domain
- Cloudflare 配置

两者不可混合。

---

# 9. 最终部署形态

```text
ChatGPT Web
     |
Developer Mode MCP
     |
HTTPS
     |
mcp.ai.ruan-cat.com
     |
Cloudflare Worker
     |
Nitro v3 MCP Server
     |
Skill Router
     |
GitHub ai-plugins
```

该系统是个人 AI Agent Skill Platform 的基础设施层。