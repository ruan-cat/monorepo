# Skill Router MCP Server 架构设计

## 总体架构

```text
ChatGPT Web Developer Mode
        |
        | Remote MCP
        v
Skill Router MCP Server
        |
        +---- Skill Registry
        |          |
        |          v
        |     GitHub ai-plugins
        |
        +---- Cache Layer
                   |
                   v
              Cloudflare KV
```

## 核心职责

Skill Router 不执行开发任务，仅提供技能上下文。

职责：

- 搜索技能
- 返回技能元数据
- 加载 SKILL.md
- 提供版本信息

## 技术选型

运行环境：Cloudflare Workers

HTTP 框架：Nitro v3 + H3

数据源：GitHub repository

缓存：KV + Cache API

协议：MCP Streamable HTTP

## 与其他 MCP 分工

Skill Router:

> 告诉 Agent 应该如何做。

GitHub MCP:

> 让 Agent 修改仓库。

Docker MCP:

> 让 Agent 执行测试。

Filesystem MCP:

> 让 Agent 操作文件。

## 数据流

1. ChatGPT 调用 tools/list。
2. 获取 Skill Router 能力。
3. 调用 search_skills。
4. 调用 load_skill。
5. 获得技能上下文。
6. 继续执行任务。