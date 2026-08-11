# Cloudflare Worker 部署方案

## 目标

将 MCP Server 部署为全球 HTTPS Serverless 服务。

## 推荐域名

```text
mcp.ai.ruan-cat.com
```

## 路由

```text
POST /mcp
GET /health
GET /skills
GET /skills/:id
```

## Worker 资源

使用：

- KV 存储 registry
- Cache API 缓存 skill 内容
- Secrets 保存 GitHub token

## AI Gateway

第一阶段无需强依赖 AI Gateway。

原因：主要流量是 skill retrieval，不是模型推理。

未来增加：

- embedding
- rerank
- skill summary

再接入 AI Gateway。