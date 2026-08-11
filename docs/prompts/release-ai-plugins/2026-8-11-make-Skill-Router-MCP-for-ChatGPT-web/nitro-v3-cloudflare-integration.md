# Nitro v3 与 Cloudflare Worker 运行时集成边界规范

## 文档目的

本文用于防止 AI Agent 在实现 Skill Router MCP Server 时错误处理 Cloudflare Worker bindings、Secrets 与 Nitro v3 runtime。

核心原则：

> Nitro 负责应用 Runtime；Wrangler 负责 Cloudflare 平台配置；第一版只注入 GitHub source vars 和只读 credential，不需要 Cloudflare storage binding。

---

# 1. 配置职责边界

## `nitro.config.ts`

负责：

- Nitro 构建配置
- Cloudflare preset
- 应用运行时适配
- route rules

不负责：

- 上传 Secret
- 管理 Worker routes / custom domain
- 创建 Cloudflare resource

示意：

```ts
export default defineNitroConfig({
  preset: "cloudflare_module",
})
```

具体 preset 名称和配置必须以实现时当前 Nitro v3 官方文档/类型为准。

## `wrangler.toml` / `wrangler.jsonc`

负责：

- Worker 名称
- `compatibility_date`
- vars
- Secret 生命周期
- routes / domain
- deployment

MVP 不需要 `kv_namespaces`、R2、D1 或 Durable Objects。

---

# 2. 环境变量分类

## Public vars

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

示意：

```toml
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

## Secret

```text
GITHUB_TOKEN
```

使用：

```bash
wrangler secret put GITHUB_TOKEN
```

禁止写入 Wrangler 明文、Git、日志、registry 或 MCP response。

---

# 3. Wrangler 生命周期

本地：

```bash
wrangler dev
```

本地 Secret 使用 `.dev.vars` 并 gitignore。

生产：

```bash
wrangler secret put GITHUB_TOKEN
wrangler deploy
```

本地/生产均不需要预创建 KV namespace 或 R2 bucket 才能运行第一版。

---

# 4. Nitro v3 Cloudflare Binding 访问原则

实现 Agent 必须以当前 Nitro v3 Cloudflare adapter 官方文档与类型为准，不允许按照 Nitro v2 经验猜测。

当前设计只需要从 request runtime 获得：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
GITHUB_TOKEN
```

禁止使用：

```ts
process.env.GITHUB_TOKEN
```

也不要把旧 adapter 写法固定成规范：

```ts
// 不作为本项目固定规范
// event.context.cloudflare.env
```

实现时应通过一个小型 Runtime Binding Extractor 隔离 Nitro/Cloudflare adapter 的具体访问语法，这样未来 adapter API 变化不会污染业务层。

---

# 5. Runtime Binding 契约

```ts
interface RuntimeBindings {
  GITHUB_OWNER: string
  GITHUB_REPO: string
  GITHUB_REF: string
  GITHUB_TOKEN: string
}
```

不包含：

```text
SKILL_REGISTRY: KVNamespace
R2Bucket
D1Database
```

业务层不要散落读取 binding。

推荐：

```text
MCP HTTP Adapter
    |
Runtime Binding Extractor
    |
GitHub Repository Adapter
    |
SourceSnapshot(commit SHA)
    |
Skill Service
```

---

# 6. SourceSnapshot

可变 `GITHUB_REF` 只在 snapshot 建立阶段使用：

```text
GITHUB_REF=dev
     |
resolve
     v
commitSha=abc123
```

之后同一 tool call 内：

```text
registry @ abc123
SKILL.md @ abc123
references @ abc123
```

不允许 service 在处理中再次使用 `dev` 读取另一份文件。

---

# 7. Secret 泄露防护

禁止：

```ts
console.log(bindings.GITHUB_TOKEN)
```

禁止：

- 将 Secret 写入 `skill-registry.json`
- 将 Secret 放入 cache key/value
- 将 Secret 返回给 MCP Client
- 将 Secret 提交 Git

只有 GitHub Repository Adapter 接触 credential。

---

# 8. AI Agent 验收清单

- [ ] Nitro v3 binding 访问方式符合实现时当前 adapter。
- [ ] Wrangler 只管理必要平台配置。
- [ ] `GITHUB_TOKEN` 使用 Secret。
- [ ] owner/repo/ref 使用 vars。
- [ ] 第一版无 storage binding。
- [ ] GitHub Token 仅 repository adapter 使用。
- [ ] SourceSnapshot 固定 exact commit SHA。
- [ ] MCP 输出不暴露环境变量或 Secret。
