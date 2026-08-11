# Skill Router MCP：Cloudflare Worker 生产构建与线上测试策略

## 1. 文档目的

本文定义从本地 production build 到 Cloudflare production 的测试与版本发布边界。

目标链：

```text
Production Build
  ↓
createTestHarness integration
  ↓
immutable Worker version upload
  ↓
Version Preview / Staging smoke
  ↓
exact version promote
  ↓
Production read-only smoke
```

每一级都必须能回答：

```text
“我测的是哪一个 MCP app version / Worker version / build Git commit？”
```

---

# 2. 测试与发布版本维度

远端测试记录至少包含：

```text
mcpServerVersion
mcpProtocolRevision = 2026-07-28
workerVersionId
workerVersionTag
buildGitSha
sourceCommitSha（若发生 Skill 读取）
```

MCP application / Worker deployment / Skill snapshot 必须区分。

---

# 3. Production Build Gate

Nitro Cloudflare production build 必须先完成。

检查：

- build 成功。
- production entry / Wrangler config 可解析。
- MCP package SemVer 已注入 server identity。
- build Git SHA 已注入 bundle。
- `CF_VERSION_METADATA` binding 已声明。
- 无 Node listening server/fs persistence 假设。

具体 Nitro 输出路径以实施时 preset 为准。

---

# 4. `createTestHarness()` Integration

Node test runner 使用 Wrangler production-build harness 启动真实生产 Worker artifact，并从 HTTP/MCP v2 client 外部访问。

GitHub upstream 使用 MSW/等价 mock：

```text
resolve ref
registry @ SHA
Skill @ SHA
rate limit/auth/error
```

未声明 outbound request 默认失败，防止 CI 意外访问真实 GitHub。

---

# 5. Production-build MCP Modern Contract

不再测试 legacy：

```text
initialize / initialized
```

作为 MCP `2026-07-28` 的成功条件。

必须覆盖：

## Health

```text
GET /health
```

返回安全版本诊断：MCP SemVer、Worker metadata（可由 harness fixture）、build SHA。

## Server identity

v2 client 能读取 modern serverInfo；version 与 MCP package version 一致。

## `tools/list`

完整工具目录来自统一 toolDefinitions：

```text
get_server_info
list_skills
search_skills
load_skill
```

## `get_server_info`

检查：

```text
server version/protocol/build SHA
Worker version ID/tag/timestamp
registry schema version
tools[]
```

且 `tools[]` 与标准 tool catalog 同源。

## Skill flows

```text
list_skills
search_skills -> A
load_skill(pin=A) -> A
load_skill(latest) -> B
```

## Negative

unknown tool/Skill、registry missing/invalid、upstream auth/rate limit、malformed modern request。

---

# 6. Immutable Worker Version Upload

Production deploy pipeline 不建议直接用裸 `wrangler deploy` 把未经远端 smoke 的版本立即切到 100%。

推荐：

```text
wrangler versions upload
```

并设置：

```text
tag = skill-router-mcp-vX.Y.Z
message = build Git SHA + release summary
```

上传完成得到不可变 Worker Version ID 和 Preview URL，再执行远端 smoke。

---

# 7. Cloudflare Preview / Staging

使用 versioned preview URL 或 staging 环境验证：

```text
Cloudflare network
workerd production runtime
HTTPS
real vars/Secrets
real read-only GitHub connectivity
```

最小 smoke：

```text
GET /health
modern server identity
tools/list
get_server_info
search known Skill
load pinned
load latest
unknown Skill
```

额外断言：

- MCP SemVer = 待发布 version。
- Worker Version ID/tag = 本次 upload。
- buildGitSha = 本次构建 commit。

---

# 8. Staging Credential

使用专门 read-only GitHub credential。

MVP 不需要 staging KV/R2/D1/DO，因为 production 也不依赖这些资源。

---

# 9. 高频 `dev` 更新下避免 Flaky

线上 Skill source ref 可能持续推进。

禁止：

```text
returned sourceCommitSha == 几秒前测试机读到的 HEAD
```

正确：

