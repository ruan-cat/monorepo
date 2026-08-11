# Skill Router MCP Server 部署运行手册

## 目标

本文描述生产环境部署流程。

目标部署环境：

- Cloudflare Workers
- Nitro v3
- 自定义 HTTPS 域名

## 部署架构

```
ChatGPT Web
    |
    v
https://mcp.ai.ruan-cat.com/mcp
    |
    v
Cloudflare Worker
    |
    +-- Nitro Handler
    +-- Skill Router
    +-- Cloudflare KV
```

## 部署前准备

需要：

- Cloudflare 账号
- Worker 项目
- 自定义域名
- GitHub 仓库访问权限

## Cloudflare 配置

创建：

- Worker
- KV Namespace
- Secrets

推荐 Secret：

```
GITHUB_TOKEN
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

## 构建流程

```
GitHub Repository
        |
        v
CI Build
        |
        v
Nitro Build
        |
        v
Cloudflare Deploy
```

## MCP 地址

生产地址：

```
https://mcp.ai.ruan-cat.com/mcp
```

健康检查：

```
GET /health
```

## 发布检查

上线前确认：

- Worker 状态正常
- HTTPS 正常
- KV 可读取
- MCP initialize 成功
- tools/list 成功
- load_skill 成功

## 回滚策略

发生问题：

1. 回滚 Worker deployment。
2. 保留 KV 历史版本。
3. 检查 registry 生成记录。

## ChatGPT Web 接入

最终操作：

1. 打开 ChatGPT Developer Mode。
2. 添加 Remote MCP Server。
3. 填入 MCP URL。
4. 验证 tools 列表。

完成后，ChatGPT Web 即可动态获取 ai-plugins skills。
