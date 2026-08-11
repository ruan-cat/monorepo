# Cloudflare Runtime Binding Contract

## 文档目的

本文定义 Skill Router MCP Server 在 Cloudflare Worker + Nitro v3 环境中的运行时绑定契约。

目标：防止 AI Agent 自行猜测环境变量读取方式、混淆 Wrangler 配置与 Nitro 应用配置、错误处理 Secret，或为了缓存提前引入不必要的 Cloudflare storage binding。

---

# 1. Runtime Binding 总体模型

```text
Cloudflare Worker Runtime
        |
        | vars / secrets
        v
Nitro v3 request runtime
        |
        v
Runtime Binding Extractor
        |
        v
Request-scoped GitHub Repository Adapter
        |
        v
Application Services
```

第一版只有 GitHub source 配置和 credential；没有必需 KV/R2/D1 binding。

---

# 2. Binding 分类

## 2.1 Public Vars

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

用途：

- 定位 GitHub repository
- 指定可变 source ref，例如 `dev`
- 为每次请求解析 exact commit SHA

推荐 Wrangler：

```toml
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

---

## 2.2 Secret Binding

唯一必需敏感配置：

```text
GITHUB_TOKEN
```

生产：

```bash
wrangler secret put GITHUB_TOKEN
```

禁止：

- 写入 `wrangler.toml`
- 提交 Git
- 输出日志
- 返回 MCP response
- 写入任何 cache/storage

---

## 2.3 Cloudflare Resource Binding

MVP：

```text
无必需 resource binding
```

特别是不要默认增加：

```text
SKILL_REGISTRY: KVNamespace
R2 bucket
D1 database
Durable Object namespace
```

未来只有在独立设计和真实指标支持时才能加入；加入后必须同步本契约、Wrangler、测试与部署文档。

---

# 3. TypeScript Runtime Contract

第一版建议：

```ts
export interface RuntimeBindings {
  GITHUB_OWNER: string
  GITHUB_REPO: string
  GITHUB_REF: string
  GITHUB_TOKEN: string
}
```

Skill source snapshot 与 binding 分开建模：

```ts
export interface SourceSnapshot {
  repository: string
  ref: string
  commitSha: string
}
```

`RuntimeBindings` 是平台输入；`SourceSnapshot` 是每次业务调用解析后的不可变版本上下文。

---

# 4. Nitro v3 获取原则

禁止：

```ts
process.env.GITHUB_TOKEN
```

禁止硬编码旧 Nitro / Cloudflare context API。

实现 Agent 必须依据当前 Nitro v3 Cloudflare adapter 的 request runtime 获取 bindings，并把平台对象收敛在 adapter 边界内。

```text
HTTP Handler
    |
Runtime Binding Extractor
    |
RuntimeBindings
    |
GitHub Repository Adapter
```

---

# 5. Request Scope 与 Source Snapshot

禁止在 module scope 保存由 Secret 或可变 ref 派生的客户端状态：

```ts
// 禁止作为架构默认
const githubClient = new GithubClient(globalEnv.GITHUB_TOKEN)
```

推荐：

```text
Tool Call
 |
读取当前 request bindings
 |
创建/获取只读 GitHub adapter
 |
resolve GITHUB_REF -> commit SHA
 |
创建 SourceSnapshot
 |
同一 SHA 完成所有 Skill 读取
```

如果安全地复用无状态 HTTP client，也不能复用旧的 `SourceSnapshot` 来代表最新 branch。

---

# 6. Service 层规则

Service 不应该知道 Cloudflare env 或 Secret：

错误：

```ts
skillService.load(env.GITHUB_TOKEN)
```

正确：

```text
Handler
 |
Repository Adapter / SourceSnapshot provider
 |
Skill Service
```

业务 Service 接收领域接口和 snapshot，不接收平台 credential。

---

# 7. GitHub Repository Adapter

职责：

- 使用 `GITHUB_TOKEN` 进行只读 GitHub API 请求
- resolve `GITHUB_REF` 到 commit SHA
- 读取 `ai-plugins/skill-registry.json` @ SHA
- 读取 skill files @ SHA
- 输出可诊断 source metadata

只有该边界接触 `GITHUB_TOKEN`。

---

# 8. 本地开发

运行：

```bash
wrangler dev
```

敏感值放：

```text
.dev.vars
```

例如：

```text
GITHUB_TOKEN=xxxx
```

`.dev.vars` 必须 gitignore。

本地不需要创建 KV namespace 或 R2 bucket 才能启动完整 MCP 链路。

---

# 9. 生产部署

公开配置：Wrangler vars。

敏感配置：Cloudflare Secret。

部署：

```bash
wrangler deploy
```

---

# 10. AI Agent 验收清单

- [ ] vars 与 secrets 已区分。
- [ ] `GITHUB_TOKEN` 未进入仓库、日志或 MCP 输出。
- [ ] 第一版没有无理由增加 storage binding。
- [ ] Repository Adapter 隔离 GitHub credential。
- [ ] 没有 `process.env` 依赖。
- [ ] 每次 tool call 可以建立新的 exact-commit `SourceSnapshot`。
- [ ] 本地 `wrangler dev` 无 KV/R2 也可运行。
- [ ] 生产 `wrangler deploy` 可运行。
