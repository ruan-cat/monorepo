# Cloudflare AI Gateway 使用策略

## 文档目的

定义 Skill Router MCP 与 Cloudflare AI Gateway 的边界，防止为了“Cloudflare 原生”提前引入模型调用、KV/R2/vector 依赖。

---

# 1. MVP 不使用 AI Gateway

核心任务：

```text
MCP server/version/tool discovery
Skill list/search/load
GitHub exact-commit reads
```

本质是确定性数据/上下文服务，不需要 LLM inference。

---

# 2. MVP 架构

```text
ChatGPT Web
  ↓
Cloudflare Worker
  ↓
Nitro v3 + MCP SDK
  ↓
Skill Router
  ↓
GitHub Repository Adapter
  ↓
exact SourceSnapshot
  ├─ skill-registry.json
  └─ selected Skill files
```

没有 mandatory：

```text
AI Gateway
KV
R2
D1
Vector DB
```

---

# 3. 不应加入的链路

不要：

```text
ChatGPT
  ↓
Worker
  ↓
AI Gateway
  ↓
LLM
  ↓
决定如何读取 Skill
```

原因：

- 增加 latency/cost/failure domain。
- search 当前可以在小 registry 内确定性完成。
- 会让 MCP 自己依赖第二个模型来帮助主模型选择 Skill。

---

# 4. 未来何时考虑 AI Gateway

只有真实 use case/指标表明需要模型 inference，例如：

- 语义搜索质量明显不足。
- 需要 embedding/rerank。
- 需要离线生成 Skill summary/tag。
- 需要受控模型路由/观测。

这属于独立架构升级。

---

# 5. 演进顺序

```text
Level 0
exact Git + minimal registry + in-memory search

Level 1
search/tokenization/request dedupe/conditional fetch 优化

Level 2
必要时 immutable commit-addressed cache

Level 3
只有语义质量问题真实存在时评估 AI Gateway + embedding/rerank
```

不要跳级。

---

# 6. 与 MCP Release 的关系

AI Gateway 不参与 MCP application SemVer、Worker version metadata 或 Skill source version。

未来若加入 AI Gateway，会成为 MCP Runtime dependency，因此相关代码/config 变化需要：

```text
MCP SemVer
Worker versioned release
Preview/Staging
Production smoke
```

如果它改变 tool schema/metadata，还要执行 ChatGPT tool refresh/review gate。

---

# 7. AI Agent 实施要求

第一版优先：

```text
1. OpenAI-compatible MCP
2. get_server_info / tools/list
3. Git exact SourceSnapshot
4. Registry + live Skill tools
5. versioned Cloudflare release
6. tests/ChatGPT acceptance
```

AI Gateway 不在 MVP checklist。
