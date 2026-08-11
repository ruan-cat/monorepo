# Skill Router MCP Server AI Agent 交接清单

## 文档目的

该文件用于在不同 AI Agent 之间传递实施状态，避免后续 Agent 重新分析项目。

目标：

> 新 Agent 接手后，可以快速确认当前设计约束，并继续完成实现。

---

# 项目目标确认

目标系统：

```text
ChatGPT Web Developer Mode
        |
        |
Remote MCP
        |
        v
Cloudflare Worker
        |
        v
Nitro v3 MCP Server
        |
        v
Skill Router
        |
        v
ai-plugins/dev-skills
```

---

# 不允许改变的设计决策

## Runtime

必须：

- Cloudflare Worker Serverless
- Nitro v3
- H3 handler
- 无状态设计

禁止：

- Node HTTP server
- filesystem 依赖
- 长驻进程

---

## MCP 职责

Skill Router 只提供：

- skill discovery
- skill search
- skill loading

不提供：

- Git 操作
- Shell 执行
- Docker 执行

---

# 实施检查

## 工程

- [ ] Nitro 项目初始化
- [ ] Cloudflare preset 配置
- [ ] MCP endpoint 完成

## 协议

- [ ] initialize
- [ ] tools/list
- [ ] tools/call

## Skill

- [ ] registry 构建
- [ ] metadata 校验
- [ ] KV 发布

## 部署

- [ ] Worker 发布
- [ ] Custom Domain 配置
- [ ] HTTPS MCP Endpoint 可访问

---

# Agent 行为规范

实施过程中：

1. 优先遵循已有文档。
2. 不自行改变架构。
3. 遇到缺失信息先补充设计文档。
4. 所有实现必须保持 Cloudflare Worker 兼容。
