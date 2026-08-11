# Skill Router MCP Server for ChatGPT Web

## 1. 项目目标

本项目目标是构建一个可以直接被 ChatGPT Web Developer Mode 使用的云端 Remote MCP Server。

核心目标：

> 将 `https://github.com/ruan-cat/monorepo/tree/dev/ai-plugins` 中维护的 AI skills，通过一个 Cloudflare Worker 部署的 MCP Server 暴露给 ChatGPT Web，使 ChatGPT Web 对话能够动态发现、检索、加载 skills 上下文。

目标使用方式：

```
ChatGPT Web
    |
    | MCP Client
    |
    v
Skill Router MCP Server
    |
    +-- Skill Registry
    |       |
    |       v
    |   GitHub ai-plugins
    |
    +-- Skill Loader
            |
            v
        SKILL.md / metadata
```

该项目不是替代模型推理，而是提供动态能力层：

- 模型负责理解任务和决策。
- Skill Router MCP 负责提供专业流程、规范和知识。
- 其他 MCP Server 负责执行动作。

---

# 2. 总体架构设计

## 2.1 推荐技术栈

目标运行环境：Cloudflare Workers。

推荐：

- Runtime: Cloudflare Workers
- Framework: Nitro v3
- Protocol: MCP Remote Server
- Transport: Streamable HTTP
- Source Registry: GitHub Repository
- Cache: Cloudflare KV / Cache API
- Deployment: Cloudflare Workers CI/CD

不采用 Hono 作为业务框架，原因：

- 项目已有 Nitro v3 技能体系。
- Nitro 提供更完整的跨平台 server abstraction。
- 未来可迁移 Node、Vercel、Cloudflare 等环境。

---

# 3. MCP Server 职责定义

Skill Router MCP Server 只负责 skill 能力，不负责代码执行。

提供以下 MCP tools：

## search_skills

用途：根据任务描述寻找匹配 skill。

输入：

```json
{
  "query": "github pull request review"
}
```

输出：

```json
[
 {
  "name":"github-pr",
  "description":"GitHub PR workflow skill",
  "path":"dev-skills/github-pr"
 }
]
```

---

## load_skill

用途：加载完整 skill 上下文。

输入：

```json
{
 "skill":"github-pr"
}
```

输出：

```markdown
# GitHub PR Skill

Workflow...
```

---

## list_skills

用途：返回所有可用技能索引。

---

## get_skill_metadata

用途：获取版本、作者、标签、依赖。

---

# 4. GitHub Skill Registry 设计

GitHub 仓库作为 Source of Truth。

目录：

```
ai-plugins/
 |
 +-- skill-index.json
 |
 +-- dev-skills/
       |
       +-- github-pr/
       |      |
       |      +-- SKILL.md
       |      +-- metadata.yaml
       |
       +-- nitro-v3/
       |
       +-- frontend-debug/
```

建议每个 skill 包含：

## SKILL.md

描述：

- 角色定义
- 工作流程
- 约束规则
- 最佳实践

## metadata.yaml

例如：

```yaml
name: github-pr
description: GitHub issue and PR workflow
tags:
  - github
  - development
version: 1.0.0
```

---

# 5. Cloudflare Worker 部署方案

## 5.1 域名设计

建议：

```
mcp.ai.ruan-cat.com
```

路由：

```
POST /mcp

GET /health

GET /skills

GET /skills/:name
```

最终：

```
https://mcp.ai.ruan-cat.com/mcp
```

作为 ChatGPT Developer Mode MCP Endpoint。

---

# 6. Nitro v3 Server 设计

Nitro 负责 HTTP 层。

结构建议：

```
server/
 |
 +-- api/
 |    +-- mcp.post.ts
 |
 +-- services/
 |    +-- skill-registry.ts
 |    +-- github-loader.ts
 |
 +-- utils/
```

流程：

```
MCP Request
    |
Nitro Handler
    |
Skill Router
    |
GitHub Loader
    |
Return MCP Response
```

---

# 7. GitHub 数据获取策略

不要每次请求直接读取 GitHub。

推荐：

```
GitHub
  |
GitHub Action
  |
Generate index
  |
Cloudflare KV
```

运行时：

```
ChatGPT
 |
MCP
 |
KV lookup
 |
Return skill
```

优势：

- 降低 GitHub API 压力。
- 提高响应速度。
- 适配 serverless。

---

# 8. Cloudflare AI Gateway 设计

Cloudflare AI Gateway 可作为未来 AI 请求治理层。

本项目主要流量不是模型调用，而是 skill retrieval，因此：

第一阶段：

```
ChatGPT
 |
Cloudflare Worker MCP
 |
GitHub/KV
```

第二阶段：

如果增加：

- skill embedding
- semantic search
- rerank
- AI summarization

则：

```
Worker
 |
AI Gateway
 |
LLM provider
```

AI Gateway 用于：

- 请求日志
- 缓存
- 限流
- Provider 管理

---

# 9. Serverless 兼容要求

必须避免：

- Node filesystem
- 长驻进程
- 本地缓存依赖
- child_process

必须使用：

- fetch
- KV
- Cache API
- Web Crypto

确保兼容：

- Cloudflare Workers
- Vercel Edge
- GitHub Pages API proxy

---

# 10. 测试方案

## 单元测试

测试：

- skill parser
- metadata parser
- GitHub loader
- MCP schema

---

## MCP 协议测试

验证：

- tools/list
- tools/call
- resources/read

---

## 集成测试

流程：

```
模拟 ChatGPT MCP Client
        |
        v
Skill Router
        |
        v
search_skills
        |
        v
load_skill
```

---

## Cloudflare 测试

验证：

- Worker deploy
- Custom domain
- TLS
- latency
- concurrency

---

# 11. 安全设计

必须：

- GitHub token 放 Cloudflare Secret
- 不暴露仓库写权限
- skill 内容只读
- 防止恶意 skill 注入

建议：

```
Skill Content
 |
Validator
 |
Published Registry
```

---

# 12. 后续扩展

未来可以增加：

## Skill Router 智能匹配

增加 embedding：

```
query
 |
vector search
 |
rank skills
```

---

## Skill Marketplace

多个仓库：

```
registry
 |
 +-- frontend skills
 +-- backend skills
 +-- devops skills
```

---

# 13. 最终目标架构

```
                 ChatGPT Web
                     |
              Developer Mode MCP
                     |
                     v
          Skill Router MCP Server
                     |
        -----------------------------
        |                           |
 Skill Registry                 Cache
        |                           |
 GitHub ai-plugins              Cloudflare KV
        |
 SKILL.md
 metadata
```

该项目完成后，ChatGPT Web 将具备：

- 动态发现 skills
- 动态加载 skills 上下文
- 使用云端 MCP 作为能力扩展层
- 保持 ChatGPT Web 对话额度进行推理

这是构建个人 AI Agent Skill Platform 的基础设施。