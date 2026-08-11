# Skill Router MCP Server 测试方案

## 1. 测试目标

验证：

```text
Cloudflare Workers
+
Nitro v3
+
OpenAI-current @modelcontextprotocol/sdk
+
McpServer / Streamable HTTP
+
GitHub exact-commit Skill Source
+
Cloudflare versioned production deployment
```

同时证明高频 Skill 更新、MCP Runtime 发版和 ChatGPT Tool Metadata 更新三个 freshness domain 都正确。

---

# 2. 测试分层

```text
A. Pure Node Unit
B. GitHub Adapter Fake/Mock
C. Workers Vitest / workerd
D. MCP SDK Client / Inspector-compatible Contract
E. Nitro Production Build + createTestHarness
F. Cloudflare Preview / Staging
G. Production Read-only Smoke
H. ChatGPT Web Developer Mode Acceptance
```

---

# 3. A：Pure Node Unit

使用 MCP package-local Vitest 4.x。

覆盖：

- Registry v1 validator。
- in-memory search。
- SourceSnapshot latest/pin。
- toolDefinitions。
- `get_server_info` pure assembly。
- SemVer/version metadata mapping。
- domain errors。

---

# 4. Tool Definitions Contract

当前：

```text
get_server_info
list_skills
search_skills
load_skill
```

统一 `toolDefinitions` 是：

- SDK tool registration。
- expected tools/list catalog。
- `get_server_info.tools`。
- docs/acceptance expectation。

的单一 source。

自动测试防止 tool catalog 漂移。

---

# 5. Server Version Contract

必须：

```text
McpServer server version
== package.json.version
== get_server_info.server.version
```

Worker Version ID、build Git SHA、Skill sourceCommitSha 不参与该等式。

---

# 6. B：GitHub Repository Adapter

不打真实 GitHub：

```text
resolve dev -> A
registry @ A
Skill @ A
related file @ A
pinned A
```

覆盖：

- pinned 不 resolve branch。
- snapshot 后 downstream 不使用 mutable ref。
- 401/403/404/rate-limit/upstream errors。
- Token 不进 result/log/error。

---

# 7. Registry Determinism / Low Churn

release-side PowerShell 负责跨 PS5.1/pwsh7 bytes determinism。

consumer-side Vitest 验证：

- schemaVersion。
- required fields。
- stable entry semantics。
- deep files 不出现在 Registry v1。
- unsupported schema 拒绝。

---

# 8. C：Workers Vitest / workerd

使用 package-local：

```text
Vitest 4.1+ compatible
@cloudflare/vitest-pool-workers
```

覆盖：

- Nitro Worker adapter。
- Web Request/Response。
- vars/Secret boundary。
- `CF_VERSION_METADATA` binding。
- Streamable HTTP。
- initialization/protocol handling 能在 Worker runtime 工作。
- malformed MCP request safety。
- 无 KV/R2/D1/DO 也可运行。

不要用 Node tests 代替 workerd compatibility。

---

# 9. D：MCP SDK Client Contract

至少一组测试从 MCP client/transport 外部访问 `/mcp`：

```text
initialization
server info/instructions
tools/list
get_server_info
list_skills
search_skills
load_skill latest
load_skill pinned
invalid inputs/errors
```

SDK/client版本必须与 production compatibility profile 对齐。

---

# 10. Snapshot Consistency

```text
resolve dev -> A
branch fake moves -> B
continue current call
```

预期：

```text
registry @ A
SKILL.md @ A
```

下一次 unpinned call 可以 B。

---

# 11. Search -> Load Pin

```text
search -> A
load(pin=A) -> A
load(no pin) -> latest B
```

无需 server-side snapshot store。

---

# 12. 高频连续更新 Fixture

使用 deterministic A/B/C fixtures，不依赖真实 `dev` 在自动测试期间发生 push。

真实线上测试只断言 snapshot consistency，不断言“返回 SHA 等于几秒前单独读到的 HEAD”。

---

# 13. 深层文件

- load 先读 SKILL.md。
- related file 按需。
- 同 SHA。
- path 不逃逸 Skill 根。
- 不默认递归整个 Skill tree。

---

# 14. E：Production-build Integration

```text
Nitro Cloudflare production build
+
Wrangler createTestHarness()
+
MCP client
```

