# Cloudflare Runtime Binding Contract

## 文档目的

本文定义 Skill Router MCP Server 在 Cloudflare Worker + Nitro v3 环境中的运行时绑定契约。

目标：

- vars / Secret 分层。
- GitHub source snapshot 边界。
- Cloudflare Worker version metadata 可查询。
- 不为了缓存提前增加存储 binding。

---

# 1. Runtime Binding 总体模型

```text
Cloudflare Worker Runtime
        |
        | vars / secrets / version metadata
        v
Nitro v3 request runtime
        |
        v
Runtime Binding Extractor
        |
        +-- DeploymentInfo Provider
        |
        +-- GitHub Repository Adapter
        |
        v
Application Services
```

MVP 不需要 KV/R2/D1/DO。

---

# 2. Public Vars

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

Wrangler：

```toml
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

这些描述 Skill source 位置，不描述 Worker deployment version。

---

# 3. Secret

唯一必需敏感配置：

```text
GITHUB_TOKEN
```

生产：

```bash
wrangler secret put GITHUB_TOKEN
```

禁止进入：

- Git。
- `wrangler.toml` 明文。
- 日志。
- MCP result。
- build metadata。

---

# 4. Cloudflare Version Metadata Binding

为支持线上版本查询，Wrangler 应增加：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

Cloudflare runtime 会提供：

```text
id
  = Worker Version ID

tag
  = 本次 upload 设置的 Version Tag
timestamp
  = Worker Version 创建时间
```

它用于：

- `get_server_info`。
- `/health` 的安全部署诊断字段。
- structured logs。
- production smoke。
- rollback 诊断。

这不是存储 binding，也不引入 KV/R2 一致性问题。

---

# 5. TypeScript Runtime Contract

建议概念类型：

```ts
export interface RuntimeBindings {
  GITHUB_OWNER: string
  GITHUB_REPO: string
  GITHUB_REF: string
  GITHUB_TOKEN: string
  CF_VERSION_METADATA: WorkerVersionMetadata
}
```

领域对象分开：

```ts
export interface SourceSnapshot {
  repository: string
  ref: string
  commitSha: string
}

export interface DeploymentInfo {
  workerVersionId: string
  workerVersionTag?: string
  workerVersionTimestamp: string
  buildGitSha: string
}
```

规则：

```text
RuntimeBindings
!=
SourceSnapshot
!=
DeploymentInfo
```

不要把 Worker Version ID 当作 Skill source commit。

---

# 6. Build Git SHA

`buildGitSha` 不来自 Cloudflare version metadata binding。

它应在构建阶段注入 production bundle，例如来源：

```text
GitHub Actions GITHUB_SHA
```

或构建阶段：

```text
git rev-parse HEAD
```

运行时禁止执行 Git 命令/读取工作区来猜 build SHA。

---

# 7. Nitro v3 获取原则

禁止：

```ts
process.env.GITHUB_TOKEN
```

也不要硬编码旧 Nitro context API。

实现 Agent必须依据当前 Nitro v3 Cloudflare adapter，从 request runtime 获取 bindings，并在 adapter 边界收敛平台类型。

```text
Nitro Handler
    |
Runtime Binding Extractor
    |
Application Runtime Context
```

业务 Service 不应该到处读取 Worker env。

---

# 8. Request Scope / GitHub SourceSnapshot

默认 latest tool call：

```text
request bindings
  ↓
read configured GITHUB_REF
  ↓
resolve once -> commit SHA
  ↓
SourceSnapshot
```

Pinned load：

```text
sourceCommitSha input
  ↓
validate exact SHA in configured repository
  ↓
SourceSnapshot
```

同一次调用全部 Skill 读取使用该 snapshot。

不要把 `SourceSnapshot` 缓存在 module scope 代表“当前最新”。

---

# 9. Service 层

Service 不接收 Secret：

错误：

```ts
skillService.load(env.GITHUB_TOKEN)
```

正确：

```text
Handler
  ↓
Repository Adapter / DeploymentInfo Provider
  ↓
Domain Service
```

只有 GitHub Repository Adapter 接触 Token。

`get_server_info` 使用 DeploymentInfo / server version/tool definitions，不需要接触 GitHub Token。

---

# 10. Cloudflare Resource Bindings

MVP 明确不要求：

```text
KV Namespace
R2 Bucket
D1 Database
Durable Object Namespace
```

未来加入任何 storage binding 必须同时更新：

- architecture。
- runtime binding contract。
- Wrangler config。
- testing。
- rollback compatibility。

---

# 11. 本地开发

```bash
wrangler dev
```

敏感本地值：

```text
.dev.vars
```

并 gitignore。

测试环境对 `CF_VERSION_METADATA` 应按 Workers Vitest / harness 当前能力提供真实或明确 fixture，不允许测试代码假装它是 MCP app SemVer。

---

# 12. Production Release

生产不再只以裸：

```text
wrangler deploy
```

作为推荐唯一流程。

推荐：

```text
versions upload
  ↓
Preview/Staging smoke
  ↓
exact version promote/deploy
```

详细见：

```text
mcp-release-versioning-and-production-maintenance.md
```

---

# 13. 验收清单

- [ ] vars 与 Secret 区分。
- [ ] `GITHUB_TOKEN` 不泄露。
- [ ] `CF_VERSION_METADATA` 已配置。
- [ ] MCP app SemVer / Worker version / build SHA / Skill source SHA 概念分离。
- [ ] `get_server_info` 能读取安全 deployment metadata。
- [ ] Repository Adapter 隔离 GitHub credential。
- [ ] 每个 latest/pinned tool call 建立 exact SourceSnapshot。
- [ ] 无 `process.env` 作为 Worker binding 方案。
- [ ] 无 mandatory KV/R2/D1/DO。
