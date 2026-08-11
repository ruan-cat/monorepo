# Cloudflare Worker 部署实施规范

## 1. 部署目标

将 Skill Router MCP Server 部署为面向 ChatGPT Web Developer Mode 的公网 Remote MCP 服务。

目标：

```text
ChatGPT Web
      |
      |
HTTPS MCP
      |
      v
Cloudflare Worker
      |
      |
Skill Registry
```

要求：

- 全球 HTTPS 可访问。
- Serverless 执行。
- 无 Node 长驻环境依赖。
- 支持自动部署。

---

# 2. 配置职责边界

## Nitro 配置

负责：

- Nitro preset
- 构建行为
- runtime config
- route rules

## Wrangler 配置

负责：

- Worker 名称
- compatibility_date
- KV namespace
- secrets
- routes
- deployment

禁止：

把 Cloudflare 平台配置写入 Nitro 配置文件。

---

# 3. 推荐域名

建议：

```text
mcp.ai.ruan-cat.com
```

MCP Endpoint：

```text
https://mcp.ai.ruan-cat.com/mcp
```

其他接口：

```text
GET /health
GET /metadata
GET /skills
GET /skills/:id
```

---

# 4. Cloudflare Worker 架构

```text
Request
 |
Cloudflare Edge
 |
Nitro Worker
 |
MCP Handler
 |
Service Layer
 |
KV / Cache API
```

---

# 5. Runtime 约束

Cloudflare Worker 不是 Node Server。

禁止：

```text
fs
child_process
listen()
node:http
```

禁止：

- 本地文件写入。
- 全局内存状态。
- 长连接依赖。

必须：

- fetch API。
- Web Crypto。
- KV。
- Cache API。

---

# 6. Wrangler 配置要求

必须生成：

```text
wrangler.toml
```

职责：

- Worker entry
- KV binding
- Secret
- 环境配置

示例：

```toml
name = "skill-router-mcp"
compatibility_date = "2026-08-11"

[[kv_namespaces]]
binding = "SKILL_REGISTRY"
id = "xxxx"
```

---

# 7. KV 设计

Key：

```text
skill:registry
skill:{id}:metadata
skill:{id}:content
```

运行时：

```text
ChatGPT
 |
MCP
 |
KV
 |
Response
```

---

# 8. GitHub 同步流程

禁止运行时扫描 GitHub。

正确：

```text
GitHub Push
      |
GitHub Action
      |
Registry Builder
      |
Cloudflare KV
```

---

# 9. AI Gateway 使用策略

第一阶段：

不接入 AI Gateway。

原因：

当前服务是 Skill Retrieval，不是 LLM Gateway。

第二阶段：

增加：

- embedding
- rerank
- skill summary

再接入：

```text
Worker
 |
Cloudflare AI Gateway
 |
LLM
```

---

# 10. 自动部署流程

```text
Git Push
 |
GitHub Actions
 |
Install
 |
Build Nitro
 |
Deploy Worker
 |
MCP Smoke Test
```

---

# 11. 验收

必须验证：

- HTTPS 正常。
- /health 正常。
- MCP initialize 正常。
- tools/list 正常。
- load_skill 正常。
- KV 数据正确。

---

# 12. 回滚策略

必须保存：

- Git commit SHA
- Worker deployment version
- Registry version

回滚：

```text
Worker rollback
+
KV registry rollback
```

---

# 13. AI Agent 实施要求

实施顺序：

1. Nitro Worker 基础工程。
2. Wrangler 部署配置。
3. MCP 协议。
4. Skill Registry。
5. ChatGPT Web 验证。

不要跳过边界验证。
