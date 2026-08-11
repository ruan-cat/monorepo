# Skill Router MCP：Cloudflare Worker 生产构建与线上测试策略

## 1. 文档目的

本文定义 `Skill-Router-MCP` 从本地生产构建到 Cloudflare 真实网络的测试层次。

目标不是把“生产测试”理解成直接拿正式域名做大量测试，而是分成：

```text
Production Build Test
        ↓
Local workerd Integration Harness
        ↓
Cloudflare Preview / Staging
        ↓
Production Read-only Smoke
```

每一级解决不同风险。

---

# 2. Cloudflare 当前推荐测试分工

Cloudflare 当前建议：

- Workers Vitest integration：快速 Worker runtime 单元/组件测试。
- `createTestHarness()`：针对 Worker **production build** 做整体集成测试。

因此本项目不应继续把旧的 `unstable_dev()` 当成主要集成测试 API。

也不应把 `wrangler dev --remote` 作为日常自动化测试主路径；远程开发更适合少数 Cloudflare 网络特性无法本地模拟时使用。

---

# 3. 层级 1：Production Build Gate

任何进入 production-build integration 的代码必须先完成 Nitro Cloudflare 构建。

概念流程：

```text
source
  ↓
Nitro build (Cloudflare preset)
  ↓
production Worker artifact
  ↓
Wrangler-compatible config/entry
```

测试必须针对**实际生产构建结果**，而不是只针对 TypeScript 源文件。

验收：

- build 成功。
- production entry 存在。
- Wrangler 能解析最终配置。
- 无 Node HTTP server 启动假设。
- 无本地持久文件依赖。
- source map / logs 可用于失败诊断（如项目启用）。

具体 Nitro 输出路径由实际实现和当前 Nitro v3 preset 决定，规格中不要猜死 `.output/...` 文件名。

---

# 4. 层级 2：`createTestHarness()` Production-build Integration

推荐：

```text
vitest.integration.config.ts
```

测试 runner 运行于 Node，但被测 Worker 通过 Wrangler `createTestHarness()` 以本地 Worker server 运行。

这一级的价值：

> 用生产 Wrangler/Nitro 构建配置整体启动 Worker，再从外部 HTTP 客户端访问它。

而不是直接调用内部 Service。

## 4.1 Lifecycle

概念：

```text
beforeAll
  -> createTestHarness({ workers: [{ configPath }] })
  -> start

afterAll
  -> stop/dispose
```

实际 API 签名以实施时当前 Wrangler 官方类型为准。

---

# 5. Mock GitHub Upstream

Production-build integration 不应该每次 CI 都打真实 GitHub API。

Cloudflare test harness 可以与 Node 侧请求 mocking 工具配合，因此推荐使用 MSW 或等价可控 mock，为 GitHub 提供：

```text
resolve ref endpoint
registry content endpoint
SKILL.md content endpoint
error responses
rate-limit responses
```

fixture：

```text
commit A
commit B
```

从 HTTP 层验证：

```text
search -> A
load pin A -> A
load latest -> B
```

MSW/网络 mock 必须对未声明的 outbound request 默认报错，防止测试意外访问真实网络。

---

# 6. Production-build MCP E2E 用例

必须使用真实 HTTP endpoint + MCP SDK client 或协议兼容客户端验证。

至少：

## 6.1 Health

```text
GET /health
```

断言：

- 2xx。
- 不返回 Secret。
- 可返回 build/runtime version 的非敏感诊断字段（如实现有）。

## 6.2 MCP initialize

验证：

- endpoint 是 Streamable HTTP MCP。
- initialize 成功。
- server metadata/capabilities 正确。

## 6.3 tools/list

必须存在：

```text
list_skills
search_skills
load_skill
```

并验证 annotations：

```text
readOnlyHint=true
destructiveHint=false
```

## 6.4 list_skills

验证：

- 只需要一份 registry。
- 返回 `sourceCommitSha=A`。
- 不展开读取全部 SKILL.md。

## 6.5 search_skills

验证：

- 返回已知 fixture skill。
- 返回 A。
- mock 请求日志证明没有逐 Skill 获取正文。

## 6.6 load_skill pinned

```text
load_skill(skillId, sourceCommitSha=A)
```

验证读取 A。

## 6.7 load_skill latest

mock branch HEAD 切换为 B：

```text
load_skill(skillId)
```

验证读取 B。

## 6.8 Negative cases

- unknown skill。
- registry missing。
- unsupported schema。
- entry path invalid/missing。
- upstream 401/403。
- rate limit。
- malformed MCP body。

Worker 不应崩溃或输出 stack/secret 给客户端。

---

# 7. Cloudflare Preview / Staging 测试

本地 workerd 通过后，仍需要少量真实 Cloudflare 网络测试。

推荐使用：

```text
Worker version preview URL
或
独立 staging Worker/environment
```

而不是在每个 PR 上直接覆盖 production route。

Cloudflare 支持 versioned Preview URLs，可用于在正式发布前验证 Worker 新版本。

## 7.1 Staging 配置

