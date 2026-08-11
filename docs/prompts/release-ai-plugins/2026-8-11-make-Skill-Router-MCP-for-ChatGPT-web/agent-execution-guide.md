# AI Agent 执行指南

## 文档定位

本文用于指导其他 AI Agent 实施 Skill Router MCP Server。

真实工作负载：Skill 数量中等，但更新、维护和新增频率高。

因此执行目标是：

```text
freshness
+
exact-commit consistency
+
low-maintenance architecture
```

而不是提前增加大型存储/搜索系统。

---

# 执行原则

1. GitHub `ai-plugins` 是唯一 Source of Truth。
2. 未 pin tool call 只解析一次 `GITHUB_REF` -> exact SHA。
3. 单个 tool call 的 registry/Skill/关联文件使用同一 SHA。
4. list/search 返回 `sourceCommitSha`。
5. load_skill 可选使用 `sourceCommitSha` pin；未提供则读取最新 HEAD。
6. Registry v1 只包含 `id/plugin/name/description/version/entry`。
7. references/templates/examples 按需同 SHA 读取，不进入 Registry v1。
8. 第一版不增加 KV/R2/D1/DO/vector DB/server session。
9. MCP 协议由 TypeScript SDK 实现，不手写 JSON-RPC lifecycle。

---

# Phase 1：理解约束

阅读：

```text
README.md
architecture.md
implementation-spec.md
high-frequency-skill-churn-strategy.md
skill-registry-schema.md
```

如果要真正改造 `release-ai-plugins`，继续阅读 2026-8-12 专项提示词包。

---

# Phase 2：初始化工程

创建 Nitro v3 Cloudflare Worker 工程。

要求：

- H3 由 Nitro 依赖树管理。
- 当前 Nitro v3 Cloudflare preset。
- Wrangler 只配置必要 vars/Secret。
- 不创建 storage binding。

---

# Phase 3：实现 MCP 层

使用：

```text
@modelcontextprotocol/sdk
McpServer
Streamable HTTP
```

核心 tools：

```text
list_skills
search_skills
load_skill
```

Nitro endpoint 只做 transport/runtime adapter。

---

# Phase 4：实现 GitHub Source Layer

```text
GitHub Repository Adapter
  +-- resolve ref -> SHA
  +-- accept pinned SHA in configured repo
  +-- load registry @ SHA
  +-- load selected Skill @ SHA
  +-- load related files on demand @ SHA
```

只有 adapter 接触 `GITHUB_TOKEN`。

---

# Phase 5：实现 Registry / Search

运行时读取：

```text
ai-plugins/skill-registry.json @ SourceSnapshot.commitSha
```

实现：

- schema validator。
- in-memory list/search。
- entry path resolution。
- exact-SHA loader。

不要：

- Worker 运行时全仓库扫描。
- vector search。
- deep-file registry mirror。

---

# Phase 6：实现 高频更新语义

必须覆盖：

```text
search @ A
branch -> B
load(skillId, sourceCommitSha=A) -> A
load(skillId) -> B
```

不使用 server-side snapshot session。

---

# Phase 7：测试

执行 `testing-plan.md`：

- Registry deterministic/low-churn。
- exact-SHA 单调用一致性。
- 高频连续 push freshness。
- search->load snapshot pin。
- deep files 按需读取。
- MCP Inspector / ChatGPT Web。

---

# Phase 8：部署

完成：

- Worker。
- custom domain。
- GitHub vars/Secret。
- HTTPS MCP endpoint。

不要求 storage/sync pipeline。

---

# 禁止行为

- 暴露 Token。
- Node HTTP server / filesystem persistence。
- KV/R2 主链路。
- vector DB/embedding pipeline。
- mutable branch 多次独立读取同一 tool call。
- deep-file registry mirror。
- server-side snapshot session store。
- 手写 MCP lifecycle。

---

# 完成标准

```text
ChatGPT Web
→ Remote MCP
→ MCP SDK
→ Skill Router
→ latest/pinned SourceSnapshot
→ GitHub ai-plugins
```

并且高频 Skill 更新不要求 Cloudflare storage 同步或 Worker redeploy。
