# Skill Router MCP Server MCP 协议实施设计

## 1. 文档定位

本文档不是 MCP 入门教程，而是提供给实现 Agent 的工程规格。

目标：实现一个可被 ChatGPT Web Developer Mode 连接的 Remote MCP Server。

## 2. Endpoint

生产地址：

```text
https://mcp.ai.ruan-cat.com/mcp
```

运行环境：

- Cloudflare Worker
- Nitro v3
- H3 Handler
- Streamable HTTP

## 3. 协议生命周期

必须实现：

### initialize

完成客户端与服务端能力协商。

### tools/list

暴露 Skill Router 能力。

### tools/call

执行技能检索和加载。

可扩展：

- resources/list
- resources/read

## 4. Tool Contract

### list_skills

用途：返回技能目录。

返回：

- id
- name
- version
- description
- tags

### search_skills

用途：根据自然语言查询匹配技能。

输入：

```json
{"query":"Nitro API development"}
```

### load_skill

用途：返回完整技能上下文。

输入：

```json
{"skillId":"nitro-api-development"}
```

## 5. JSON-RPC 处理链

实现必须遵循：

```
HTTP Request
 -> JSON Parse
 -> MCP Validation
 -> Method Router
 -> Skill Service
 -> Response Builder
```

禁止：

- handler 直接读取 GitHub
- handler 直接操作 KV
- handler 存放业务规则

## 6. Serverless 约束

禁止依赖：

- session memory
- websocket state
- local filesystem

每次请求必须独立完成。

## 7. 错误规范

统一错误码：

- INVALID_REQUEST
- METHOD_NOT_FOUND
- SKILL_NOT_FOUND
- REGISTRY_ERROR
- INTERNAL_ERROR

## 8. 验收标准

实现完成后必须通过：

- MCP initialize 测试
- tools/list 测试
- tools/call 测试
- ChatGPT Developer Mode 连接测试
