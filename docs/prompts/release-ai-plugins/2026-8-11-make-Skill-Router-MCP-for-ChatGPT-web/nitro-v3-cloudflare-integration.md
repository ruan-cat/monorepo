# Nitro v3 与 Cloudflare Worker 环境变量集成边界规范

## 文档目的

本文用于防止 AI Agent 在实现 Skill Router MCP Server 时错误处理 Cloudflare Worker bindings、Secrets 与 Nitro v3 runtime。

核心原则：

> Nitro 负责应用层抽象；Wrangler 负责 Cloudflare 平台资源；Cloudflare bindings 在请求生命周期内提供给 Nitro 应用。

不要把 Cloudflare Secret 模型等同于普通 Node 环境变量。

---

# 1. 配置职责边界

## nitro.config.ts

负责：

- Nitro 构建配置
- Cloudflare preset
- 应用运行时适配
- route rules

不负责：

- 创建 KV
- 上传 Secret
- 管理 Worker routes

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

---

# 2. 环境变量分类

不要过度 Secret 化。

## 普通配置 vars

以下变量不是敏感信息：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

可以使用：

```toml
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

---

## Secret

只有访问凭证必须严格管理：

```text
GITHUB_TOKEN
```

使用：

```bash
wrangler secret put GITHUB_TOKEN
```

禁止：

- 写入 wrangler.toml 明文
- 提交 Git
- 输出日志
- 返回 MCP response

---

# 3. Wrangler CLI 生命周期

本地：

```bash
wrangler dev
```

敏感本地变量使用：

```text
.dev.vars
```

并加入 `.gitignore`。

生产：

```bash
wrangler deploy
```

Secret 使用：

```bash
wrangler secret put GITHUB_TOKEN
```

---

# 4. Nitro v3 Cloudflare Binding 访问原则

实现 Agent 必须以当前 Nitro v3 Cloudflare adapter 文档为准，不允许按照 Nitro v2 经验猜测。

对于 Cloudflare Module preset，推荐从 Nitro v3 request runtime 获取 binding：

```ts
export default defineHandler(async (event) => {
  const { env } = event.req.runtime.cloudflare

  const registry = env.SKILL_REGISTRY

  return registry
})
```

不要把以下写法作为 Nitro v3 通用规范：

```ts
process.env.GITHUB_TOKEN
```

也不要默认使用旧 adapter 路径：

```ts
// 不作为本项目固定规范
// event.context.cloudflare.env
```

如果某个 adapter 提供兼容路径，必须以该 adapter 类型定义和官方文档为准。

---

# 5. Runtime Binding 契约

推荐统一类型：

```ts
interface RuntimeBindings {
  GITHUB_OWNER: string
  GITHUB_REPO: string
  GITHUB_REF: string
  GITHUB_TOKEN: string
  SKILL_REGISTRY: KVNamespace
}
```

业务层不要散落读取 binding。

推荐：

```text
MCP Handler
    |
Skill Service
    |
Repository Adapter
    |
Runtime Bindings
```

---

# 6. MCP 环境读取原则

错误：

```text
mcp.post.ts
 |
直接读取 Token
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

---

# 7. Secret 泄露防护

禁止：

```ts
console.log(env.GITHUB_TOKEN)
```

禁止：

- 将 Secret 写入 KV
- 将 Secret 写入 skill markdown
- 将 Secret 返回给 MCP Client
- 将 Secret 提交 Git

---

# 8. AI Agent 验收清单

- [ ] Nitro v3 binding 访问方式符合当前 adapter
- [ ] Wrangler 管理 Cloudflare resources
- [ ] GITHUB_TOKEN 使用 Secret
- [ ] GITHUB_OWNER/GITHUB_REPO/GITHUB_REF 使用 vars
- [ ] MCP 不暴露环境变量
- [ ] GitHub Token 仅在 repository adapter 使用
