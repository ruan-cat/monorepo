# AI Agent 执行指南

## 文档定位

本文用于指导其他 AI Agent 实施 Skill Router MCP Server。

目标：Agent 仅依赖本目录文档，即可完成从设计、开发、测试到部署的完整流程。

---

# 执行原则

1. 不重新设计已冻结的架构。
2. GitHub `ai-plugins` 是唯一 Skill Source of Truth。
3. 每次 tool call 先把 `GITHUB_REF` 解析为 exact commit SHA。
4. registry、SKILL.md、references 必须使用同一 SourceSnapshot。
5. Skill Router 只负责发现、搜索和上下文加载，不执行代码。
6. 第一版不增加 KV/R2/D1/Durable Objects。
7. MCP 协议由 TypeScript SDK 实现，不手写 JSON-RPC lifecycle。

---

# Phase 1：理解约束

阅读：

1. `README.md`
2. `architecture.md`
3. `implementation-spec.md`
4. `skill-registry-schema.md`

确认：

- Remote MCP Server 边界。
- Nitro/H3/MCP SDK 分层。
- SourceSnapshot 一致性模型。
- `ai-plugins/skill-registry.json` 的生成定位。

---

# Phase 2：初始化工程

创建 Nitro v3 Cloudflare Worker 工程。

要求：

- H3 版本由 Nitro 依赖树管理。
- 使用当前 Nitro v3 Cloudflare preset。
- Wrangler 仅配置必要 vars / Secret。
- 不创建 storage binding。

---

# Phase 3：实现 MCP 层

使用：

```text
@modelcontextprotocol/sdk
McpServer
Streamable HTTP
```

注册：

```text
list_skills
search_skills
load_skill
```

Nitro endpoint 只做 transport/runtime adapter。

---

# Phase 4：实现 GitHub Source Layer

实现：

```text
GitHub Repository Adapter
        |
        +-- resolve ref -> commit SHA
        +-- load registry @ SHA
        +-- load skill @ SHA
```

只有该 adapter 接触 `GITHUB_TOKEN`。

禁止在 service/tool 中直接调用 GitHub API。

---

# Phase 5：实现 Skill Registry

运行时读取：

```text
ai-plugins/skill-registry.json @ SourceSnapshot.commitSha
```

实现：

- registry schema validator
- list/search
- entry path resolution
- exact-SHA skill loader

不要在 Worker 运行时扫描整个 skills 树来代替 registry 常规路径。

---

# Phase 6：测试

执行 `testing-plan.md`。

必须覆盖：

- registry deterministic generation。
- stale registry check。
- source ref resolution。
- branch 在请求过程中推进时仍固定旧 snapshot。
- 下一次新请求解析新 HEAD。
- MCP SDK / Inspector / ChatGPT Web 验收。

---

# Phase 7：部署

完成：

- Cloudflare Worker 部署。
- custom domain。
- GitHub vars / Secret。
- HTTPS MCP endpoint。

不要求：

- KV namespace。
- R2 bucket。
- registry Cloudflare publish pipeline。

---

# 禁止行为

- 暴露 GitHub Token。
- 使用 Node HTTP server 或 filesystem 持久化。
- 把 skill 内容当高于系统指令的权限来源。
- 为了“优化”直接引入 KV/R2。
- 以 mutable branch name 在同一 tool call 内多次独立取版本。
- 手写 MCP initialize/tools routing。

---

# 完成标准

```text
ChatGPT Web
→ Remote MCP
→ MCP SDK
→ Skill Router
→ SourceSnapshot(commit SHA)
→ GitHub ai-plugins
```

完整链路可用，并且新 skill commit 的可见性不依赖 Cloudflare storage 同步。