```text
search returns A
load(pin=A) returns A
```

Worker deployment version 则不同：Preview URL 对应的是不可变 Worker version，必须精确断言 Worker Version ID/tag/MCP SemVer/buildGitSha。

---

# 10. Production Promotion

Preview/Staging 全绿后，promote **刚才测试过的 exact Worker version**。

默认：

```text
100% atomic promotion
```

原因：Tool catalog/schema 属于 protocol-visible contract。若旧新 Worker 同时暴露不同 tools/schema，会造成客户端请求间 version skew。

Cloudflare gradual deployment 仅用于明确完全向后兼容的内部变化，并经过额外 compatibility/version-affinity 设计后采用。

第一版不要为了“高级发布”强制流量切分。

---

# 11. Production Post-deploy Smoke

promote 后立即运行：

```text
GET /health
read modern server identity
tools/list
get_server_info
search known Skill
load pinned using returned sourceCommitSha
```

必须验证线上：

```text
expected MCP SemVer
expected Worker Version ID/tag
expected buildGitSha
```

已经变成 production active version。

禁止：高并发、写 GitHub、修改 Cloudflare state、长时间 soak。

---

# 12. Production Tool Catalog Smoke

生产发版尤其是新增/修改 tool 时，必须比较：

```text
expected toolDefinitions
  == tools/list
  == get_server_info.tools
```

这样 ChatGPT 用户询问“你现在有什么工具”时，返回的是生产实际工具集，不是文档中的旧列表。

---

# 13. Production Security Smoke

- response 无 Token/auth header。
- invalid request 无内部 stack。
- `get_server_info` 只返回公开/安全部署 metadata。
- tool annotations 是只读/非破坏性。
- related file 读取不能越界。

---

# 14. Real GitHub Integration

Preview/Staging 至少真实完成：

```text
resolve ref
read registry
read known Skill
```

验证 Cloudflare outbound fetch + GitHub permission + exact SHA read。

生产 smoke 不重复大量调用上游。

---

# 15. Rollback 演练

至少 staging 演练一次：

```text
version N active
  ↓
rollback N-1
  ↓
health / get_server_info / tools/list
  ↓
确认 MCP SemVer / Worker Version metadata 回到稳定版本
```

Production 故障使用 `wrangler rollback` 或 Dashboard rollback。

Skill 内容错误通过 Git revert/fix，不使用 Worker rollback。

---

# 16. Release Failure Evidence

失败记录：

```text
MCP SemVer
Worker Version ID/tag
buildGitSha
endpoint type (harness/preview/prod)
MCP method/tool
sourceCommitSha (if established)
HTTP/MCP error
GitHub upstream status category
```

禁止记录 Secret。

---

# 17. 性能 Sanity

Preview/Staging 只做少量并发 sanity，观察 5xx、P50/P95、GitHub rate-limit behavior、Worker exceptions。

高频 Skill 维护 ≠ 高 QPS，不提前引入重型 load-test 平台。

---

# 18. CI/CD Gate

PR：

```text
typecheck
Node unit
Workers Vitest
MCP v2 client contract
production build
createTestHarness integration
registry/release checks
```

MCP Runtime deploy：

```text
MCP SemVer bump
  ↓
all gates
  ↓
versions upload
  ↓
Preview/Staging smoke
  ↓
100% promote exact version
  ↓
Production smoke
```

普通 PR 不需要 production Cloudflare credentials。

---

# 19. Definition of Done

- [ ] production build 有独立 gate。
- [ ] production-build harness 使用 MCP v2 modern client。
- [ ] 不再把 initialize 作为 2026-era smoke。
- [ ] Worker immutable version upload 后再做远端验证。
- [ ] Preview/Staging 验证真实 Cloudflare + GitHub read path。
- [ ] promote 的是同一个被 smoke 的 exact Worker version。
- [ ] Production smoke 精确验证 MCP/Worker/build 版本。
- [ ] `tools/list` / `get_server_info.tools` 同源。
- [ ] 高频 Skill source 更新不制造 flaky HEAD equality test。
- [ ] rollback 路径有明确证据。
