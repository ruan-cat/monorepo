# MCP Client 验收验证指南

## 文档目的

本文档用于验证 Skill Router MCP Server 是否真正可以被 ChatGPT Web Developer Mode 使用。

目标不是测试普通 HTTP 接口，而是验证完整链路：

```text
ChatGPT Web
    |
Developer Mode MCP Client
    |
Remote MCP Endpoint
    |
Skill Router MCP Server
    |
Skill Registry
```

---

# 1. 前置条件

必须具备：

- Cloudflare Worker 已部署。
- 自定义 HTTPS 域名已生效。
- MCP endpoint 可公网访问。
- MCP Server 已实现 initialize、tools/list、tools/call。

推荐地址：

```text
https://mcp.ai.ruan-cat.com/mcp
```

---

# 2. MCP 初始化验证

验证目标：

客户端可以识别 MCP Server。

检查：

- protocol version
- server capabilities
- tools capability

失败原因通常：

- JSON-RPC 格式错误。
- endpoint 不支持 POST。
- response schema 不符合 MCP。

---

# 3. tools/list 验证

必须返回：

```text
list_skills
search_skills
load_skill
```

每个 tool 必须包含：

- name
- description
- inputSchema

---

# 4. tools/call 验证

## list_skills

验证：

可以返回技能摘要。

## search_skills

验证：

输入关键词后可以匹配技能。

## load_skill

验证：

可以返回完整 SKILL.md 上下文。

---

# 5. ChatGPT Web 验收流程

执行：

1. 打开 ChatGPT Developer Mode。
2. 添加 Remote MCP Server。
3. 输入测试请求。

示例：

```text
列出你当前可用的技能。
```

预期：

ChatGPT 调用 list_skills。

---

# 6. 生产验收标准

必须满足：

- ChatGPT 可以连接 MCP。
- tools/list 返回正常。
- search_skills 正常。
- load_skill 返回完整上下文。
- 无敏感信息泄露。
- 高并发读取稳定。
