# Skill Router MCP Server 测试方案

## 1. 测试目标

验证：

```text
Cloudflare Workers
+
Nitro v3
+
MCP TypeScript SDK v2
+
MCP 2026-07-28
+
Streamable HTTP
+
GitHub exact-commit Skill Source
+
Cloudflare versioned deployment
```

能够在 Skill 高频更新和 MCP Runtime 长期发版中保持：freshness、snapshot consistency、版本可查询、部署可验证、回滚可诊断。

---

# 2. 权威测试分层

```text
A. Pure Node Unit (Vitest 4.x)
        ↓
B. Workers Vitest / workerd Runtime
        ↓
C. MCP v2 Client/Server Contract
        ↓
D. Nitro Production Build + createTestHarness
        ↓
E. Cloudflare Preview / Staging Smoke
        ↓
F. Production Read-only Smoke
        ↓
G. ChatGPT Web Acceptance
```

根 Vitest 3.x 不因 MCP 被强制升级。

---

# 3. A：Pure Node Unit

覆盖：

## Registry

- schemaVersion。
- required fields。
- duplicate id。
- low-churn v1 schema。
- unsupported schema。

## Search

- id/name/description/plugin matching。
- deterministic ranking。
- no match。
- 不读取所有 Skill 正文。

## SourceSnapshot

- latest ref -> exact SHA。
- pin SHA 不重新 resolve branch。
- downstream 只使用 exact SHA。

## Tool Definitions

统一：

```text
get_server_info
list_skills
search_skills
load_skill
```

测试 `toolDefinitions` 是标准 tool registration、`tools/list` expected catalog 和 `get_server_info.tools` 的共同来源。

## Server Version

- package.json version 是 MCP app SemVer 唯一来源。
- server identity version = package version。
- `get_server_info.server.version` = package version。
- protocol revision = `2026-07-28`。

---

# 4. GitHub Repository Adapter Unit

普通单元测试不打真实 GitHub。

覆盖：

```text
resolve dev -> A
registry @ A
Skill @ A
related file @ A
pinned A
```

断言：

- snapshot 后不再使用 mutable ref 读正文。
- pinned load 不 resolve branch。
- 401/403/404/rate-limit/upstream error 正确映射。
- Token 不进 error/log/result。

---

# 5. B：Workers Vitest / workerd

使用 package-local Vitest 4.1+ + `@cloudflare/vitest-pool-workers`。

覆盖：

- Nitro Worker runtime adapter。
- Web Request/Response。
- public vars / Secret boundary。
- `CF_VERSION_METADATA` binding contract。
- MCP 2026-era request behavior。
- 无 `Mcp-Session-Id` 前置依赖。
- malformed protocol request safety。
- 无 KV/R2 binding 仍可运行。

不要再把 legacy `initialize` 作为 modern runtime 测试步骤。

---

# 6. C：MCP v2 Client/Server Contract

至少一组测试必须使用 v2 MCP Client 从协议外部访问 Streamable HTTP endpoint，而不是直接调 handler 函数。

覆盖：

```text
modern protocol negotiation/serving
server identity
可选 server/discover
tools/list
get_server_info
list_skills
search_skills
load_skill latest
load_skill pinned
```

关键断言：

- modern serverInfo 可读。
- server version 与 package version 一致。
- `tools/list` 返回完整 tool catalog。
- `get_server_info.tools` 与标准 catalog 同源。

---

# 7. Registry Determinism / Low Churn

相同 working tree：

```text
bytes(output1) == bytes(output2)
```

验证：

- stable sort/property order。
- UTF-8/LF/final newline。
- 无 timestamp/random/absolute path/current commit SHA。
- v1 不枚举 references/templates/examples。
- add/delete/rename/discovery metadata/version 变化正确。

PowerShell generator 跨 PS5.1/pwsh7 的 byte-identical 测试在 release 专项包中执行。

---

# 8. Snapshot Consistency

```text
resolve dev -> A
fake branch moves -> B
继续当前 tool call
```

必须：

```text
registry @ A
Skill @ A
```

下一次新的 unpinned call 可以 B。

---

# 9. Search -> Load Pin

```text
search @ A
returns sourceCommitSha=A
branch -> B
load(pin=A) -> A
load(no pin) -> B
```

无需 server-side MCP session/state store。

---

# 10. 高频连续更新 Fixture

用 deterministic fake commits：

```text
A: 1.0.0
B: 1.0.1
C: 1.0.2
```

测试 latest/pinned semantics。

自动化不依赖真实 `dev` 在测试期间被人 push。

---

# 11. 深层文件按需读取

