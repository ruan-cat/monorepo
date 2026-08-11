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
+
分层 Vitest / Worker production tests
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
runtime testability
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
- 只在 Node Vitest 中通过就声称 Worker runtime 已验收。
- 直接把 Cloudflare Worker tests 塞进 monorepo 现有 Vitest 3.x workspace。

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
```

必须理解：

- Registry 是 generated low-churn discovery manifest。
- v1 只有 `id/plugin/name/description/version/entry`。
- 多 Skill release 只集中生成一次 registry。
- generator full scan 当前真实 Skill tree，不维护增量 state。
- CI Check 只读。

## 第 3 阶段：Nitro / Cloudflare Runtime 与版本

```text
runtime-dependency-version-policy.md
nitro-v3-development-guide.md
nitro-v3-cloudflare-integration.md
runtime-binding-contract.md
cloudflare-worker-deployment.md
```

必须理解：

```text
Nitro v3 = application runtime
H3 = Nitro-managed runtime layer
Wrangler = deployment/test harness tooling
```

第一版 bindings：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
GITHUB_TOKEN
```

同时必须看到测试版本隔离：

```text
monorepo root Vitest 3.x
!=
MCP package-local Vitest 4.1+
```

不要为了 Workers Vitest integration 强制升级全仓测试栈。

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

必须实现 latest snapshot + optional `sourceCommitSha` pin。

## 第 5 阶段：测试体系

严格阅读：

```text
vitest-development-testing-strategy.md
cloudflare-worker-production-testing-strategy.md
testing-plan.md
```

必须区分：

```text
Node Vitest unit
Workers Vitest / workerd
production build harness
Cloudflare preview/staging
production smoke
ChatGPT Web acceptance
```

不得用任一单层测试替代其他层。

## 第 6 阶段：安全 / 部署

```text
security-model.md
deployment-runbook.md
```

---

# 三、推荐编码与测试顺序

```text
1. 初始化 Nitro v3 Worker
2. 最小 Wrangler vars / Secret
3. package-local Vitest 4.1+ 测试基础设施
4. MCP SDK + Streamable HTTP
5. McpServer + read-only tools
6. GitHub Repository Adapter
7. latest/pinned SourceSnapshot
8. registry loader / in-memory search
9. exact-SHA load_skill
10. selected Skill related-file on-demand loading
11. Node unit tests
12. Workers Vitest/workerd runtime tests
13. Nitro Cloudflare production build
14. Wrangler createTestHarness integration
15. MCP technical client/Inspector
16. Cloudflare Preview/Staging smoke
17. production deploy + read-only smoke
18. ChatGPT Web Developer Mode
19. 测量 GitHub request / registry size / P95
20. 只有真实瓶颈出现才设计下一层优化
```

如果 registry 尚未实际实现，第 8 步前应按 2026-8-12 专项包完成 release-side generator，而不是让 Worker 临时扫描整个 Skill tree 作为永久替代。

---

# 四、开发期测试执行规则

修改纯领域逻辑：

```text
Node unit
```

修改 Worker runtime/binding/MCP endpoint：

```text
Node unit
+
Workers Vitest
```

准备提交：

```text
unit
worker runtime
production build
production-build integration
```

不要每次保存文件都触发真实 Cloudflare preview。

---

# 五、生产测试执行规则

发布前：

```text
local production harness
  ↓
preview/staging smoke
```

发布后：

```text
production read-only smoke
```

Production smoke 只做：

```text
health
initialize
tools/list
search
load pinned
```

不在 production 做写操作或重型压力测试。

---

# 六、高频 dev 更新下的测试稳定性

不要用瞬时 branch HEAD 做脆弱断言。

正确：

```text
search returns A
load(pin=A) returns A
```

latest 模式验证它返回一个自洽 snapshot，而不是要求它等于测试机几秒前查询的 HEAD。

本地自动化用 fake A/B/C fixtures 模拟 branch 连续推进。

---

# 七、维护与增长边界

当前保持：

```text
release side:
many changes -> one full registry generation

runtime side:
one registry -> in-memory search -> selected Skill

test side:
fast local layers -> small remote smoke
```

不要提前引入：

- incremental registry DB。
- deep-file registry mirror。
- vector/embedding search。
- background sync。
- session snapshot store。
- 每 PR 必跑重型 remote/production tests。

---

# 八、最终验收

必须：

- Worker 无 KV/R2 也能运行。
- Registry 可重复生成且低 churn。
- list/search 返回 sourceCommitSha。
- load_skill 可选 pin。
- unpinned 新请求看到新 HEAD。
- pinned 请求可复现旧 snapshot。
- GitHub credential 只存在 adapter 边界。
- 深层附属文件按需同 SHA 读取。
- MCP package Vitest 4.1+ 与根 Vitest 3.x 隔离。
- Node unit / workerd / production harness / preview / production smoke 全部有明确职责。
- 没有为高频更新引入不必要的持久状态、远程测试依赖或大型搜索系统。
