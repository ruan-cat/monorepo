# AI Agent 执行指南

## 文档定位

指导 AI Agent 实施 Skill Router MCP Server。

真实工作负载：Skill 数量中等、更新频率高；生产 MCP Runtime 需要版本化部署并真实兼容 ChatGPT Web。

---

# 执行原则

1. ChatGPT compatibility 优先于 MCP upstream 抢跑。
2. 生产 SDK 以 OpenAI 当前 `Build an MCP server` 文档为准。
3. GitHub `ai-plugins` 是唯一 Skill Source of Truth。
4. 每个 Skill tool call 使用 exact Git snapshot。
5. Skill-only update 不部署 Worker。
6. Runtime update 使用 Worker versioned release。
7. Tool contract update 还需要 ChatGPT refresh/rescan/review。
8. MVP 不引入 KV/R2/D1/DO/vector DB。

---

# Phase 1：阅读

```text
README
architecture
implementation-spec
chatgpt-web-mcp-compatibility-profile
mcp-release-versioning-and-production-maintenance
```

然后读取 Nitro/Cloudflare/MCP/Registry/Testing 专项文档。

真正改 `release-ai-plugins` 时进入 2026-8-12 专项包。

---

# Phase 2：工程初始化

- Nitro v3。
- H3 由 Nitro 管理。
- Wrangler 最小 vars/Secret + `CF_VERSION_METADATA`。
- package.json 独立 MCP SemVer。
- build Git SHA 注入方案。
- package-local tests。

---

# Phase 3：MCP

按 OpenAI 当前官方兼容路径使用：

```text
@modelcontextprotocol/sdk
McpServer
Streamable HTTP
```

统一工具：

```text
get_server_info
list_skills
search_skills
load_skill
```

`toolDefinitions` 驱动 SDK registration / tools/list / get_server_info / tests。

禁止手写 JSON-RPC lifecycle。

---

# Phase 4：GitHub Source

```text
latest: GITHUB_REF -> exact SHA
pinned: sourceCommitSha -> exact SHA
```

Registry / SKILL.md / related files 同 SHA。

只有 Repository Adapter 接触 GitHub Token。

---

# Phase 5：Version / Server Info

实现：

```text
McpServer.version = package.json.version
CF_VERSION_METADATA -> Worker ID/tag/timestamp
buildGitSha -> build-time injection
get_server_info -> server/deployment/tool metadata
```

不要把 Worker ID、Skill version、sourceCommitSha 混成 MCP SemVer。

---

# Phase 6：测试

```text
Node unit
Workers Vitest/workerd
MCP SDK client/Inspector-compatible contract
Nitro production build
createTestHarness
Preview/Staging
Production smoke
ChatGPT Web acceptance
```

SDK/protocol测试标准以 OpenAI 当前官方文档为准。

---

# Phase 7：生产发版

Runtime：

```text
SemVer bump
  ↓
all tests
  ↓
versions upload
  ↓
Preview/Staging smoke
  ↓
exact version 100% promote
  ↓
Production smoke
```

Skill-only：不走这条链。

---

# Phase 8：ChatGPT Tool Contract Gate

如果 tool schema/metadata 不变：Runtime release 完成。

如果 tool name/title/description/schema/annotation 变化：

```text
Inspector
  ↓
Developer Mode refresh/rescan
  ↓
rerun use cases/evals
  ↓
Workspace review/publish when applicable
```

不能因为 Cloudflare 已部署就声称 ChatGPT 已更新新工具定义。

---

# 禁止行为

- 抢跑 OpenAI 尚未明确支持的 MCP SDK/protocol major。
- 恢复 KV/R2 主链路。
- 深层文件放回 Registry v1。
- server session 解决 Git snapshot。
- production 只看 `wrangler exit 0` 不做版本 smoke。
- Cloudflare Git Integration 与 GitHub Actions 同时自动部署同一个 Worker。

---

# 完成标准

```text
ChatGPT Web
 -> OpenAI-compatible MCP endpoint
 -> versioned Cloudflare Worker
 -> toolDefinitions/get_server_info
 -> exact Git SourceSnapshot
 -> ai-plugins
```

并且三类 freshness 边界清楚：Skill data / Worker runtime / ChatGPT tool metadata。
