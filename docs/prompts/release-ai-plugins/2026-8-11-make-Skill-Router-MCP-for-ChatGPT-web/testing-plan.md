# Skill Router MCP Server 测试方案

## 1. 测试目标

验证：

```text
Cloudflare Worker
+
Nitro v3
+
MCP TypeScript SDK
+
Streamable HTTP
+
GitHub exact-commit Skill Source
```

能在“Skill 数量中等、更新频率高”的真实模式下保持 freshness、一致性、运行时兼容和轻量维护。

本测试方案不再把“Vitest”理解成单一 Node 测试进程，而按真实 runtime 分层。

---

# 2. 权威测试分层

```text
A. Pure Node Unit Tests (Vitest 4.x)
        ↓
B. Cloudflare workerd Runtime Tests
   (Vitest 4.x + @cloudflare/vitest-pool-workers)
        ↓
C. Production-build Integration
   (Vitest + Wrangler createTestHarness)
        ↓
D. Cloudflare Preview / Staging Smoke
        ↓
E. Production Read-only Smoke
        ↓
F. ChatGPT Web Developer Mode Acceptance
```

详细执行规格：

```text
vitest-development-testing-strategy.md
cloudflare-worker-production-testing-strategy.md
```

---

# 3. Vitest 版本隔离

仓库根当前 Vitest 是 3.x，而 Cloudflare Workers Vitest integration 当前要求 Vitest 4.1+。

因此：

```text
monorepo root
  -> 保持当前 Vitest 3.x

Skill Router MCP package
  -> package-local Vitest 4.1+
  -> @cloudflare/vitest-pool-workers
```

不要为了云 MCP 测试强制升级全仓 Vitest。

MCP tests 使用 package-local script + `pnpm --filter`，不依赖现有根 `vitest.workspace.ts` 收集。

---

# 4. A：Pure Node Unit Tests

负责最快反馈。

覆盖：

## Registry Validator

- schemaVersion。
- required fields。
- duplicate id。
- invalid/missing entry。
- unsupported schema。
- v1 不包含 deep-file index 依赖。

## Search

- id/name/description/plugin match。
- normalization。
- stable ranking。
- no match。
- 不读取所有 SKILL.md 正文。

## SourceSnapshot

- unpinned ref -> SHA。
- pinned SHA 不重新解析 mutable ref。
- downstream 只接收 exact SHA。

## Tool Input

- search query edge cases。
- invalid skill id。
- latest/pinned load。
- caller 无法覆盖任意 repository owner/name。

## Domain Errors

至少：

```text
REGISTRY_NOT_FOUND
REGISTRY_SCHEMA_UNSUPPORTED
SKILL_NOT_FOUND
REGISTRY_ENTRY_INVALID
GITHUB_AUTH_FAILED
GITHUB_RATE_LIMITED
GITHUB_UPSTREAM_FAILED
```

---

# 5. GitHub Repository Adapter Unit Tests

所有普通单元测试使用 fake/mock transport，不打真实 GitHub。

覆盖：

```text
resolveRef(dev) -> A
read registry @ A
read selected SKILL.md @ A
read related file @ A
pinned A
```

断言：

- snapshot 后不再使用 mutable `GITHUB_REF` 读取正文。
- pinned load 不调用 branch resolve。
- 401/403/404/rate-limit/malformed upstream 正确映射。
- Token 不进入领域对象、错误文本和日志。

---

# 6. B：Cloudflare Workers Vitest Runtime Tests

使用：

```text
@cloudflare/vitest-pool-workers
cloudflareTest()
workerd
```

目标是让测试代码和 Worker 被测逻辑运行在 Cloudflare Worker runtime 语义下，而不是只在 Node 中模拟。

覆盖：

- Worker vars/bindings 注入。
- Nitro runtime adapter。
- Web APIs。
- MCP endpoint 基础请求。
- initialize。
- tools/list。
- tool annotations。
- malformed request/error safety。
- 无 KV/R2 binding 仍可运行。

注意：Workers Vitest integration 不和自定义 Vitest environment/runner 混用，因此必须与 Node unit config 分离。

---

# 7. MCP SDK Client/Server Contract

至少一组测试必须真正从 MCP Client 视角访问 Streamable HTTP endpoint：

```text
MCP Client
  ↓
Streamable HTTP
  ↓
Nitro/Worker endpoint
  ↓
MCP SDK server
```

覆盖：

```text
initialize
list tools
list_skills
search_skills
load_skill latest
load_skill pinned
```

不要只调用 tool handler 函数并声称 MCP protocol 已验收。

---

# 8. Registry Determinism

相同 working tree 连续生成：

```text
bytes(output1) == bytes(output2)
```

验证：

- skills 排序稳定。
- property order 稳定。
- UTF-8 / LF / final newline。
- 无 timestamp/random/absolute path/current commit SHA。
- v1 不枚举 references/templates/examples。
- add/delete/rename/discovery metadata/version 变化正确。
- stale Check 非零。

Registry generator 本身是 PowerShell 工具，其跨 PowerShell 版本行为在 release 专项测试包中验证；云 MCP Vitest 只需要验证 consumer contract 和 fixture schema。

---

# 9. Registry Low-Churn Test

只增删/move reference/template/example 文件时，Registry 不应因为“深层文件列表镜像”发生结构变化。

正常 release 若 Skill 行为发生真实变化，通过 `metadata.version` 表达新版本。

---

# 10. Source Snapshot 单调用一致性

fixture：

```text
resolve dev -> A
调用过程中 fake branch -> B
继续读取 registry / SKILL.md
```

预期：本 call 全部 A；下一次新的 unpinned call 可以 B。

禁止：

```text
registry @ A
SKILL.md @ B
```

---

# 11. Search -> Load Snapshot Pin

