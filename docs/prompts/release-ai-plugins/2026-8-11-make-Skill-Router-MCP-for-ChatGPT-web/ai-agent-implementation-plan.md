# Skill Router MCP Server AI Agent 实施阅读计划

## 文档定位

本文指导后续实际编码 Agent。

任何 Agent 开始前必须理解：

```text
GitHub Source of Truth
+
exact commit SourceSnapshot
+
Cloudflare Worker / Nitro v3
+
MCP TypeScript SDK
+
Skill 数量中等但更新频率高
```

第一版不以 KV/R2/vector DB/增量 Registry DB 为前置依赖。

---

# 一、核心执行原则

优先级：

```text
freshness / correctness
>
protocol compatibility
>
低维护成本 / 简单调试
>
measured performance optimization
```

禁止：

- 跳过架构文档直接编码。
- 按旧 Nitro/MCP 经验自行换架构。
- 把 Skill Router 做成执行型 Agent。
- 默认加入 KV/R2/D1/DO/vector DB。
- 手写 MCP JSON-RPC lifecycle。
- 用 mutable branch 分别读取 registry 与 Skill。
- 为高频更新建立 server-side session/state machine。
- 把 references/templates/examples 重新塞回 Registry v1。

---

# 二、强制阅读顺序

## 第 1 阶段：目标与架构

```text
README.md
architecture.md
implementation-spec.md
high-frequency-skill-churn-strategy.md
```

必须理解：

- GitHub 是唯一 Skill 真源。
- 未 pin tool call 使用最新 HEAD。
- 单 tool call 使用 exact SHA。
- search/list 返回 `sourceCommitSha`。
- load 可选 pin exact SHA。
- 更新频率高不等于数据规模巨大。

## 第 2 阶段：Skill Registry 与发布集成

```text
skill-registry-schema.md
release-ai-plugins-registry-integration.md
```

如果任务包含真正修改 `release-ai-plugins` / generator / registry / CI gate，继续进入：

```text
docs/prompts/release-ai-plugins/
└── 2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/
    ├── README.md
    ├── implementation-plan.md
    ├── high-frequency-maintenance-and-growth-strategy.md
    ├── release-ai-plugins-modification-spec.md
    ├── registry-generator-spec.md
    ├── skill-registry-contract.md
    ├── cloud-mcp-integration-contract.md
    ├── ci-stale-registry-gate.md
    ├── testing-and-acceptance.md
    └── agent-handoff-checklist.md
```

必须理解：

- Registry 是 generated low-churn discovery manifest。
- v1 只有 `id/plugin/name/description/version/entry`。
- 多 Skill release 只集中生成一次 registry。
- generator full scan 当前真实 Skill tree，不维护增量 state。
- CI Check 只读。

## 第 3 阶段：Nitro / Cloudflare Runtime

```text
runtime-dependency-version-policy.md
nitro-v3-development-guide.md
nitro-v3-cloudflare-integration.md
runtime-binding-contract.md
cloudflare-worker-deployment.md
```

第一版 bindings：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
GITHUB_TOKEN
```

## 第 4 阶段：MCP

```text
mcp-server-framework-selection.md
mcp-protocol-design.md
mcp-client-validation-guide.md
```

核心 tools：

```text
list_skills
search_skills
load_skill
```

必须实现 latest snapshot + optional sourceCommitSha pin 语义。

## 第 5 阶段：测试、安全、部署

```text
testing-plan.md
security-model.md
deployment-runbook.md
```

重点：

- Registry deterministic/low-churn。
- exact SHA 单调用一致性。
- 高频连续 push freshness。
- search->load snapshot pin。
- deep files 按需同 SHA。
- Worker 无 Cloudflare storage binding 仍工作。

---

# 三、推荐编码顺序

```text
1. 初始化 Nitro v3 Worker
2. 最小 Wrangler vars / Secret
3. MCP SDK + Streamable HTTP
4. McpServer + read-only tools
5. GitHub Repository Adapter
6. latest/pinned SourceSnapshot
7. registry loader / in-memory search
8. exact-SHA load_skill
9. selected Skill related-file on-demand loading
10. snapshot/freshness/low-churn tests
11. MCP Inspector
12. ChatGPT Web Developer Mode
13. 测量 GitHub request / registry size / P95
14. 只有真实瓶颈出现才设计下一层优化
```

如果 registry 尚未实际实现，第 7 步前应按 2026-8-12 专项包完成 release-side generator，而不是让 Worker 临时扫描整个 Skill tree 作为永久替代。

---

# 四、维护与增长边界

当前有意保持：

```text
release side:
many changes -> one full registry generation

runtime side:
one registry -> in-memory search -> selected Skill
```

不要提前引入：

- incremental registry DB。
- deep-file registry mirror。
- vector/embedding search。
- background sync。
- session snapshot store。

只有测量显示简单方案成为明显瓶颈时再演进。

---

# 五、最终验收

必须：

- Worker 无 KV/R2 也能运行。
- Registry 可重复生成且低 churn。
- 多 Skill release 只生成一次 registry。
- list/search 返回 sourceCommitSha。
- load_skill 可选 pin。
- unpinned 新请求看到新 HEAD。
- pinned 请求可复现旧 snapshot。
- GitHub credential 只存在 adapter 边界。
- 深层附属文件按需同 SHA 读取。
- 没有为高频更新引入不必要的持久状态或大型搜索系统。
