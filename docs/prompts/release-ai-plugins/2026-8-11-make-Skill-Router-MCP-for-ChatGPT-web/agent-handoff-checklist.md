# Skill Router MCP Server AI Agent 交接清单

## 文档目的

用于在不同 AI Agent 之间传递最终设计约束，避免回退到旧 KV/深层索引/无 pin/单一 Node 测试架构。

---

# 项目目标

```text
ChatGPT Web
  ↓
Remote MCP / Streamable HTTP
  ↓
Cloudflare Worker
  ↓
Nitro v3 Runtime
  ↓
MCP TypeScript SDK
  ↓
Skill Router
  ↓
latest/pinned SourceSnapshot(commit SHA)
  ↓
GitHub ai-plugins
```

真实工作负载：Skill 数量中等、更新频率高。

---

# 不允许改变的设计决策

## Runtime

- [ ] Cloudflare Worker Serverless。
- [ ] Nitro v3。
- [ ] H3 由 Nitro 依赖树管理。
- [ ] 无 Node HTTP server/filesystem persistence。

## MCP

- [ ] `@modelcontextprotocol/sdk`。
- [ ] Streamable HTTP。
- [ ] `McpServer`。
- [ ] tools 只读。
- [ ] 不手写 MCP lifecycle。

## Skill Source / Snapshot

- [ ] GitHub `ai-plugins` 是 Source of Truth。
- [ ] Unpinned tool call resolve `GITHUB_REF` once -> SHA。
- [ ] 单调用所有读取同 SHA。
- [ ] list/search 返回 `sourceCommitSha`。
- [ ] load_skill 可选接受 `sourceCommitSha` pin。
- [ ] pin 不能覆盖 configured owner/repo。
- [ ] 不需要 server-side snapshot session。

## Registry

- [ ] `ai-plugins/skill-registry.json` 是 deterministic discovery manifest。
- [ ] v1 只有 `id/plugin/name/description/version/entry`。
- [ ] 不含 timestamp/current commit SHA。
- [ ] 不枚举 references/templates/examples。
- [ ] 中等 Skill 数量继续 full-scan generator。
- [ ] 多 Skill release 只生成一次 registry。

## Storage / Search

MVP 不需要：

- [ ] KV。
- [ ] R2。
- [ ] D1。
- [ ] Durable Objects。
- [ ] vector database/embedding pipeline。
- [ ] incremental Registry DB。

---

# 测试架构冻结

## Vitest Version Boundary

- [ ] Monorepo root 当前 Vitest 3.x 不因为 MCP 被强制升级。
- [ ] Skill Router MCP package 使用 package-local Vitest 4.1+ compatible version。
- [ ] Workers Vitest project 不加入旧 root `vitest.workspace.ts` 同进程运行。
- [ ] `pnpm-lock.yaml` 固化 Workers Vitest / Wrangler / Vitest 兼容组合。

## Dev Test Layers

- [ ] Node Vitest unit tests。
- [ ] GitHub adapter fake/mock tests。
- [ ] Workers Vitest / workerd runtime tests。
- [ ] MCP SDK client/server contract tests。

## Production-build Test Layers

- [ ] Nitro Cloudflare production build gate。
- [ ] Wrangler `createTestHarness()` HTTP/MCP integration。
- [ ] local harness outbound GitHub 使用可控 mock。
- [ ] Cloudflare Preview/Staging smoke。
- [ ] Production post-deploy read-only smoke。
- [ ] ChatGPT Web Developer Mode 最终验收。

## 高频更新测试稳定性

- [ ] 自动化使用 A/B/C fake commit fixtures。
- [ ] 不依赖真实 `dev` 在测试期间被 push。
- [ ] 线上断言优先 `search returns A -> load(pin=A) returns A`。
- [ ] 不用“returned SHA 必须等于几秒前 HEAD”制造 flaky test。

---

# 实施检查

## 工程

- [ ] Nitro v3 Worker 初始化。
- [ ] 最小 Wrangler vars/Secret。
- [ ] MCP endpoint。
- [ ] package-local Vitest configs/scripts。

## MCP Tools

- [ ] list_skills。
- [ ] search_skills。
- [ ] load_skill latest。
- [ ] load_skill pinned。

## Source

- [ ] GitHub Repository Adapter。
- [ ] ref -> SHA。
- [ ] pinned SHA。
- [ ] exact-SHA registry load。
- [ ] exact-SHA Skill load。
- [ ] related-file on-demand load。

## Release / Registry

- [ ] 2026-8-12 专项提示词包已遵循。
- [ ] deterministic generator。
- [ ] stale Check。
- [ ] multi-Skill one-Apply/one-Check。
- [ ] low-churn schema。
- [ ] PS5.1 / pwsh7 cross-runtime determinism 测试。

## 部署 / 验收

- [ ] Worker 无 storage binding 也运行。
- [ ] 新 push 后 unpinned call 看到新 HEAD。
- [ ] pinned load 复现 discovery snapshot。
- [ ] production build harness 通过。
- [ ] preview/staging smoke 通过。
- [ ] production read-only smoke 通过。
- [ ] MCP technical client/Inspector。
- [ ] ChatGPT Web Developer Mode。

---

# CI Gate 建议

PR/开发 CI：

```text
typecheck
Node unit
Workers Vitest
Nitro Cloudflare build
createTestHarness integration
registry stale check
release-side relevant tests
```

Deploy gate：

```text
preview/staging smoke
  ↓
production deploy
  ↓
production smoke
```

普通 PR CI 不需要真实 production Cloudflare/GitHub Secrets。

---

# Growth Guardrails

- [ ] 不因为更新频率高就假设数据规模巨大。
- [ ] Search 仍使用单 registry 内存匹配。
- [ ] Deep files 不进入 Registry v1。
- [ ] Future cache only commit-addressed。
- [ ] 性能升级由 registry size、GitHub requests/tool、P95 等真实指标触发。
- [ ] 不因为测试多就把每次开发循环变成远程部署测试。
- [ ] production smoke 保持少量只读高价值场景。

---

# Agent 行为规范

1. 优先遵循最新文档。
2. 不恢复 KV/R2 主链路。
3. 不恢复 references[] registry 设计。
4. 不引入 server session 解决 snapshot 问题。
5. 不用单一 Node test 替代 Worker runtime/production build testing。
6. 不为了 Workers Vitest 4.x 顺手升级全仓 Vitest。
7. 遇到 SDK/Nitro/Cloudflare testing API 不确定性查当前官方文档。
8. 不把假设写成冻结事实。
