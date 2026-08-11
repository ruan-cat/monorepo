# Nitro v3 生产级接口开发指导

## 文档定位

本文档不是 Nitro v3 入门教程，而是提供给后续 AI Agent 实现 **Skill Router MCP Server** 时必须遵守的工程实施规范。

目标：

构建一个运行于 Cloudflare Workers Serverless Runtime 的 Remote MCP Server。

技术链路：

```text
ChatGPT Web Developer Mode
        |
        | MCP Streamable HTTP
        |
        v
Nitro v3 + H3 API Layer
        |
        v
Skill Router Service
        |
        +---- Cloudflare KV
        |
        +---- GitHub Skill Registry
```

本项目必须优先遵循仓库内已有技能：

```text
ai-plugins/dev-skills/skills/nitro-api-development
```

不得自行设计与仓库规范冲突的 Nitro API 风格。

---

# 1. Nitro v3 技术选型原则

## 1.1 为什么选择 Nitro v3

本项目不采用简单 Hono Worker Router，而采用 Nitro v3。

原因：

1. 仓库已有 Nitro v3 技能体系。
2. Nitro 提供跨运行环境抽象。
3. 后续可以迁移：

- Cloudflare Workers
- Node Runtime
- Vercel
- 其他 Serverless Runtime

4. 保持项目内部技术栈一致。

---

# 2. Runtime 约束

目标运行环境：

```text
Cloudflare Workers Runtime
```

因此禁止依赖传统 Node Server 能力。

## 禁止使用

```ts
import fs from 'node:fs'
import child_process from 'node:child_process'
import net from 'node:net'
```

禁止：

- 本地文件写入
- 长生命周期内存状态
- 常驻任务
- 本地 sqlite
- process 环境依赖

---

## 必须使用 Web API

允许：

```ts
fetch()

Request
Response

crypto.subtle

URL

Headers
```

持久化使用：

```text
Cloudflare KV
Cloudflare D1
R2
外部 API
```

---

# 3. Nitro 项目结构规范

推荐结构：

```text
server/
│
├── api/
│   └── mcp.post.ts
│
├── services/
│   ├── skill-router.ts
│   ├── skill-registry.ts
│   ├── github-loader.ts
│   └── cache-service.ts
│
├── schemas/
│   └── mcp.ts
│
├── types/
│   ├── skill.ts
│   └── mcp.ts
│
└── utils/
    ├── response.ts
    └── validator.ts
```

职责必须分离。

---

# 4. H3 Handler 编写规范

所有 HTTP handler 使用：

```ts
defineEventHandler()
```

禁止：

- handler 内写业务逻辑
- handler 内直接访问 GitHub
- handler 内直接处理 Skill 文件

正确：

```text
HTTP Handler
      |
      v
Service Layer
      |
      v
Repository Layer
```

---

# 5. MCP Endpoint 实现规范

入口：

```text
POST /mcp
```

文件：

```text
server/api/mcp.post.ts
```

职责：

1. 接收 JSON-RPC 请求。
2. 校验协议版本。
3. 分发 MCP method。
4. 返回标准 MCP Response。

示意：

```ts
export default defineEventHandler(async event => {
  try {
    const body = await readBody(event)

    return await mcpService.handle(body)
  } catch (error) {
    return createErrorResponse(error)
  }
})
```

---

# 6. Service Layer 设计

## skill-router.ts

负责：

- skill 搜索
- skill 匹配
- skill 加载策略

例如：

```ts
searchSkills(query)
loadSkill(name)
```

---

## skill-registry.ts

负责：

- registry.json 读取
- metadata 校验
- skill 生命周期管理

禁止：

直接耦合 GitHub API。

---

## github-loader.ts

负责：

- GitHub Raw API
- Contents API
- commit hash 校验

要求：

所有请求必须经过缓存层。

---

# 7. Cloudflare Worker 适配要求

Nitro 输出必须适配：

```text
Nitro
 ↓
Cloudflare Preset
 ↓
Worker Module
```

禁止假设：

```text
node server.js
npm start
listen(3000)
```

Worker 没有传统 TCP Server。

---

# 8. 环境变量与绑定设计

禁止直接读取：

```ts
process.env.xxx
```

使用 Nitro runtime config。

例如：

```text
GITHUB_TOKEN
GITHUB_OWNER
GITHUB_REPO
SKILL_BRANCH
```

通过 Cloudflare Secret 管理。

---

# 9. 缓存设计

Skill Router 高频读取：

- skill index
- metadata
- SKILL.md

不能每次访问 GitHub。

推荐：

```text
GitHub
 |
GitHub Actions
 |
生成 registry.json
 |
Cloudflare KV
 |
Nitro Service
```

运行时：

```text
ChatGPT
 |
Worker
 |
KV
 |
Return skill
```

---

# 10. MCP 请求处理流程

完整流程：

```text
收到 MCP Request

        |
        v

mcp.post.ts

        |
        v

JSON Schema Validation

        |
        v

MCP Method Router

        |
        +---- tools/list
        |
        +---- tools/call
        |
        +---- resources/read

        |
        v

Skill Service

        |
        v

MCP Response
```

---

# 11. 错误处理规范

所有 handler 必须 try/catch。

错误分类：

```text
INVALID_REQUEST

METHOD_NOT_FOUND

SKILL_NOT_FOUND

GITHUB_FETCH_FAILED

REGISTRY_INVALID
```

统一返回：

```json
{
  "success": false,
  "code": "SKILL_NOT_FOUND",
  "message": "Skill does not exist"
}
```

---

# 12. TypeScript 类型要求

必须定义：

```ts
interface SkillMetadata {
  name: string
  version: string
  description: string
  tags: string[]
}
```

MCP：

```ts
interface MCPRequest {
  jsonrpc: string
  method: string
  params?: unknown
  id?: string | number
}
```

禁止大量使用 any。

---

# 13. 测试要求

必须覆盖：

## Handler Test

测试：

- JSON-RPC 输入
- 错误返回
- 正常响应

## Service Test

测试：

- skill 搜索
- skill 加载
- KV fallback

## Worker Test

使用 Cloudflare 兼容测试环境。

---

# 14. AI Agent 实现 Checklist

实现 Agent 完成前必须确认：

- [ ] Nitro v3 项目初始化完成
- [ ] Cloudflare Worker preset 正确
- [ ] MCP endpoint 可访问
- [ ] tools/list 可返回
- [ ] tools/call 可执行
- [ ] Skill Registry 可加载
- [ ] KV 缓存工作
- [ ] GitHub 请求有缓存
- [ ] 无 Node 专属 API
- [ ] 所有 handler 有异常处理
- [ ] 测试通过

---

# 总结

本 Nitro v3 指导定义的是生产级 Skill Router MCP Server 的接口实现约束。

实现目标不是简单部署一个 API，而是构建：

```text
Cloudflare Worker
        +
Nitro v3
        +
MCP Protocol
        +
Skill Registry
        +
ChatGPT Web Developer Mode
```

的长期可维护基础设施。