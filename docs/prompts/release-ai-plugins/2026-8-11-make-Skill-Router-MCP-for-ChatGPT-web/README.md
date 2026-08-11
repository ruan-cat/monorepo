# ChatGPT Web Skill Router MCP Server 实施文档

## 文档定位

本目录是一套生产级 Remote MCP Server 实施规格，用于指导独立 AI Agent 完成 Cloudflare Worker + Nitro v3 + MCP TypeScript SDK + GitHub exact-commit Skill Router MCP Server。

真实工作负载：**Skill 数量中等，但会高频修改、维护和新增。**因此设计重点是 freshness、可复现性、低维护成本、可测试性和轻量增长，而不是提前堆叠存储/索引系统。

---

# 1. 项目目标

- 将 `ruan-cat/monorepo` 的 `ai-plugins` skills 暴露为 MCP Skill Provider。
- Cloudflare Worker 提供公网 HTTPS Remote MCP。
- Nitro v3 作为应用 Runtime；H3 由 Nitro 依赖树管理。
- MCP TypeScript SDK 实现协议层。
- Streamable HTTP 作为 transport。
- GitHub 是唯一 Skill Source of Truth。
- `GITHUB_REF` 默认解析为 exact commit SHA，再从同一 SHA 读取 registry/skill。
- discovery result 返回 `sourceCommitSha`，允许 `load_skill` 可选 pin 同一 snapshot。
- 第一版不要求 KV、R2、D1、Durable Objects、vector database。
- `ai-plugins/skill-registry.json` 是低 churn discovery index。
- 开发期使用分层 Vitest；生产构建使用 Cloudflare Worker production-build harness 与 preview/prod smoke 验证。

---

# 2. AI Agent 强制阅读顺序

```text
ai-agent-implementation-plan.md
        ↓
README.md
        ↓
architecture.md
        ↓
implementation-spec.md
        ↓
high-frequency-skill-churn-strategy.md
        ↓
skill-registry-schema.md
        ↓
release-ai-plugins-registry-integration.md
        ↓
runtime-dependency-version-policy.md
        ↓
nitro-v3-cloudflare-integration.md
        ↓
runtime-binding-contract.md
        ↓
mcp-server-framework-selection.md
        ↓
mcp-protocol-design.md
        ↓
vitest-development-testing-strategy.md
        ↓
cloudflare-worker-production-testing-strategy.md
        ↓
testing-plan.md
```

如果任务包含真正修改 `release-ai-plugins` / generator / `skill-registry.json` / CI stale gate，必须继续阅读：

```text
docs/prompts/release-ai-plugins/
└── 2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/
```

---

# 3. 核心技术决策

## MCP

```text
@modelcontextprotocol/sdk
+
Streamable HTTP
```

禁止手写 JSON-RPC lifecycle。

## Runtime

```text
Cloudflare Worker
+
Nitro v3 Runtime
+
Nitro-managed H3 layer
```

## Skill Source

```text
GitHub ai-plugins
+
exact commit SourceSnapshot
```

## Registry

v1 只保存：

```text
id
plugin
name
description
version
entry
```

不枚举 references/templates/examples，避免高频深层文件变化制造 registry churn。

## Freshness + Reproducibility

默认最新：

```text
GITHUB_REF=dev
  ↓
resolve current HEAD -> SHA
```

跨 tool call 可复现：

```text
search_skills @ A
  -> sourceCommitSha=A
load_skill(skillId, sourceCommitSha=A)
```

不需要 server session。

---

# 4. 测试技术决策

仓库根当前仍使用 Vitest 3.x；Cloudflare 当前 Workers Vitest integration 要求 Vitest 4.1+。

因此：

```text
monorepo root
  -> 保持现有 Vitest 3.x

Skill Router MCP package
  -> package-local Vitest 4.1+
```

测试分层：

```text
Node Unit Vitest
  ↓
Workers Vitest / workerd
  ↓
Nitro production build
  ↓
Wrangler createTestHarness integration
  ↓
Cloudflare Preview/Staging smoke
  ↓
Production read-only smoke
  ↓
ChatGPT Web acceptance
```

不要为了一个 MCP package 强制迁移全仓 Vitest。

---

# 5. 文档索引

## 架构 / 实施

- `architecture.md`
- `implementation-spec.md`
- `high-frequency-skill-churn-strategy.md`
- `runtime-dependency-version-policy.md`

## Skill Registry / Release Bridge

- `skill-registry-schema.md`
- `release-ai-plugins-registry-integration.md`
- `../2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/`

## MCP

