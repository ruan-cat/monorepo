# Nitro v3 与 Cloudflare Worker 集成边界规范

## 文档目的

本文用于防止 AI Agent 在实现 Skill Router MCP Server 时错误混淆 Nitro v3 与 Cloudflare Worker 平台配置职责。

核心原则：

> Nitro 负责应用运行模型，Wrangler 负责 Cloudflare 平台部署。

两者不能互相替代。

---

# 1. 配置职责边界

## nitro.config.ts 负责

- Nitro 构建配置
- preset 选择
- server runtime 配置
- route rules
- runtime config
- 应用层适配

例如：

```ts
export default defineNitroConfig({
  preset: "cloudflare_module",
})
```

---

## wrangler.toml / wrangler.jsonc 负责

- Worker 名称
- compatibility_date
- KV namespace binding
- Secrets
- Routes
- 部署参数
- Cloudflare 平台资源

禁止将这些配置复制进入 nitro.config.ts。

---

# 2. 推荐项目结构

```text
skill-router-mcp/

├── nitro.config.ts
├── wrangler.toml
├── package.json
│
├── server/
│   ├── api/
│   │   └── mcp.post.ts
│   │
│   ├── services/
│   │   ├── skill-router.ts
│   │   ├── skill-registry.ts
│   │   └── github-loader.ts
│   │
│   ├── repositories/
│   ├── schemas/
│   └── types/
│
└── .github/workflows/
```

---

# 3. Cloudflare Runtime 约束

Worker 不是传统 Node Server。

禁止：

- node:http
- express server
- fs
- child_process
- listen()
- 长驻内存状态

必须使用：

- fetch API
- KV
- Cache API
- Web Crypto

---

# 4. Nitro Handler 规范

HTTP 层只负责协议转换。

禁止：

```text
mcp.post.ts
    |
    直接读取 GitHub
    直接处理 Skill 规则
    直接操作 KV
```

正确：

```text
mcp.post.ts
    |
    v
service
    |
    v
repository
```

Handler 只负责：

1. 接收请求。
2. 校验 MCP JSON-RPC。
3. 调用 service。
4. 返回响应。

---

# 5. Cloudflare Binding 设计

推荐：

KV:

```text
SKILL_REGISTRY
```

Secrets:

```text
GITHUB_TOKEN
```

Vars:

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

敏感信息禁止进入 Git。

---

# 6. 部署流程

推荐：

```text
pnpm build

↓

Nitro build

↓

wrangler deploy

↓

Cloudflare Worker

↓

Remote MCP Endpoint
```

---

# 7. AI Agent 常见错误

## 错误：把 wrangler 配置写入 nitro.config.ts

原因：混淆框架配置和平台配置。

修复：保持两个配置文件独立。

---

## 错误：使用 Node API

原因：把 Worker 当普通 Node 服务。

修复：只使用 Web API。

---

## 错误：MCP handler 直接访问 GitHub

原因：没有设计缓存层。

修复：

GitHub
→ Registry Builder
→ KV
→ MCP

---

# 8. 完成验收

实现完成后必须确认：

- Nitro 使用 Cloudflare preset。
- Wrangler 管理 Worker 资源。
- MCP endpoint 可以公网访问。
- KV binding 正常。
- 无 Node 专属 API。
- 所有业务逻辑位于 service 层。
