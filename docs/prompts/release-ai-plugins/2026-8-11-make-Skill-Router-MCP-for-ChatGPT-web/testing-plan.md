# Skill Router MCP Server 测试方案

## 1. 测试目标

本测试方案用于验证生产级 Cloudflare Worker + Nitro v3 + MCP Remote Server 是否满足 ChatGPT Web Developer Mode 使用要求。

测试对象：

```text
ChatGPT Web
    |
Remote MCP
    |
Skill Router MCP Server
    |
Skill Registry
    |
Cloudflare KV / GitHub Source
```

测试目标：

- MCP 协议完全兼容。
- Skill 可以被发现、搜索、加载。
- Serverless 环境稳定运行。
- GitHub skills 同步链路可靠。
- 安全策略有效。

---

# 2. 测试分层

测试分为：

```text
Unit Test

Protocol Test

Integration Test

Deployment Test

Security Test

Performance Test
```

---

# 3. 单元测试

## 3.1 Skill Parser

验证：

- SKILL.md 解析。
- metadata.yaml 解析。
- frontmatter 格式。
- markdown 内容完整性。

异常：

- 缺少 id。
- 缺少版本。
- 非法 YAML。

---

## 3.2 Registry Builder

验证：

输入：

```text
ai-plugins/dev-skills
```

输出：

```json
{
  "skills": []
}
```

检查：

- 所有 skill 被发现。
- 重复 id 被拒绝。
- 版本格式正确。

---

## 3.3 MCP Response Builder

验证：

- JSON-RPC 格式。
- error 格式。
- result 格式。

---

# 4. MCP 协议测试

## initialize

验证：

- server 信息。
- capabilities。
- protocol version。

---

## tools/list

验证返回：

```text
list_skills
search_skills
load_skill
```

---

## tools/call

测试：

### search_skills

输入：

```json
{
 "query":"Nitro API"
}
```

验证返回匹配 skill。

### load_skill

验证：

- 内容完整。
- 来源正确。
- 版本正确。

---

# 5. Nitro v3 测试

## Handler 测试

验证：

- defineHandler 正常执行。
- 请求解析正确。
- 异常进入 catch。
- 不泄露内部错误。

---

## Service 测试

验证：

```text
mcp handler
      |
skill service
      |
registry service
```

职责隔离。

---

# 6. Cloudflare Worker 测试

## 本地测试

使用 Wrangler：

验证：

- Worker 启动。
- KV binding 正常。
- 环境变量读取。

---

## 线上 Smoke Test

部署后验证：

```text
GET /health

POST /mcp
```

检查：

- HTTPS。
- TLS。
- 延迟。
- 错误率。

---

# 7. ChatGPT Web 验收测试

真实流程：

```text
ChatGPT Web

添加 Remote MCP

连接 endpoint

调用 tools/list

调用 search_skills

调用 load_skill
```

必须验证：

- Developer Mode 可识别。
- 工具列表正常展示。
- Skill 内容可以进入上下文。

---

# 8. 性能测试

测试指标：

- P95 延迟。
- 并发请求。
- KV 命中率。
- GitHub fallback 次数。

目标：

运行时请求不依赖 GitHub API。

---

# 9. 回归测试

每次 skill 更新：

```text
Git push

↓

Registry Builder

↓

Validation

↓

KV Publish

↓

MCP Verification
```

确保旧 skill 不受影响。

---

# 10. AI Agent 实施验收清单

- [ ] MCP initialize 通过。
- [ ] tools/list 通过。
- [ ] tools/call 通过。
- [ ] Nitro 测试通过。
- [ ] Worker 部署成功。
- [ ] KV 可读取。
- [ ] ChatGPT Web 可连接。
- [ ] Skill 加载完整。
- [ ] 安全测试通过。
