# MCP Client 验收验证指南

## 文档目的

本文验证 Skill Router MCP Server 是否真正符合 ChatGPT Web Developer Mode Remote MCP 使用要求。

重点不仅是协议连通，还要验证高频 Skill 更新时的 latest/pinned snapshot 语义。

---

# 1. 目标链路

```text
ChatGPT Web
  ↓
Remote MCP Client
  ↓
Streamable HTTP
  ↓
Nitro v3 + MCP SDK
  ↓
McpServer
  ↓
Skill Router
  ↓
GitHub exact-commit SourceSnapshot
```

---

# 2. 前置条件

确认：

- Worker 已部署。
- HTTPS endpoint 正常。
- MCP SDK / Streamable HTTP 正常。
- `McpServer` 已注册核心 tools。
- `ai-plugins/skill-registry.json` 在目标 Git commit 中可读。

推荐 endpoint：

```text
https://mcp.ai.ruan-cat.com/mcp
```

---

# 3. MCP 生命周期

验证 initialize：

- protocol version。
- server info。
- capabilities。
- tools capability。

技术验收先使用 MCP Inspector，再做 ChatGPT Web 实测。

---

# 4. tools/list

必须暴露：

```text
list_skills
search_skills
load_skill
```

Tool annotations 必须表达只读/非破坏性语义；具体字段/API 以当前 MCP SDK 为准。

---

# 5. `list_skills`

验证：

- 返回 registry 中的 minimal summaries。
- summary 字段与 Registry v1 一致。
- 返回 `sourceCommitSha`。
- 不要求 tags/references/templates/examples 等 v1 未定义字段。

---

# 6. `search_skills`

输入：

```json
{
  "query": "Nitro API development"
}
```

验证：

- 返回匹配 Skill。
- 返回 id/name/description/version/plugin 等 discovery 信息。
- 返回 `sourceCommitSha`。
- 不为了搜索读取所有 Skill 正文。
- 不泄露 Secret。

记录本次返回的：

```text
sourceCommitSha=A
```

用于 pinned load 验证。

---

# 7. `load_skill` Latest 模式

输入：

```json
{
  "skillId": "nitro-api-development"
}
```

验证：

- 服务解析当前 `GITHUB_REF` 最新 HEAD。
- Registry 与 SKILL.md 来自同一 SHA。
- 返回 registry metadata + SKILL.md + sourceCommitSha。
- 不默认要求加载整个 references/templates/examples 目录。

---

# 8. `load_skill` Pinned 模式

使用 search 返回的 SHA：

```json
{
  "skillId": "nitro-api-development",
  "sourceCommitSha": "A"
}
```

验证：

- 即使 branch HEAD 已推进到 B，仍读取 A。
- Registry 与 SKILL.md 都来自 A。
- 返回 sourceCommitSha=A。
- 调用方不能通过 tool input 覆盖 `GITHUB_OWNER/GITHUB_REPO`。

这是高频更新期间 search -> load 可复现性的核心验收。

---

# 9. 高频更新场景实测

执行：

```text
1. search_skills -> A
2. push Skill update -> branch HEAD B
3. load_skill(..., sourceCommitSha=A) -> 应仍是 A
4. load_skill(...) without pin -> 应看到 B
```

该流程不应要求：

- Worker redeploy。
- KV purge。
- R2 upload。
- server session reset。

---

# 10. 深层文件按需读取验收

如果 Skill 的 `SKILL.md` 明确引用 reference/template/example：

- 只在实际需要时读取。
- path 必须限制在允许 Skill 范围。
- 读取继续使用相同 sourceCommitSha。
- 不默认递归读取整个 Skill 目录。

---

# 11. ChatGPT Web 验收

建议测试请求：

```text
列出当前可用技能，并告诉我这次读取对应的源码 commit。
```

再测试：

```text
搜索 Nitro API 相关技能，然后加载你刚才搜索到的同一个版本。
```

预期 ChatGPT 能使用 discovery 返回的 snapshot 信息完成 pinned load。

---

# 12. 生产验收标准

- [ ] ChatGPT 可连接 endpoint。
- [ ] initialize/tools/list/tools/call 正常。
- [ ] list/search 返回 sourceCommitSha。
- [ ] latest load 正常。
- [ ] pinned load 正常。
- [ ] branch 高频更新不破坏单调用/跨调用预期版本语义。
- [ ] 深层文件按需同 SHA 读取。
- [ ] 无 Secret 泄露。
- [ ] 无 KV/R2/session state 必需依赖。
