# Nitro v3 生产级接口开发指导

## 文档定位

本文指导 Skill Router MCP 在 Cloudflare Workers 上正确使用 Nitro v3。

核心链路：

```text
ChatGPT Web
  ↓
Streamable HTTP / MCP 2026-07-28
  ↓
Cloudflare Worker
  ↓
Nitro v3 Runtime
  ↓
MCP TypeScript SDK v2
  ↓
Skill Router
```

---

# 1. Nitro v3 / H3 依赖边界

Nitro v3 是应用 Runtime。

H3 是 Nitro 管理的 HTTP runtime layer：

```text
Application
  ↓
Nitro v3
  ↓
H3 runtime
  ↓
Cloudflare adapter
```

默认禁止单独安装/pin 一个可能与 Nitro 不兼容的 H3 主版本。

---

# 2. 直接依赖

生产方向：

```text
nitro
@modelcontextprotocol/server v2
```

测试使用对应 `@modelcontextprotocol/client` v2。

不要继续把 v1 `@modelcontextprotocol/sdk` 单体包作为新项目协议层基线。

H3 等 Nitro runtime dependencies 由 lockfile 固化。

---

# 3. Nitro / MCP SDK 分工

Nitro：

- Worker runtime abstraction。
- HTTP route/handler。
- Cloudflare adapter。
- runtime binding extraction boundary。

MCP SDK v2：

- MCP `2026-07-28` modern wire protocol。
- server identity metadata。
- discovery/tool protocol surface。
- `tools/list` / `tools/call`。

H3：Nitro 底层 HTTP/event abstraction。

Nitro handler 不实现 MCP lifecycle。

---

# 4. Modern MCP 不使用旧初始化会话模型

目标 MCP era 不再依赖：

```text
initialize
initialized
Mcp-Session-Id
```

因此不要在 Nitro middleware/handler 中建立：

- MCP session table。
- sticky session state。
- initialize state machine。

per-request stateless model 更适合 Cloudflare Workers。

---

# 5. Handler 规范

使用实现时 Nitro v3 当前公开 handler API；handler 只做 adapter：

```ts
export default defineEventHandler(async (event) => {
  // extract current request runtime
  // delegate Request to MCP v2 adapter/handler
})
```

具体 helper 名称以实施时 Nitro v3 官方 API/类型为准。

禁止：

- handler 写 Skill search/load 业务。
- handler 拼 GitHub Authorization。
- 自建 Node HTTP server。
- 手写 MCP JSON-RPC/router/protocol headers。

---

# 6. Cloudflare Runtime 约束

禁止：

```text
fs persistence
child_process
listen()
Node HTTP server
module-scope “latest Skill” state
MCP session persistence
```

优先：Web APIs / Cloudflare runtime APIs。

MVP 不依赖 KV/R2/D1/DO。

---

# 7. Runtime Bindings

必需：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
GITHUB_TOKEN
CF_VERSION_METADATA
```

其中 `CF_VERSION_METADATA` 来自 Wrangler：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

用途：线上 Worker Version ID/tag/timestamp 查询。

具体 binding access 必须按当前 Nitro v3 Cloudflare adapter request runtime 获取，不复用 Nitro v2 旧 context 经验。

---

# 8. Build Git SHA

Worker build commit 由 build-time injection 提供，而不是 runtime 执行 Git 命令。

建议产生：

```text
build-info.generated.ts
```

并被 `get_server_info` / `/health` 使用。

---

# 9. GitHub SourceSnapshot

业务调用：

```text
latest:
GITHUB_REF -> exact SHA

pinned:
sourceCommitSha -> exact SHA
```

之后 registry/Skill/related files 全部使用该 exact SHA。

Nitro/H3 handler 不维护 source freshness/session state。

---

# 10. Error Boundary

区分：

- MCP protocol/tool error。
- GitHub auth/rate-limit/not-found。
- registry invalid。
- source snapshot failure。
- deployment metadata configuration error。

Secret/internal stack 不进入 MCP user-facing result。

---

# 11. 发版边界

Skill-only update 不触发 Nitro/Worker build。

MCP Runtime update 才执行：

```text
SemVer bump
 -> Nitro production build
 -> Worker version upload
 -> Preview/Staging
 -> production promotion
```

详细见 `mcp-release-versioning-and-production-maintenance.md`。

---

# 12. AI Agent 检查

- [ ] Nitro v3。
- [ ] H3 由 Nitro 管理。
- [ ] MCP SDK v2 + `2026-07-28`。
- [ ] 无 legacy initialize/session architecture。
- [ ] Nitro endpoint 只做 adapter。
- [ ] GitHub Skill 读取 exact SHA。
- [ ] Worker version metadata binding 可读。
- [ ] build SHA 由构建期注入。
- [ ] 无 mandatory KV/R2/D1/DO。
- [ ] 在 workerd + production build + Cloudflare preview 验证。
