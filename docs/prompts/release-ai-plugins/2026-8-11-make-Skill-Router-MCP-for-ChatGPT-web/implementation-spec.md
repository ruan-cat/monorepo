# Skill Router MCP Server 生产实现规格

## 文档定位

本文档不是概念设计，而是提供给独立 AI Agent 或开发团队执行的生产实现规格。

目标：实现一个部署在 Cloudflare Workers 的 Remote MCP Server，使 ChatGPT Web Developer Mode 可以连接，并动态获取 `ai-plugins` 内维护的 skills 上下文。

实现目标：

```
ChatGPT Web
    |
    | MCP Client
    |
    v
Skill Router MCP Server
    |
    +-- Skill Registry Service
    |
    +-- Skill Loader Service
    |
    +-- Cache Layer
    |
    v
GitHub ai-plugins
```

---

# 1. 实施原则

## 1.1 Serverless First

必须运行于 Cloudflare Worker Runtime。

禁止依赖：

- Node http server
- filesystem
- child_process
- 长生命周期内存状态

必须使用：

- fetch API
- KV
- Cache API
- Web Crypto

---

# 2. 推荐目录结构

最终实现建议：

```text
skill-router-mcp/

├── server/
│   ├── api/
│   │   ├── mcp.post.ts
│   │   └── health.get.ts
│   │
│   ├── services/
│   │   ├── skill-router.ts
│   │   ├── skill-registry.ts
│   │   ├── skill-loader.ts
│   │   └── github-source.ts
│   │
│   ├── schemas/
│   │   └── mcp.ts
│   │
│   ├── types/
│   │   └── skill.ts
│   │
│   └── utils/
│       └── cache.ts
│
├── wrangler.toml
├── nitro.config.ts
└── package.json
```

---

# 3. 核心模块职责

## 3.1 MCP Handler

文件：

```
server/api/mcp.post.ts
```

职责：

- 接收 JSON-RPC 请求
- 校验协议字段
- 调用 MCP Router
- 返回标准响应

禁止：

- GitHub 请求
- Skill 解析
- 业务逻辑

---

## 3.2 Skill Registry Service

职责：

管理技能索引。

输入：

```
query
```

输出：

```ts
interface SkillSummary {
  id:string
  name:string
  description:string
  version:string
  tags:string[]
}
```

---

## 3.3 Skill Loader Service

职责：

根据 skill id 获取完整内容。

流程：

```
skill id
 |
registry lookup
 |
GitHub/KV
 |
SKILL.md
 |
return markdown
```

---

# 4. MCP Tools 定义

## list_skills

返回全部技能摘要。

用途：

帮助模型发现能力。

---

## search_skills

输入：

```json
{
 "query":"nitro api development"
}
```

输出匹配技能。

第一阶段：关键词搜索。

未来：

- embedding
- rerank

---

## load_skill

输入：

```json
{
 "skill":"nitro-api-development"
}
```

输出：

- SKILL.md
- metadata
- references索引

---

# 5. GitHub Skill Source

来源：

```
ai-plugins/dev-skills/skills
```

不建议 Worker 每次直接访问 GitHub。

推荐：

```
GitHub Push
    |
GitHub Action
    |
Skill Index Builder
    |
Cloudflare KV
    |
Worker
```

---

# 6. Cloudflare KV 设计

建议 key：

```
skill:index
```

保存：

```json
{
 skills:[]
}
```

单个技能：

```
skill:{id}
```

内容：

```json
{
 metadata:{},
 content:"markdown"
}
```

---

# 7. 环境变量

Cloudflare Secret：

```
GITHUB_TOKEN
```

公开配置：

```
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

禁止硬编码。

---

# 8. AI Agent 实施顺序

执行顺序必须：

## Phase 1

初始化 Nitro v3 Worker 项目。

验证：

```
GET /health
```

---

## Phase 2

实现 MCP transport。

验证：

```
tools/list
```

---

## Phase 3

实现 Skill Registry。

验证：

```
list_skills
```

---

## Phase 4

接入 GitHub Source。

验证：

```
load_skill
```

---

## Phase 5

部署 Cloudflare Worker。

验证：

ChatGPT Developer Mode MCP connection。

---

# 9. 完成标准

必须满足：

- ChatGPT Web 可以连接 MCP URL
- tools/list 正常返回
- search_skills 正常工作
- load_skill 返回完整 skill
- Cloudflare Worker 无 Node API
- GitHub 更新可以同步
- 测试全部通过

