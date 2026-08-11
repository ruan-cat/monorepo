# MCP Client 验收验证指南

## 文档目的

本文验证 Skill Router MCP Server 是否符合 ChatGPT Web Remote MCP 使用要求，并验证：

- MCP `2026-07-28` modern protocol。
- Server identity / MCP application version。
- 标准完整工具目录。
- `get_server_info` 自描述能力。
- 高频 Skill 更新下 latest/pinned snapshot。
- Cloudflare production deployment version。

---

# 1. 目标链路

```text
ChatGPT Web
  ↓
Remote MCP Client
  ↓
Streamable HTTP / MCP 2026-07-28
  ↓
Cloudflare Worker / Nitro v3
  ↓
MCP SDK v2 / McpServer
  ↓
Skill Router
  ↓
GitHub exact-commit SourceSnapshot
```

---

# 2. 前置条件

- Worker 已部署。
- HTTPS endpoint 正常。
- MCP SDK v2 modern protocol 正常。
- tool definitions 已注册。
- `CF_VERSION_METADATA` 可读。
- Worker build Git SHA 已注入。
- `ai-plugins/skill-registry.json` 在目标 Git commit 中可读。

---

# 3. Modern MCP 协议验收

不要再把旧的：

```text
initialize / initialized
```

作为 MCP `2026-07-28` 的成功判据。

应验证：

- Client/Server 实际使用 `2026-07-28` modern era。
- 每个请求能够独立完成，不依赖 `Mcp-Session-Id`。
- server identity 可从 modern response metadata 读取。
- 如客户端使用 `server/discover`，其 capability/identity 结果与实际 server 一致。
- Streamable HTTP 请求/响应符合 SDK v2 当前协议实现。

技术验收先使用支持 modern era 的 MCP client/Inspector 版本，再做 ChatGPT Web 实测。

---

# 4. Server Identity 验收

Server identity 必须体现：

```text
name = skill-router-mcp
version = MCP package SemVer
```

Client 读取到的 server version 必须与：

```text
package.json version
```

一致。

不要把 Worker Version ID 或 Skill version 填入 server identity version。

---

# 5. `tools/list`

标准 `tools/list` 必须返回当前部署 MCP 的完整工具目录：

```text
get_server_info
list_skills
search_skills
load_skill
```

如果以后增加/删除工具，测试不要继续硬编码旧数量；应与统一 `toolDefinitions` contract 比较。

同时验证：

- deterministic tool order（若实现 contract 固定排序）。
- tool description。
- input schema。
- 只读/非破坏性 annotations。

---

# 6. `get_server_info`

输入：

```json
{}
```

必须验证：

```text
server.name
server.version
server.protocolRevision
server.buildGitSha

deployment.workerVersionId
deployment.workerVersionTag
deployment.workerVersionTimestamp

skillSource.repository
skillSource.ref
registrySchemaVersion

tools[]
```

重要断言：

```text
get_server_info.tools
==
与 tools/list 同源的 toolDefinitions
```

该 tool 不应为了显示版本额外访问 GitHub HEAD。

---

# 7. `list_skills`

验证：

- 返回 Registry v1 minimal summaries。
- 返回 `sourceCommitSha`。
- 不返回 v1 不存在的深层文件索引。

---

# 8. `search_skills`

输入：

```json
{
  "query": "Nitro API development"
}
```

验证：

- 返回匹配 Skill。
- 返回 id/name/description/version/plugin。
- 返回 `sourceCommitSha=A`。
- 不为了搜索读取所有 Skill 正文。
- 不泄露 Secret。

---

# 9. `load_skill` Latest

```json
{
  "skillId": "nitro-api-development"
}
```

验证：

- 当前 `GITHUB_REF` 只 resolve 一次。
- Registry 与 SKILL.md 同 SHA。
- 返回 metadata + content + sourceCommitSha。

---

# 10. `load_skill` Pinned

```json
{
  "skillId": "nitro-api-development",
  "sourceCommitSha": "A"
}
```

即使 branch 已推进到 B：

- Registry @ A。
- SKILL.md @ A。
- 返回 A。
- input 不能覆盖 configured owner/repo。

---

# 11. 高频更新场景

```text
1. search_skills -> A
2. push Skill update -> B
3. load_skill(pin=A) -> A
4. load_skill(no pin) -> latest B
```

不要求 Worker redeploy / KV purge / R2 upload / session reset。

远程测试不要断言“返回 SHA 必须等于测试开始几秒前读取的 HEAD”，避免高频 push 制造 flaky test。

---

# 12. Worker Release 版本验收

每次 MCP Runtime production release 后：

1. 调用 `get_server_info`。
2. 检查 MCP app SemVer。
3. 检查 build Git SHA。
4. 检查 Cloudflare Worker Version ID/tag/timestamp。
5. 与本次 promote 的 exact Worker version 对齐。
6. 再调用 `tools/list` 验证工具目录。

这比仅确认 `wrangler deploy` exit 0 更可靠。

---

# 13. ChatGPT Web 验收脚本

建议真实请求：

```text
请告诉我你当前这个 Skill Router MCP 的服务版本、协议版本、Cloudflare 部署版本，以及你现在提供的全部 MCP 工具。
```

预期模型可以通过 `get_server_info` / 标准工具目录回答。

再测试：

```text
搜索 Nitro API 相关技能，并加载你刚刚搜索到的同一个源码版本。
```

预期使用 `sourceCommitSha` pin。

---

# 14. 生产验收标准

- [ ] MCP modern `2026-07-28` 请求链工作。
- [ ] 无 legacy initialize/session 前置依赖。
- [ ] Server identity version = MCP application SemVer。
- [ ] `tools/list` 返回完整当前工具目录。
- [ ] `get_server_info` 返回 MCP/Worker/build/tool metadata。
- [ ] `get_server_info.tools` 与标准 tool registry 同源。
- [ ] list/search 返回 `sourceCommitSha`。
- [ ] latest/pinned load 正常。
- [ ] 高频更新不破坏 snapshot consistency。
- [ ] Production release 后能明确确认线上实际版本。
- [ ] 无 Secret 泄露。
