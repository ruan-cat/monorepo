# Skill Router MCP Server 测试方案

## 1. 测试目标

验证生产级：

```text
Cloudflare Worker
+
Nitro v3
+
MCP TypeScript SDK
+
Streamable HTTP Remote MCP
```

是否可以被 ChatGPT Web Developer Mode 正常使用。

测试对象：

```text
ChatGPT Web
    |
Remote MCP Client
    |
Streamable HTTP
    |
McpServer
    |
Skill Router Tools
    |
Skill Registry
```

---

# 2. 测试分层

测试分为：

```text
Unit Test

MCP SDK Integration Test

Protocol Test

Runtime Test

Deployment Test

Security Test

Performance Test
```

---

# 3. MCP SDK 集成测试

验证：

- McpServer 创建成功。
- tools 注册成功。
- transport connect 正常。
- tool schema 正确。

重点测试：

```text
McpServer
    |
    v
search_skills
load_skill
list_skills
```

---

# 4. MCP 协议测试

## initialize

验证：

- protocol version。
- capabilities。
- server metadata。

---

## tools/list

验证：

返回：

```text
list_skills
search_skills
load_skill
```

---

## tools/call

测试：

### search_skills

输入 query。

验证：

- 匹配结果正确。
- schema 校验正确。

### load_skill

验证：

- 返回 skill context。
- 不泄露 secret。

---

# 5. Streamable HTTP 测试

验证：

- POST /mcp 正常。
- transport 生命周期正常。
- JSON response 正确。
- Cloudflare Worker 无长连接依赖。

第一版采用 stateless Streamable HTTP。

---

# 6. Skill Registry 测试

测试：

- SKILL.md 解析。
- metadata 解析。
- registry build。
- KV publish。
- skill version。

---

# 7. Nitro v3 测试

验证：

- defineEventHandler。
- runtime binding 注入。
- service 分层。
- 错误处理。

禁止：

- process.env。
- Node server。
- 本地状态。

---

# 8. Cloudflare Worker 测试

本地：

```bash
wrangler dev
```

验证：

- vars 正常。
- secret 正常。
- KV binding 正常。

线上：

```text
GET /health

POST /mcp
```

---

# 9. ChatGPT Web 验收

真实流程：

```text
ChatGPT Web

↓

添加 Remote MCP

↓

initialize

↓

tools/list

↓

search_skills

↓

load_skill
```

---

# 10. 回归测试

Skill 更新流程：

```text
GitHub ai-plugins

↓

Registry Builder

↓

Validation

↓

KV Publish

↓

MCP Verification
```

---

# 11. AI Agent 验收清单

- [ ] MCP SDK 集成完成。
- [ ] Streamable HTTP 正常。
- [ ] initialize 通过。
- [ ] tools/list 通过。
- [ ] tools/call 通过。
- [ ] Worker 部署成功。
- [ ] KV 正常。
- [ ] ChatGPT Web 可连接。
- [ ] Secret 未泄露。