- `mcp-server-framework-selection.md`
- `mcp-protocol-design.md`
- `mcp-client-validation-guide.md`

## Nitro / Cloudflare

- `nitro-v3-development-guide.md`
- `nitro-v3-cloudflare-integration.md`
- `runtime-binding-contract.md`
- `cloudflare-worker-deployment.md`
- `cloudflare-ai-gateway-strategy.md`

## 测试 / 质量

- `vitest-development-testing-strategy.md`：package-local Vitest 4.x、Node unit、workerd runtime、MCP SDK contract。
- `cloudflare-worker-production-testing-strategy.md`：production build、`createTestHarness()`、preview/staging、production smoke。
- `testing-plan.md`：统一测试矩阵和 CI/deploy gates。
- `security-model.md`

## 部署 / 交接

- `deployment-runbook.md`
- `agent-execution-guide.md`
- `agent-handoff-checklist.md`

---

# 6. 最终架构

```text
ChatGPT Web
  ↓
Remote MCP / Streamable HTTP
  ↓
Cloudflare Worker
  ↓
Nitro v3 Runtime
  ↓
MCP SDK / McpServer
  ↓
Skill Router
  ↓
GitHub Repository Adapter
  ↓
SourceSnapshot(commit SHA)
  ├─ skill-registry.json @ SHA
  ├─ selected SKILL.md @ SHA
  └─ related files on demand @ SHA
```

---

# 7. 高频更新下的轻量维护模型

发布侧：

```text
many Skill changes
 -> one release orchestration
 -> one registry generation
 -> one Git commit
```

运行时：

```text
one tool call
 -> one snapshot
 -> one registry read
 -> selected Skill only
```

测试侧：

```text
fast unit locally
 -> Worker runtime locally
 -> production build locally
 -> only small remote smoke
```

这意味着：

- 高频 Skill 更新不要求 Worker redeploy。
- 不需要 Cloudflare storage sync。
- 不需要 per-Skill cache purge。
- 不需要增量 registry DB。
- 不需要 vector search。
- 不需要每次开发修改都触发远程 Cloudflare 测试。

只有真实性能/可靠性数据证明简单方案成为瓶颈时才升级。

---

# 8. 为什么第一版不使用 KV / R2

对高频更新，第二套存储会增加同步/调试/失效管理成本。

MVP 直接利用 Git 的不可变 commit snapshot：

```text
new push -> new HEAD -> new unpinned call sees new commit
```

未来如果确实需要 cache，只允许 commit-addressed immutable key。

---

# 9. 服务职责

负责：

- Skill discovery/search/load。
- Skill metadata/version。
- source commit 报告/可选 pin。
- Registry 读取/校验。
- 已选 Skill 关联文件按需同 SHA 读取。

不负责：

- Shell/GitHub 写操作/PR/Docker/CI。
- KV/R2 同步。
- vector index。
- server-side conversation snapshot state。

---

# 10. Definition of Done

## MCP

- [ ] ChatGPT Web 可添加 MCP。
- [ ] MCP SDK / Streamable HTTP 正常。
- [ ] list/search 返回 `sourceCommitSha`。
- [ ] load_skill 可选 snapshot pin。

## Skill

- [ ] Registry minimal/low-churn/deterministic。
- [ ] `release-ai-plugins` 专项改造契约完整。
- [ ] 多 Skill 高频发布只集中生成一次 registry。
- [ ] 新 unpinned call 可看到最新 HEAD。
- [ ] pinned load 可复现 discovery snapshot。

## Dev Tests

- [ ] MCP package 使用独立 Vitest 4.1+ 兼容测试栈。
- [ ] Node unit tests 完整。
- [ ] Workers Vitest / workerd runtime tests 完整。
- [ ] MCP SDK client/server contract tests 完整。
- [ ] 不强制升级 monorepo root Vitest 3.x。

## Production Tests

- [ ] Nitro Cloudflare production build 有 gate。
- [ ] Wrangler `createTestHarness()` 集成测试完整。
- [ ] Cloudflare Preview/Staging 只读 smoke 完整。
- [ ] Production post-deploy smoke 完整。
- [ ] 高频 `dev` 更新下使用 snapshot consistency，避免 flaky HEAD 断言。

## Runtime

- [ ] Worker 无 KV/R2 binding 也完整工作。
- [ ] 深层文件按需读取，不默认递归加载。
- [ ] 无 Node Server 专属实现。

## Growth

- [ ] 没有增量 Registry DB/vector DB/session store 过度设计。
- [ ] 未来优化由 Skill count、registry size、GitHub request 数和 P95 latency 等真实指标触发。
