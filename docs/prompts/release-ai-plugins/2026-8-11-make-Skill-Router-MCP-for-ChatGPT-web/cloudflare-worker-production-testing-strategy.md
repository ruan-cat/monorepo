# Skill Router MCP：Cloudflare Worker 生产构建与线上测试策略

## 1. 文档目的

本文定义从 production build 到 Cloudflare production 的测试/版本发布边界。

```text
Production Build
  ↓
createTestHarness
  ↓
immutable Worker version upload
  ↓
Preview/Staging smoke
  ↓
exact version promote
  ↓
Production read-only smoke
```

MCP 协议验收以 OpenAI 当前 ChatGPT compatibility profile 为准，而不是追逐尚未在 ChatGPT 官方文档中落地的 upstream future protocol。

---

# 2. 需要记录的版本维度

```text
mcpServerVersion
workerVersionId
workerVersionTag
workerVersionTimestamp
buildGitSha
sourceCommitSha（发生 Skill 调用时）
negotiated MCP protocol/version diagnostics（如 SDK/client 可安全暴露）
```

不要混淆 MCP app/Worker/Skill snapshot。

---

# 3. Production Build Gate

检查：

- Nitro Cloudflare build 成功。
- OpenAI-current `@modelcontextprotocol/sdk` 打包正常。
- server name/version 正确。
- build Git SHA 已注入。
- `CF_VERSION_METADATA` 声明。
- 无 Node listening server/fs persistence。

---

# 4. `createTestHarness()` Integration

Wrangler production-build harness 运行真实 Worker artifact。

GitHub upstream 使用 MSW/等价 mock，未声明 outbound request 默认失败。

从 HTTP/MCP client 外部测试，而不是直接调 handler 函数。

---

# 5. MCP Contract

按 OpenAI 当前官方验收路径覆盖：

```text
initialization
server info/instructions
tools/list
tool calls
schemas/results/errors/annotations
```

核心 tools：

```text
get_server_info
list_skills
search_skills
load_skill
```

额外：latest/pinned SourceSnapshot。

---

# 6. Version Contract

Production build 中：

```text
McpServer.version
== package.json.version
== get_server_info.server.version
```

Tool catalog：

```text
SDK registration
== expected toolDefinitions
== get_server_info.tools
```

Worker metadata 与 MCP SemVer 分开测试。

---

# 7. Immutable Worker Version Upload

production candidate 先：

```text
wrangler versions upload
```

设置 tag：

```text
skill-router-mcp-vX.Y.Z
```

message 包含 build Git SHA / release summary。

获得 immutable Worker Version ID + versioned Preview URL 后再远端 smoke。

---

# 8. Preview / Staging Smoke

真实验证：

- Cloudflare network/workerd。
- HTTPS。
- runtime vars/Secret。
- real read-only GitHub connectivity。
- MCP initialization。
- server version。
- tools/list。
- get_server_info。
- search known Skill。
- pinned/latest load。

精确断言：

```text
candidate MCP SemVer
candidate Worker Version ID/tag
candidate buildGitSha
```

---

# 9. 高频 Skill 更新下避免 Flaky

不要断言：

```text
returned sourceCommitSha == 几秒前测试机查询的 HEAD
```

正确：

```text
search -> A
load(pin=A) -> A
```

Worker candidate version 是 immutable，必须精确验证；Skill source branch 是高频 mutable，不做跨请求瞬时 HEAD equality。

---

# 10. Production Promotion

Preview/Staging 全绿后 promote **同一个被测试过的 exact Worker version**。

Tool contract 改动默认 100% 原子 promote，避免旧新 Worker 同时返回不同 tool schemas/catalog。

完全向后兼容 internal patch 才评估 gradual rollout。

---

# 11. Production Post-deploy Smoke

只读最小集：

```text
GET /health
initialization/server info
tools/list
get_server_info
search known Skill
load pinned
```

确认：

```text
expected MCP SemVer
expected Worker Version ID/tag
expected buildGitSha
```

已成为 active production version。

---

# 12. ChatGPT Tool Metadata Gate

Cloudflare production smoke 通过并不代表 ChatGPT 已经刷新新的 tool schema。

若 tool contract 不变：Runtime release 完成即可。

若 tool name/schema/description/annotation 变化：

```text
MCP Inspector
  ↓
ChatGPT Developer Mode refresh/rescan
  ↓
rerun evaluation/use cases
  ↓
Workspace review/publish when applicable
```

这属于 production release 的独立产品 gate。

---

# 13. Security Smoke

- no Token/auth header。
- no internal stack。
- get_server_info 仅安全版本 metadata。
- read-only annotations 正确。
- related-file path 不越界。

---

# 14. Real GitHub Integration

Preview/Staging 至少真实验证：

```text
resolve ref
read registry
read known Skill
```

生产 smoke 不重复大量打 GitHub。

---

# 15. Rollback

staging 演练：

```text
version N
  ↓
rollback N-1
  ↓
health + initialization + tools/list + get_server_info
```

Runtime bug 用 Worker rollback；Skill content bug 用 Git revert/fix。

Tool contract rollback 还要确认 ChatGPT 侧已批准的 metadata snapshot 与回滚版本兼容。

---

# 16. CI/CD Gate

PR：

```text
typecheck
Node unit
Workers Vitest
MCP SDK contract
production build
createTestHarness
registry/release checks
```

Runtime release：

```text
SemVer bump
  ↓
all gates
  ↓
versions upload
  ↓
Preview/Staging smoke
  ↓
exact 100% promote
  ↓
Production smoke
```

Tool contract change 再增加 ChatGPT refresh/review gate。

---

# 17. OpenAI Compatibility Upgrade Gate

如果未来要切 MCP upstream 新 major/protocol：

- OpenAI current docs 已支持。
- Inspector pass。
- Preview pass。
- ChatGPT Developer Mode pass。
- rollback ready。

不要在生产测试文档里先行把未被 ChatGPT 当前支持的协议当成成功标准。

---

# 18. Definition of Done

- [ ] production build 独立测试。
- [ ] current OpenAI MCP initialization/tool contract 通过。
- [ ] MCP SemVer/Worker metadata/build SHA 精确验证。
- [ ] Preview/Staging 测 exact candidate。
- [ ] promote 同一 candidate。
- [ ] production read-only smoke。
- [ ] Tool contract 变化有 ChatGPT tool metadata gate。
- [ ] 高频 Skill push 不制造 flaky remote test。
- [ ] rollback 路径明确。
