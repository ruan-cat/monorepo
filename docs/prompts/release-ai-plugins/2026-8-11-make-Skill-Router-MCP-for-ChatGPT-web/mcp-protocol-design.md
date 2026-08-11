# MCP 协议设计

## Endpoint

推荐：

```text
https://mcp.ai.ruan-cat.com/mcp
```

## 支持方法

必须实现：

- initialize
- tools/list
- tools/call

可选：

- resources/list
- resources/read

## Tools

### list_skills

返回所有可用技能索引。

### search_skills

输入：query

输出匹配技能。

### load_skill

输入：skill id

输出完整技能上下文。

## JSON-RPC

所有请求必须遵守 MCP JSON-RPC 格式。

错误必须返回标准 error 对象。

## Serverless 注意事项

不能依赖连接状态。
每个请求必须独立完成。