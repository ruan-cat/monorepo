# MCP Client 验收验证指南

## 文档目的

本文用于验证 Skill Router MCP Server 是否真正符合 ChatGPT Web Developer Mode Remote MCP 使用要求。

本项目不是普通 HTTP API 验收，而是完整 MCP Client/Server 链路验收。

目标链路：

```text
ChatGPT Web Developer Mode
        |
        v
Remote MCP Client
        |
        v
Streamable HTTP MCP Endpoint
        |
        v
Nitro v3 + MCP TypeScript SDK
        |
        v
McpServer
        |
        v
Skill Router Tools
```

MCP Server 应使用 MCP TypeScript SDK 提供的协议能力，而不是手写 JSON-RPC。

---

# 1. 前置条件

必须确认：

- Cloudflare Worker 已部署。
- HTTPS 域名正常。
- Streamable HTTP endpoint 可访问。
- MCP Server 已创建 `McpServer`。
- tools 已注册。

推荐地址：

```text
https://mcp.ai.ruan-cat.com/mcp
```

---

# 2. MCP 生命周期验证

## initialize

验证：

- protocol version。
- server info。
- capabilities。
- tools capability。

失败常见原因：

- transport 配置错误。
- MCP SDK 初始化失败。
- response schema 不符合协议。

---

# 3. tools/list 验证

必须暴露：

```text
list_skills
search_skills
load_skill
```

每个 tool 必须包含：

- name
- description
- inputSchema

Tool annotation 必须准确：

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

Skill Router 不修改外部系统。

---

# 4. tools/call 验证

## search_skills

输入：

```json
{
  "query": "Nitro API development"
}
```

验证：

- 返回匹配技能。
- 返回 metadata。
- 不泄露内部 Secret。

---

## load_skill

输入：

```json
{
  "skillId": "nitro-api-development"
}
```

验证：

- SKILL.md 返回完整。
- references 信息正确。
- version 正确。

---

# 5. ChatGPT Web 验收流程

执行：

1. 打开 ChatGPT Developer Mode。
2. 添加 Remote MCP Server。
3. 输入测试请求。

例如：

```text
列出当前可用技能。
```

预期：

ChatGPT 调用 MCP tools/list 或对应 skill discovery tool。

---

# 6. 生产验收标准

必须满足：

- ChatGPT 可以连接 MCP endpoint。
- initialize 成功。
- tools/list 正常。
- tools/call 正常。
- Streamable HTTP 正常。
- Skill 上下文完整返回。
- 无 Secret 泄露。
