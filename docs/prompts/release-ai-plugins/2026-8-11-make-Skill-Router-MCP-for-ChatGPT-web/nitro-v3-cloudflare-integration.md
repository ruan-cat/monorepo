# Nitro v3 与 Cloudflare Worker 运行时集成边界规范

## 文档目的

本文防止 AI Agent 混淆 Nitro v3 Runtime、Wrangler 平台配置、Secrets、Worker Version Metadata 与 MCP 领域逻辑。

核心：

> Nitro 负责应用 Runtime；Wrangler 负责 Cloudflare 平台资源和版本部署；业务层只接收收敛后的 Runtime Context。

MVP 无 KV/R2/D1/DO。

---

# 1. 配置职责

## `nitro.config.ts`

负责：

- Nitro v3 build。
- Cloudflare preset。
- app routes/runtime abstraction。

不负责：

- Secret upload。
- Worker routes/domain ownership。
- Cloudflare version deployment。
- storage resource lifecycle。

具体 preset/API 以实施时当前 Nitro v3 官方文档/类型为准。

## `wrangler.toml` / `wrangler.jsonc`

负责：

- Worker name。
- `compatibility_date`。
- vars / Secrets。
- domain/routes。
- Version Metadata binding。
- versions/deployments/rollback。

---

# 2. Public Vars / Secret

Public：

```toml
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

Secret：

```text
GITHUB_TOKEN
```

生产上传：

```bash
wrangler secret put GITHUB_TOKEN
```

禁止 Token 进入 Git、logs、registry、MCP result、build metadata。

---

# 3. Worker Version Metadata Binding

Wrangler：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

Cloudflare runtime 提供：

```text
id
  = Worker Version ID

tag
  = version tag

timestamp
  = version creation timestamp
```

用途：

- `get_server_info`。
- `/health`。
- structured logs。
- candidate/production smoke。
- rollback diagnosis。

Version Metadata binding 不是 Secret，也不是 storage binding。

---

# 4. Runtime Binding Contract

概念：

```ts
interface RuntimeBindings {
	GITHUB_OWNER: string;
	GITHUB_REPO: string;
	GITHUB_REF: string;
	GITHUB_TOKEN: string;
	CF_VERSION_METADATA: WorkerVersionMetadata;
}
```

再转换为业务可消费对象：

```text
ApplicationRuntimeContext
  ├─ public source config
  ├─ repository adapter
  └─ deployment info
```

不要把整份 Cloudflare env 传遍 Service 层。

---

# 5. Nitro v3 Binding Access

实现 Agent 必须按当前 Nitro v3 Cloudflare adapter 的 **request runtime** API 读取 bindings。

禁止：

```ts
process.env.GITHUB_TOKEN;
```

也不要把旧 adapter 写法固定成新规范：

```ts
// 不作为项目固定 contract
// event.context.cloudflare.env
```

必须用一个小型 Runtime Binding Extractor 隔离具体 Nitro/Cloudflare API。

这样 Nitro adapter 未来变化只改一个边界。

---

# 6. SourceSnapshot

Latest：

```text
request
  ↓
GITHUB_REF
  ↓
resolve once -> commitSha=A
  ↓
SourceSnapshot(A)
```

Pinned：

```text
sourceCommitSha=A
  ↓
validate exact commit in configured owner/repo
  ↓
