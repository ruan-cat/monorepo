# MCP Client 验收验证指南

## 文档目的

本文验证 Skill Router MCP Server 是否真正符合 **ChatGPT Web 当前官方 MCP compatibility profile**，并验证：

- Streamable HTTP。
- initialization / server identity。
- 标准工具目录。
- `get_server_info` 版本查询。
- latest/pinned Skill snapshot。
- Cloudflare production Worker version。
- Tool contract 变化后的 ChatGPT refresh/rescan。

---

# 1. 目标链路

```text
ChatGPT Web
  ↓
Remote MCP Client
  ↓
Streamable HTTP
  ↓
Cloudflare Worker / Nitro v3
  ↓
@modelcontextprotocol/sdk / McpServer
  ↓
Skill Router
  ↓
GitHub exact-commit SourceSnapshot
```

---

# 2. 前置条件

- Worker 已部署。
- HTTPS `/mcp` endpoint 正常。
- `@modelcontextprotocol/sdk` 版本已按当前 OpenAI 官方指引/真实验收锁定。
- `McpServer` stable name/version 已配置。
- toolDefinitions 已注册。
- `CF_VERSION_METADATA` 可读。
- build Git SHA 已注入。
- registry 可从 GitHub exact commit 读取。

---

# 3. MCP Inspector

按 OpenAI 当前官方建议先运行 MCP Inspector，选择 Streamable HTTP。

验证：

```text
initialization succeeds
server instructions
advertised tool list
representative tool calls
invalid inputs
schemas/results/errors/annotations
```

如果 MCP upstream 已出现更新的 major/protocol revision，但 OpenAI 当前文档/ChatGPT 仍使用旧 compatibility profile，不要把上游最新能力替代这组产品验收。

---

# 4. Server Identity / MCP Application Version

初始化/server info 必须可识别：

```text
name = skill-router-mcp
version = package.json.version
```

Server application version 不等于：

- Cloudflare Worker Version ID。
- build Git SHA。
- Skill sourceCommitSha。
- Skill metadata.version。

---

# 5. `tools/list`

必须返回当前部署完整工具目录：

```text
get_server_info
list_skills
search_skills
load_skill
```

并验证：

- name/title/description。
- input/output schema。
- annotations。
- 与统一 `toolDefinitions` 一致。

以后工具变化时，测试从 toolDefinitions 派生 expected catalog，不把旧数量硬编码到多处。

---

# 6. `get_server_info`

输入：

```json
{}
```

验证：

```text
server.name
server.version
server.buildGitSha

deployment.workerVersionId
deployment.workerVersionTag
deployment.workerVersionTimestamp

skillSource.repository
skillSource.ref
registrySchemaVersion

tools[]
```

`tools[]` 与标准工具目录同源。

该 tool 默认不访问 GitHub HEAD，因此它的响应不会因为 Skill branch 高频推进而变成额外 upstream 请求。

---

# 7. `list_skills`

- 返回 Registry v1 minimal summaries。
- 返回 `sourceCommitSha`。
- 不返回 deep-file mirror。

---

# 8. `search_skills`

```json
{"query":"Nitro API development"}
```

验证：

- registry metadata 匹配。
- 返回 `sourceCommitSha=A`。
- 不逐个加载所有 Skill 正文。
- 无 Secret。

---

# 9. `load_skill` Latest

```json
{"skillId":"nitro-api-development"}
```

验证：

- configured ref 只 resolve 一次。
- registry + SKILL.md 同 SHA。
- 返回 sourceCommitSha。

---

# 10. `load_skill` Pinned

```json
{
  "skillId":"nitro-api-development",
  "sourceCommitSha":"A"
}
```

即使 branch 已到 B：

```text
registry @ A
SKILL.md @ A
```

调用方不能覆盖 configured owner/repo。

---

# 11. 高频 Skill 更新实测

```text
1. search -> A
2. push Skill update -> B
3. load(pin=A) -> A
4. load(no pin) -> latest B
```

不需要 Worker redeploy / KV purge / R2 sync / ChatGPT tool rescan，因为稳定 tool contract 没变。

线上测试不要求 returned SHA 等于几秒前单独查询的 HEAD，避免高频 push 制造 flaky test。

---

# 12. Worker Production Release 验收

每次 MCP Runtime release 后：

1. `/health`。
2. MCP initialization/server identity。
3. `tools/list`。
4. `get_server_info`。
5. search known Skill。
6. pinned load。

必须确认：

```text
expected MCP app SemVer
expected Worker Version ID/tag
expected buildGitSha
```

已经在线。

---

# 13. Tool Contract 更新后的 ChatGPT 侧验收

如果只改内部实现，tool schema/metadata 不变：

```text
Worker release + production smoke
```

即可完成 Runtime 上线。

如果新增/修改：

```text
tool name/title/description
input/output schema
annotations
```

必须额外：

```text
refresh/rescan Developer Mode connection tools
  ↓
review new metadata
  ↓
rerun evaluation/use cases
  ↓
Workspace review/publish when applicable
```

不要假设 Cloudflare Worker 自动更新会自动刷新 ChatGPT 已批准的 tool snapshot。

---

# 14. ChatGPT Web 真实验收请求

版本查询：

```text
请告诉我当前 Skill Router MCP 的服务版本、Cloudflare Worker 部署版本、构建 commit，以及全部可用工具。
```

预期：调用 `get_server_info`。

Skill snapshot：

```text
搜索 Nitro API 相关 Skill，然后加载你刚刚搜索到的同一个源码版本。
```

预期：使用 discovery 返回的 sourceCommitSha。

---

# 15. OpenAI Skills Import Extension 边界

不要把 live Skill Router 验收改成 submission-time Skills import 验收。

OpenAI 当前 Skills import 属于受限静态 snapshot；Skill 改变后需要重新 Scan Tools/submit，不符合我们高频 live Git source 的核心目标。

---

# 16. 生产验收标准

- [ ] OpenAI-supported SDK/initialization 正常。
- [ ] Streamable HTTP 正常。
- [ ] server identity version = MCP package SemVer。
- [ ] `tools/list` 完整。
- [ ] `get_server_info` 返回安全 MCP/Worker/build/tool metadata。
- [ ] latest/pinned Skill load 正常。
- [ ] 高频 Skill update 不要求 Worker/ChatGPT metadata release。
- [ ] Tool contract 变化有 ChatGPT refresh/rescan gate。
- [ ] Worker Runtime release 后可以明确确认线上 exact version。
- [ ] 无 Secret 泄露。