GitHub upstream 通过 MSW/等价 mock。

覆盖：

```text
GET /health
initialization/server version
tools/list
get_server_info
list/search/load latest+pin
negative/error paths
```

额外断言：

- buildGitSha。
- Worker version metadata fixture/binding。
- server version/tool catalog consistency。

---

# 15. Cloudflare Worker Version Tests

`get_server_info` / health 必须能安全表达：

```text
workerVersionId
workerVersionTag
workerVersionTimestamp
buildGitSha
mcpServerVersion
```

测试不得把 Worker version ID 当 MCP app version。

---

# 16. F：Preview / Staging

版本上传后，使用 immutable Worker Preview URL 测：

```text
health
initialization/serverInfo
tools/list
get_server_info
search known Skill
load pinned
load latest
unknown Skill
```

精确确认：

```text
candidate MCP SemVer
candidate Worker Version ID/tag
candidate buildGitSha
```

---

# 17. G：Production Smoke

exact Worker version promote 后立即只读验证：

```text
GET /health
initialization/server info
tools/list
get_server_info
search known Skill
load pinned
```

生产 smoke 不做高并发/写入/长 soak。

---

# 18. ChatGPT Tool Metadata Release Test

Runtime-only internal patch：

```text
Worker deploy + production smoke
```

Tool contract change：

```text
Worker candidate
  ↓
Inspector
  ↓
Developer Mode refresh/rescan
  ↓
rerun evaluation/use cases
  ↓
Workspace review/publish when applicable
```

这是必须存在的人工/产品 gate，不能被 Cloudflare CI 伪装为已经完成。

---

# 19. H：ChatGPT Web Acceptance

至少测试：

```text
“告诉我当前 MCP 服务版本、Worker 部署版本、build commit 和全部工具。”
```

预期调用 `get_server_info`。

以及：

```text
search Skill -> sourceCommitSha -> pinned load
```

如果 tool metadata/schema 刚变化，要先刷新 Developer Mode connection 后再验收。

---

# 20. OpenAI Compatibility Regression

每次 MCP SDK major/minor 重要升级都必须重新核对 OpenAI 当前 `Build an MCP server` 文档。

禁止测试套件“自己升级到上游新协议”而 ChatGPT production client 仍未确认支持。

MCP upstream major 迁移需要：

```text
OpenAI docs support
Inspector pass
ChatGPT Developer Mode pass
```

---

# 21. OpenAI Skills Import Extension Non-goal

live Skill Router 测试不使用 submission-time Skills import 作为主路径。

该扩展属于静态扫描/导入 snapshot，Skill 修改后需要重新 Scan Tools/submit，不符合高频 live Git source。

---

# 22. Rollback Test

staging/演练至少验证一次 Worker rollback，然后：

```text
health
initialization
tools/list
get_server_info
```

恢复稳定版本 metadata。

Skill content bug 单独通过 Git revert/fix 验证，不使用 Worker rollback。

---

# 23. CI Gate

PR/development：

```text
typecheck
Node unit
Workers Vitest/workerd
MCP SDK contract
Nitro production build
createTestHarness integration
registry stale check
release-side checks
```

普通 PR 不使用 production Cloudflare credentials。

---

# 24. Runtime Deploy Gate

```text
MCP SemVer bump
  ↓
all automated gates
  ↓
versions upload
  ↓
Preview/Staging smoke
  ↓
exact version production promote
  ↓
Production smoke
```

Tool contract change 再增加 ChatGPT refresh/review gate。

---

# 25. Definition of Done

- [ ] Node/workerd/MCP client/production harness 分层。
- [ ] SDK 与 OpenAI current compatibility profile 一致。
- [ ] initialization/server identity 有测试。
- [ ] MCP app SemVer consistency 有测试。
- [ ] Worker version metadata/build SHA 有测试。
- [ ] tools/list / get_server_info.tools 同源。
- [ ] exact-commit latest/pin 有测试。
- [ ] Preview/Production smoke 精确验证 candidate/active version。
- [ ] Tool contract 更新有 ChatGPT refresh/rescan/evaluation gate。
- [ ] Skill-only 更新不触发 Worker/tool metadata 发布。
- [ ] rollback path 有验证。
