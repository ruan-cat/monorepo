# Nitro v3 接口开发指导

## 技术依据

本项目必须遵循 ai-plugins 内 nitro-api-development 技能规范。

核心原则：

- Nitro v3 + H3 defineHandler
- 无状态 Serverless 设计
- 使用标准响应结构
- handler 必须 try/catch
- 避免 Node 专属 API

## 推荐结构

```text
server/
├── api/
│   └── mcp.post.ts
├── services/
│   ├── skill-registry.ts
│   └── github-loader.ts
├── utils/
└── types/
```

## Handler

mcp.post.ts 负责：

1. 接收 JSON-RPC 请求。
2. 校验 MCP method。
3. 调用 service。
4. 返回 MCP response。

业务逻辑禁止直接写入 handler。

## Cloudflare 兼容

禁止：

- fs
- child_process
- 本地缓存
- 长驻状态

使用：

- fetch
- KV
- Web Crypto
- Cache API
