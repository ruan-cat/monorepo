# Nitro v3 与 Cloudflare Worker 环境变量集成边界规范

## 文档目的

本文用于防止 AI Agent 在实现 Skill Router MCP Server 时错误处理 Cloudflare Worker 的 bindings、Secrets 与 Nitro v3 运行时。

核心原则：

> Nitro 负责应用层抽象；Wrangler 负责 Cloudflare Worker 平台资源；Cloudflare env bindings 是运行时真实配置来源。

不要把 Cloudflare Secret 模型误解为普通 Node 环境变量。

---

# 1. 配置职责边界

## nitro.config.ts

负责：

- Nitro 构建配置
- Cloudflare preset
- 应用运行时适配
- route rules
- runtime 配置声明

不负责：

- KV 创建
- Worker Secret 上传
- Cloudflare vars
- Worker routes

示例：

```ts
export default defineNitroConfig({
  preset: "cloudflare_module",
})
```

---

## wrangler.toml / wrangler.jsonc

负责：

- Worker 名称
- compatibility_date
- KV bindings
- vars
- secrets
- routes
- environments

示例：

```toml
name = "skill-router-mcp"
compatibility_date = "2026-08-11"

[[kv_namespaces]]
binding = "SKILL_REGISTRY"
id = "xxxx"
```

---

# 2. 环境变量分类设计

## 非敏感配置

使用 Wrangler vars：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

这些不是密码，可以进入 wrangler 配置。

---

## 敏感配置

必须使用 Cloudflare Secrets：

```text
GITHUB_TOKEN
```

禁止：

- 写入 wrangler.toml
- 写入 Git 仓库
- 输出日志
- 返回 MCP response

---

# 3. Wrangler CLI 管理流程

## 本地开发

使用：

```bash
wrangler dev
```

敏感值：

```text
.dev.vars
```

或：

```text
.env
```

这些文件必须加入 `.gitignore`。

---

## 上传 Secret

使用：

```bash
wrangler secret put GITHUB_TOKEN
```

Agent 不允许生成明文 Secret 文件提交。

---

## 部署

```bash
wrangler deploy
```

部署后 Cloudflare Worker Runtime 自动提供 bindings。

---

# 4. Nitro v3 如何读取 Cloudflare env

重要：不要假设 Node 风格：

```ts
process.env.GITHUB_TOKEN
```

也不要假设：

```ts
event.context.cloudflare.env
```

在所有 Nitro v3 Cloudflare preset 中都可用。

实际实现必须依据 Nitro v3 Cloudflare adapter 暴露的 runtime context API。

推荐方式：

## 方式 A：通过 Cloudflare Worker env binding 注入 service

架构：

```text
Worker Runtime
      |
      env bindings
      |
Nitro request context
      |
Service dependency injection
```

示意：

```ts
interface RuntimeBindings {
  GITHUB_TOKEN: string
  GITHUB_OWNER: string
  GITHUB_REPO: string
  GITHUB_REF: string
  SKILL_REGISTRY: KVNamespace
}
```

service 不直接读取全局变量，而由 runtime 层传入。

---

# 5. MCP Server 环境读取原则

错误：

```text
mcp.post.ts
    |
读取 Secret
    |
调用 GitHub
```

正确：

```text
mcp.post.ts
    |
MCP Router
    |
Skill Service
    |
GitHub Repository Adapter
    |
Runtime Binding
```

只有最底层 adapter 使用 GitHub Token。

---

# 6. Secret 泄露防护

必须保证：

## 日志

禁止：

```ts
console.log(env.GITHUB_TOKEN)
```

---

## MCP Response

禁止返回：

- token
- secret
- GitHub auth header

---

## Skill Content

Skill markdown 中即使包含配置说明，也不能包含真实 Secret。

---

# 7. AI Agent 实现检查清单

实现前确认：

- [ ] 明确 Nitro 与 Wrangler 职责
- [ ] 明确 Secret 与 vars 区别
- [ ] 使用 wrangler secret put 管理敏感值
- [ ] 不提交 `.dev.vars`
- [ ] 不依赖 process.env
- [ ] 不假设错误的 Cloudflare context API
- [ ] 使用 Nitro v3 Cloudflare adapter 推荐方式读取 bindings

---

# 8. 完成验收

必须确认：

- Nitro 使用 Cloudflare preset。
- Wrangler 管理 Worker 资源。
- Secret 通过 Cloudflare Secret 注入。
- MCP 服务可以访问 GitHub Source Adapter。
- Secret 不会出现在日志、响应或仓库中。
