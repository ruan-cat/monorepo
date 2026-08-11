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

# 2. 推荐域名

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

# 3. Cloudflare Worker 架构

```text
                    Request
                       |
                       v
              Cloudflare Edge
                       |
                       v
                 Nitro Worker
                       |
        --------------------------------
        |              |               |
     MCP Handler   Skill Service    Cache
        |              |               |
        |              |               |
     JSON-RPC       KV Lookup     Cache API
```

---

# 4. Runtime 约束

Cloudflare Worker 不是 Node Server。

禁止：

```text
fs
child_process
listen()
process
```

禁止：

- 本地文件写入。
- 全局状态缓存。
- 长连接依赖。

必须：

- fetch API。
- Web Crypto。
- KV。
- Cache API。

---

# 5. Nitro v3 部署模式

推荐：

```text
Nitro v3
    |
Cloudflare preset
    |
Worker module
```

部署产物必须适配 Worker runtime。

禁止输出传统 Node server。

---

# 6. Wrangler 配置要求

需要配置：

- worker name。
- compatibility date。
- KV bindings。
- secrets。
- routes。

示例结构：

```toml
name = "skill-router-mcp"
compatibility_date = "2026-08-11"

[[kv_namespaces]]
binding = "SKILL_REGISTRY"
```

---

# 7. KV 设计

使用 KV 作为运行时 Registry。

Key：

```text
skill:registry
skill:{id}:metadata
skill:{id}:content
```

Worker 请求：

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

运行时禁止扫描 GitHub。

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

优势：

- 降低延迟。
- 避免 GitHub API 限制。
- 提高稳定性。

---

# 9. Cloudflare AI Gateway 使用策略

第一阶段：

不接入 AI Gateway。

原因：

当前 Worker 主要职责：

- skill index 查询。
- skill content 返回。

不存在大量模型调用。

---

第二阶段：

如果增加：

- embedding 检索。
- skill 自动摘要。
- rerank。
- 智能路由。

架构：

```text
Worker
 |
AI Gateway
 |
LLM Provider
```

AI Gateway 用于：

- 请求管理。
- 日志。
- 缓存。
- 限流。

---

# 10. 自动部署流程

推荐：

```text
Git Push
 |
GitHub Actions
 |
Build Nitro
 |
Deploy Worker
 |
Run MCP Smoke Test
```

---

# 11. 部署验收

必须验证：

```text
HTTPS 可访问

/mcp 返回 MCP response

/health 正常

tools/list 正常

load_skill 正常

KV 数据存在
```

---

# 12. 回滚策略

要求保留：

- Worker deployment history。
- KV registry version。
- Git commit SHA。

回滚：

```text
Worker version rollback
+
KV registry rollback
```

---

# 13. AI Agent 实施要求

实现 Agent 必须：

1. 优先完成 Worker 基础部署。
2. 再接入 MCP。
3. 再接入 Registry。
4. 最后接入 ChatGPT Web。

不要一次性开发所有模块。