建议单独使用：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
GITHUB_TOKEN
```

其中 Token：

- 使用专门 staging secret。
- 权限仍为 contents read/minimum read-only。
- 不复用高权限个人 Token。

不需要 staging KV/R2，因为生产 MVP 本身也没有这些依赖。

---

# 8. Preview / Staging Smoke Matrix

只做高价值、只读、有限次数测试：

```text
GET /health
MCP initialize
tools/list
search known Skill
load pinned known Skill
load latest known Skill
unknown Skill negative case
```

这一级使用真实：

```text
Cloudflare network
workerd production runtime
HTTPS/TLS
real outbound GitHub connectivity
real Worker vars/secrets
```

不要在 preview/staging 进行大规模压力测试。

---

# 9. 高频更新场景下避免 flaky 线上测试

生产 `GITHUB_REF=dev` 可能在测试运行期间被持续 push。

因此线上测试禁止采用脆弱断言：

```text
search returned SHA == 我几秒前查询到的 dev HEAD
```

因为 HEAD 可能已经移动。

正确断言：

```text
search returns SHA=A
load_skill(pin=A) returns sourceCommitSha=A
```

验证的是 snapshot consistency。

对于 latest 模式只验证：

- 返回合法 source commit。
- registry/skill 同一 snapshot。
- 请求完成。

如果需要严格验证“当前 HEAD”，应在专门 staging 测试中把 `GITHUB_REF` 固定到测试 ref/known commit，而不是依赖高频变化的 production `dev`。

---

# 10. Production Post-deploy Smoke

正式部署完成后执行最小只读 smoke：

```text
GET /health
initialize
tools/list
search_skills(known query)
load_skill(known skill, returned sourceCommitSha)
```

原则：

- 不写 GitHub。
- 不改变 Cloudflare 状态。
- 不执行高并发。
- 不依赖测试专用数据写入。
- 失败时立即把 deployment 标记为不可接受并进入 rollback/diagnosis。

Production smoke 可以作为部署流水线的 post-deploy gate，但不要让它变成复杂 E2E 套件。

---

# 11. Production Security Smoke

至少确认：

- MCP response 不含 `GITHUB_TOKEN`。
- error response 不含 Authorization header。
- unknown tool / invalid input 不返回内部 stack。
- source 信息只包含 repository/ref/commit 等非敏感诊断信息。
- tools 为只读 annotations。

日志也应抽查不存在 Secret。

---

# 12. 线上 GitHub 集成测试

与 mock integration 不同，preview/staging 至少要有一条真实 GitHub read path：

```text
resolve ref
read registry
read known Skill
```

目的不是测试 GitHub，而是验证：

```text
Cloudflare outbound fetch
+
GitHub authentication
+
repository permissions
+
exact SHA reads
```

生产 smoke 不重复大量调用 GitHub，避免人为消耗 rate limit。

---

# 13. 性能 Sanity，不做过度 Load Test

MVP 在 preview/staging 可运行一个很小的并发 sanity：

```text
例如少量并行 list/search/load 请求
```

观察：

- 5xx。
- P50/P95 粗略值。
- GitHub rate-limit behavior。
- Worker exceptions。

不要在 CI 固定加入大规模 k6/长时间 soak test，除非真实流量需要。

高强度 Skill **更新频率**不等于高 QPS，因此不能因为维护频繁就误上重型性能测试平台。

---

# 14. Wrangler Remote Development 的定位

`wrangler dev --remote` 属于辅助诊断工具，不是主要测试层。

仅当：

- 某 Cloudflare 网络行为本地 workerd 无法复现；或
- 特定 remote binding/平台特性必须真实网络验证

时人工使用。

本项目 MVP 没有 KV/R2/D1/DO 等远程 binding，因此日常测试没有理由依赖 remote dev。

---

# 15. Preview URL 与 Production Route 的职责

推荐顺序：

```text
production build
  ↓
local harness
  ↓
versioned preview / staging
  ↓
production deploy
  ↓
production smoke
```

不要省略 local harness，把所有发现问题都推迟到真实 Cloudflare 网络。

也不要省略 preview/staging，把所有 runtime/network 风险留给 production。

---

# 16. CI/CD Gate 建议

## PR / 普通开发 CI

```text
typecheck
unit tests
Worker Vitest tests
production build
createTestHarness integration
registry stale check
```

不需要 Cloudflare production credentials。

## Deploy pipeline

```text
build/test gates
  ↓
version upload / staging
  ↓
preview smoke
  ↓
production deploy
  ↓
production smoke
```

具体是否每个 PR 自动创建 preview，应根据后续 CI 成本决定，不作为 MVP 强制项。

---

# 17. 失败诊断证据

Integration / preview / production smoke 失败时至少记录：

```text
Worker deployment/version identifier
endpoint type (local harness/preview/prod)
MCP method/tool
sourceCommitSha（如果已建立 snapshot）
HTTP status
MCP error code
GitHub upstream status category
```

禁止记录：

```text
GitHub Token
Authorization header
完整敏感请求内容
```

---

# 18. Definition of Done

- [ ] production Worker build 有独立 gate。
- [ ] `createTestHarness()` 对生产构建做 HTTP/MCP 集成测试。
- [ ] outbound GitHub 在本地 integration 可控 mock。
- [ ] preview/staging 验证真实 Cloudflare network/runtime。
- [ ] production deploy 后执行最小只读 smoke。
- [ ] 高频 dev 更新不会使测试错误依赖瞬时 HEAD。
- [ ] pinned snapshot 是线上一致性主要断言。
- [ ] 不使用 `unstable_dev()` 作为新方案主路径。
- [ ] `wrangler dev --remote` 只用于特殊诊断。
- [ ] 不为了高频 Skill 更新引入重型 load-test 基础设施。