SourceSnapshot(A)
```

之后同一次 Skill tool call：

```text
registry @ A
SKILL.md @ A
related files @ A
```

不得再次使用 mutable `dev` 读取正文。

---

# 7. DeploymentInfo

Worker deployment metadata 与 Skill SourceSnapshot 分开：

```ts
interface DeploymentInfo {
	workerVersionId: string;
	workerVersionTag?: string;
	workerVersionTimestamp: string;
	buildGitSha: string;
}
```

其中：

- Worker ID/tag/timestamp：`CF_VERSION_METADATA`。
- buildGitSha：CI/build-time injection。

禁止：

```text
Worker Version ID == MCP SemVer
Worker Version ID == sourceCommitSha
```

---

# 8. Build Git SHA

推荐构建阶段生成：

```text
build-info.generated.ts
```

来源优先：

```text
GitHub Actions GITHUB_SHA
```

或 build-time `git rev-parse HEAD`。

运行时不执行 Git 命令、不读取 repo filesystem。

---

# 9. MCP Compatibility Boundary

Nitro 只负责把 Web Request/Response 交给 OpenAI 当前 ChatGPT 官方兼容的 MCP SDK path：

```text
@modelcontextprotocol/sdk
McpServer
Streamable HTTP
```

不要在 Nitro adapter 里实现自定义 MCP negotiation/lifecycle。

Future MCP major 只有在 OpenAI 当前官方文档 + Inspector + ChatGPT Web 真实验证通过后迁移。

---

# 10. 本地开发

```bash
wrangler dev
```

本地 Secret 放 `.dev.vars` 并 gitignore。

MVP 不需要预创建 KV/R2/D1/DO。

本地 version metadata 若与 production 行为不同，测试使用 Cloudflare 官方测试能力或明确 fixture；不要把假值误称为 production Worker Version ID。

---

# 11. Production Deployment

不再把：

```bash
wrangler deploy
```

作为唯一推荐 production 流程，因为 Cloudflare 默认会创建新 Worker version 并立即部署到 100% 流量。官方 Versions & Deployments 支持把 version upload 和 deployment 分离。

推荐：

```text
all gates
  ↓
wrangler versions upload
  ↓
versioned Preview URL / staging smoke
  ↓
exact candidate production deployment
  ↓
production smoke
```

Cloudflare 官方 Preview URLs 能用于测试 `wrangler versions upload` 产生的不可变 Worker version。

---

# 12. Tool Contract 与 ChatGPT Snapshot

Worker code 已部署，不代表 ChatGPT Workspace 已启用新的 tool definitions。

当 tool schema/metadata 改变时：

```text
Worker candidate
  ↓
MCP Inspector / Developer Mode
  ↓
ChatGPT refresh/rescan
  ↓
workspace review/publish when applicable
```

OpenAI 当前 Workspace MCP 使用冻结的已批准 tool/input snapshot；后续 server update 不会自动启用新动作。

Skill-only Git data 更新不改变 tool schema，因此不需要这一流程。

---

# 13. Secret 泄露防护

只有 GitHub Repository Adapter 接触 `GITHUB_TOKEN`。

禁止：

- `console.log(token)`。
- raw env dump。
- Secret 写入 cache/version metadata。
- Secret 返回 MCP client。

`get_server_info` 只返回安全 deployment metadata。

---

# 14. 回滚边界

Cloudflare 支持通过 `wrangler rollback [VERSION_ID]` 回滚到先前 Worker version，并让指定版本成为新的 active deployment。

Runtime bug：Worker rollback。

Skill content bug：Git revert/fix。

Tool-contract bug：Worker rollback 后还需确认 ChatGPT 已批准的 tool snapshot 与回滚版本兼容。

---

# 15. 验收清单

- [ ] Nitro v3 request runtime binding access 已按当前官方 API 验证。
- [ ] Wrangler public vars / Secret / version metadata 职责清楚。
- [ ] `CF_VERSION_METADATA` 可读。
- [ ] buildGitSha 由构建期注入。
- [ ] RuntimeBindings / DeploymentInfo / SourceSnapshot 分离。
- [ ] Token 只在 repository adapter 使用。
- [ ] 无 `process.env` 作为 Worker Secret 读取方案。
- [ ] production 使用 version upload -> preview -> promote -> smoke。
- [ ] Tool contract change 有 ChatGPT refresh/review gate。
- [ ] 无 mandatory KV/R2/D1/DO。
