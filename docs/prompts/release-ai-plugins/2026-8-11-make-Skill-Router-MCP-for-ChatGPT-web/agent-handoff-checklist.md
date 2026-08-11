# Skill Router MCP Server AI Agent 交接清单

## 文档目的

用于在不同 AI Agent 之间传递最终设计约束，避免回退到旧 KV/深层索引/无 pin 架构。

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

# 实施检查

## 工程

- [ ] Nitro v3 Worker 初始化。
- [ ] 最小 Wrangler vars/Secret。
- [ ] MCP endpoint。

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

## 部署 / 验收

- [ ] Worker 无 storage binding 也运行。
- [ ] 新 push 后 unpinned call 看到新 HEAD。
- [ ] pinned load 复现 discovery snapshot。
- [ ] MCP Inspector。
- [ ] ChatGPT Web Developer Mode。

---

# Growth Guardrails

- [ ] 不因为更新频率高就假设数据规模巨大。
- [ ] Search 仍使用单 registry 内存匹配。
- [ ] Deep files 不进入 Registry v1。
- [ ] Future cache only commit-addressed。
- [ ] 性能升级由 registry size、GitHub requests/tool、P95 等真实指标触发。

---

# Agent 行为规范

1. 优先遵循最新文档。
2. 不恢复 KV/R2 主链路。
3. 不恢复 references[] registry 设计。
4. 不引入 server session 解决 snapshot 问题。
5. 遇到 SDK/Nitro API 不确定性查当前官方文档。
6. 不把假设写成冻结事实。
