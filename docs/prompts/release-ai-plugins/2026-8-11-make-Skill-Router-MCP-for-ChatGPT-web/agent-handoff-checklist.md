# Skill Router MCP Server AI Agent 交接清单

## 文档目的

该文件用于在不同 AI Agent 之间传递实施状态，避免后续 Agent 回退到旧架构。

---

# 项目目标确认

```text
ChatGPT Web Developer Mode
        |
Remote MCP / Streamable HTTP
        |
Cloudflare Worker
        |
Nitro v3 Runtime
        |
MCP TypeScript SDK
        |
Skill Router
        |
SourceSnapshot(commit SHA)
        |
GitHub ai-plugins
```

---

# 不允许改变的设计决策

## Runtime

必须：

- Cloudflare Worker Serverless。
- Nitro v3。
- H3 由 Nitro 依赖树管理。
- 无 Node HTTP server / filesystem 持久化。

## MCP

必须：

- `@modelcontextprotocol/sdk`。
- Streamable HTTP。
- `McpServer`。
- tools 默认只读。

禁止手写 MCP JSON-RPC lifecycle。

## Skill Source

必须：

- GitHub `ai-plugins` 是 Source of Truth。
- 每个 tool call resolve `GITHUB_REF` -> exact commit SHA。
- registry / skill / references 使用同一 SHA。
- 返回结果可诊断 `sourceCommitSha`。

## Storage

MVP 不需要：

- Cloudflare KV。
- R2。
- D1。
- Durable Objects。

任何新增 storage 设计必须由真实性能或功能需求驱动，并单独更新架构文档。

---

# Skill Registry

推荐：

```text
ai-plugins/skill-registry.json
```

它是确定性生成索引，不是数据库。

必须：

- 覆盖 `common-tools` 与 `dev-skills` roots。
- 不包含 timestamp 等非确定性字段。
- 不写自身 commit SHA。
- 由 `release-ai-plugins` generator 生成/校验。
- CI 可检查 stale registry。

---

# 实施检查

## 工程

- [ ] Nitro v3 Worker 项目初始化。
- [ ] 最小 Wrangler vars/Secret。
- [ ] MCP endpoint 完成。

## MCP

- [ ] MCP SDK server/transport 接入。
- [ ] initialize / tools/list / tools/call 正常。
- [ ] `list_skills` / `search_skills` / `load_skill` 正常。

## Source

- [ ] GitHub Repository Adapter。
- [ ] ref -> commit SHA。
- [ ] exact-SHA registry load。
- [ ] exact-SHA skill load。

## Registry

- [ ] deterministic generator。
- [ ] stale check。
- [ ] release-ai-plugins integration contract 已遵循。

## 部署

- [ ] Worker 发布。
- [ ] Custom Domain。
- [ ] HTTPS MCP Endpoint。
- [ ] 无 KV/R2 也可完整运行。

## 验收

- [ ] push 新 skill commit 后，新 tool call 能看到新 HEAD。
- [ ] 单个 tool call 不跨 commit 混读。
- [ ] MCP Inspector 通过。
- [ ] ChatGPT Web Developer Mode 通过。

---

# Agent 行为规范

1. 优先遵循本目录最新文档。
2. 不自行恢复 KV/R2 主链路。
3. 遇到依赖/API 不确定性先查当前官方文档。
4. 不把实现细节猜测写成冻结事实。
5. 所有实现保持 Cloudflare Worker 兼容。