- load 先读取 SKILL.md。
- 不默认递归整个 Skill 目录。
- related path 不逃逸允许范围。
- 所有读取同 SHA。

---

# 12. D：Production-build Integration

使用：

```text
Nitro Cloudflare production build
+
Wrangler createTestHarness()
+
MCP v2 client
```

GitHub upstream 通过 MSW/等价 mock 控制。

覆盖：

```text
GET /health
modern MCP identity
tools/list
get_server_info
list/search/load latest+pin
negative/error paths
```

额外检查：

- build Git SHA 存在。
- `CF_VERSION_METADATA` fixture/real harness binding 映射正确。
- `/health` 与 `get_server_info` 的 deployment metadata 一致。

---

# 13. MCP Application Release Version Tests

任何 MCP Runtime release 必须增加自动 contract：

```text
serverInfo.version
== package.json.version
== get_server_info.server.version
```

Tool catalog：

```text
tools/list
== toolDefinitions
== get_server_info.tools
```

允许表达结构不同，但 tool name/schema/description 的权威来源必须一致。

---

# 14. E：Cloudflare Preview / Staging

上传 immutable Worker version 后，使用 version preview/staging 测试真实 Cloudflare runtime/network。

最小 smoke：

```text
health
modern server identity
tools/list
get_server_info
search known Skill
load pinned
load latest
unknown Skill
```

同时验证：

- Worker Version ID/tag/timestamp 是本次 upload 的版本。
- MCP app SemVer 是待发布版本。
- buildGitSha 是待发布 commit。

---

# 15. 高频 `dev` 下的线上断言

禁止 flaky 断言：

```text
returned Skill SHA == 几秒前测试机查询到的 branch HEAD
```

正确：

```text
search returns A
load(pin=A) returns A
```

MCP Server production version 则应与本次待 promote Worker version 精确匹配，因为 Worker version 是不可变部署单元。

---

# 16. F：Production Post-deploy Smoke

正式 promote 后只做少量只读 smoke：

```text
GET /health
read server identity
tools/list
get_server_info
search known Skill
load pinned
```

必须确认：

```text
expected MCP SemVer
expected Worker Version ID/tag
expected buildGitSha
```

已经在线。

失败进入 rollback/diagnosis。

---

# 17. Rollback Test / Runbook Check

至少在 staging 或演练环境验证：

```text
bad version N
  ↓
wrangler rollback stable N-1
  ↓
get_server_info / health
  ↓
恢复 N-1 deployment metadata
```

Skill 内容问题不使用 Worker rollback；通过 Git revert/fix 产生新 Skill source commit。

---

# 18. Production Security Smoke

- no Token/auth header。
- invalid input 不暴露 stack。
- source metadata 只包含安全 repo/ref/commit 信息。
- `get_server_info` 不输出 Secret。
- tool annotations 只读/非破坏性。

---

# 19. G：ChatGPT Web Acceptance

顺序：

```text
modern MCP technical client/Inspector
  ↓
ChatGPT Web Developer Mode
```

真实请求至少覆盖：

```text
“告诉我你的 MCP 服务版本、Cloudflare 部署版本和全部工具”
```

以及：

```text
search Skill -> sourceCommitSha -> pinned load
```

---

# 20. PR CI Gate

推荐：

```text
typecheck
Node unit
Workers Vitest/workerd
MCP v2 client contract
Nitro Cloudflare build
createTestHarness integration
registry stale check
release-side relevant checks
```

普通 PR CI 不需要 production Cloudflare Secret。

---

# 21. MCP Runtime Deploy Gate

```text
all local gates
  ↓
Worker version upload
  ↓
Preview/Staging smoke
  ↓
exact version 100% promote
  ↓
Production smoke
```

Tool schema/protocol-visible 变化默认不做双版本 gradual split。

---

# 22. Performance Sanity

测量：

- registry bytes/Skill count。
- GitHub requests/tool call。
- ref resolve/fetch latency。
- MCP P50/P95。
- rate-limit/failure。

不要把“高频维护”误当“高 QPS”而提前建设重型负载平台。

---

# 23. Definition of Done

- [ ] Node/workerd/MCP-client/production-build 分层完整。
- [ ] modern MCP `2026-07-28` contract 有自动测试。
- [ ] legacy initialize/session 不再作为新协议成功条件。
- [ ] Server application SemVer contract 有测试。
- [ ] Worker Version metadata / build SHA 有测试。
- [ ] 标准 `tools/list` 与 `get_server_info.tools` 同源。
- [ ] exact-commit latest/pin 测试完整。
- [ ] Preview/Staging/Production smoke 有版本断言。
- [ ] rollback 路径可验证。
- [ ] ChatGPT Web 最终验收存在且不替代自动化测试。