```text
search_skills @ A
returns sourceCommitSha=A
branch -> B
load_skill(skillId, sourceCommitSha=A)
```

预期：加载 A。

同时：

```text
load_skill(skillId)
```

读取新的 B。

无需 server-side session/store。

---

# 12. 高频连续发布 Freshness Fixture

模拟：

```text
A: version 1.0.0
B: version 1.0.1
C: version 1.0.2
```

验证新 unpinned call 逐次读取当时 latest，旧 pinned SHA 仍可复现。

该测试必须使用 deterministic fake fixtures，不依赖测试运行时真的有人 push GitHub。

---

# 13. 深层文件按需读取

测试：

- load 先读取 SKILL.md。
- 不默认递归下载整个 Skill 目录。
- 只有业务明确请求/解析后才读 related file。
- related path 不能逃逸允许 Skill 目录。
- 所有读取同一 SHA。

---

# 14. C：Production-build Integration

使用 Nitro Cloudflare production build + Wrangler：

```text
createTestHarness()
```

从外部 HTTP/MCP client 访问生产构建产物。

GitHub upstream 在本地 integration 中通过 MSW 或等价 mock 完全控制。

必须覆盖：

```text
GET /health
initialize
tools/list
list_skills
search_skills
load pinned
load latest
negative/error paths
```

这一级验证的是最终 build/config/route/transport 的整体组合，不是单个 Service。

---

# 15. D：Cloudflare Preview / Staging

在 production-build integration 通过后，使用版本化 Preview URL 或独立 staging Worker 做真实 Cloudflare 网络 smoke。

覆盖少量只读高价值路径：

```text
health
initialize
tools/list
search known skill
load pinned known skill
load latest known skill
unknown skill
```

这里允许真实访问 GitHub，只用于验证 Cloudflare -> GitHub 网络、只读 Token、vars/Secret 和 exact-SHA read。

---

# 16. 高频 dev 分支下的线上断言

由于 `dev` 可能高频移动，preview/prod 测试不要断言：

```text
returned SHA == 几秒前在测试机查询到的 HEAD
```

正确断言：

```text
search returns A
load(pin=A) returns A
```

如果必须测试固定版本，staging 使用固定测试 ref/commit。

---

# 17. E：Production Post-deploy Smoke

正式 endpoint 部署后只做最小只读 smoke：

```text
GET /health
initialize
tools/list
search known Skill
load pinned using returned sourceCommitSha
```

禁止生产 smoke：

- GitHub write。
- 修改 Cloudflare 数据。
- 高并发压力。
- 长时间 soak。

失败应进入 rollback/diagnosis，而不是忽略。

---

# 18. Production Security Smoke

验证：

- response 无 GitHub Token。
- error 无 Authorization header。
- invalid input 无内部 stack。
- source 只暴露 repo/ref/commit 等预期诊断数据。
- tools annotations 正确。

---

# 19. F：ChatGPT Web 验收

顺序：

```text
MCP technical client/Inspector
  ↓
ChatGPT Web Developer Mode
```

真实场景：

```text
search skill
  ↓
得到 sourceCommitSha
  ↓
load pinned
```

再验证一次 unpinned latest load。

ChatGPT Web 验收不替代 Vitest/workerd/harness；它是最后一层产品验收。

---

# 20. Performance Sanity

第一版测量：

- Skill count。
- registry bytes。
- GitHub requests/tool call。
- ref resolve latency。
- registry fetch latency。
- selected Skill fetch latency。
- MCP P50/P95。
- GitHub rate-limit/failure behavior。

只在 staging 做小规模并发 sanity，不提前引入重型 load-test 平台。

高频 Skill **维护**不等于高 QPS。

---

# 21. Coverage

不设拍脑袋的全局 90% 门槛。

关键行为必须逐分支测试：

- snapshot consistency。
- latest/pinned semantics。
- registry validation。
- GitHub errors/security。
- MCP lifecycle。

Workers Vitest integration 如启用 coverage，要使用当前官方支持的 instrumented/Istanbul 路径，不依赖 native V8 coverage。

---

# 22. PR CI Gate

推荐：

```text
typecheck
Vitest Node unit
Workers Vitest runtime
Nitro Cloudflare build
createTestHarness integration
registry stale check
release-side relevant checks
```

普通 PR CI 不需要 Cloudflare production Secret。

---

# 23. Deploy Gate

```text
PR/build tests pass
  ↓
version upload / staging
  ↓
preview smoke
  ↓
production deploy
  ↓
production smoke
```

是否每个 PR 都创建 preview 可由后续 CI 成本决定，不作为第一版强制项。

---

# 24. 轻量增长回归

必须定期防止测试和架构一起膨胀：

- [ ] 单元测试仍快速。
- [ ] Worker runtime test 与 Node unit 分离。
- [ ] production integration 本地可跑。
- [ ] preview/prod smoke 保持少量只读。
- [ ] 不要求 KV/R2/D1/DO 测试夹具。
- [ ] 不引入向量数据库测试环境。
- [ ] 不因为高频 Skill 更新引入持续远程环境测试。

---

# 25. Definition of Done

- [ ] package-local Vitest 4.1+ 与根 Vitest 3.x 隔离。
- [ ] Node unit 完整。
- [ ] Cloudflare workerd Vitest runtime tests 完整。
- [ ] MCP SDK client/server contract tests 完整。
- [ ] production build + `createTestHarness()` integration 完整。
- [ ] Preview/Staging smoke 设计完整。
- [ ] Production read-only smoke 设计完整。
- [ ] exact-commit / pinned snapshot 测试完整。
- [ ] 高频更新不制造 flaky HEAD assertions。
- [ ] Secret/error/security paths 有明确测试。
- [ ] ChatGPT Web 最终验收存在且不替代自动化测试。
