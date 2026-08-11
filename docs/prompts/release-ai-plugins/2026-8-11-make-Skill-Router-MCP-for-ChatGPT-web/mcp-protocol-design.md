# Skill Router MCP Server MCP 协议实施设计

## 1. 文档定位

本文提供给 AI Agent 实施 Remote MCP Server 的工程规格。

本项目使用 MCP TypeScript SDK，不手写 JSON-RPC lifecycle。

同时针对真实工作负载优化：Skill 数量中等但更新频率高，因此协议层需要同时支持“默认读取最新 HEAD”和“search -> load 可选固定同一 commit snapshot”。

---

# 2. MCP 技术选型

必须使用：

```text
@modelcontextprotocol/sdk
```

SDK 负责：

- initialize。
- capability negotiation。
- tools/list。
- tools/call。
- JSON-RPC protocol lifecycle。

Nitro 只负责 Web Runtime / transport adapter。

---

# 3. Transport

生产使用：

```text
Streamable HTTP
```

不使用：

- stdio 作为远程部署 transport。
- 自定义 JSON-RPC endpoint。
- server-side session state 作为第一版一致性机制。

---

# 4. 请求链路

```text
ChatGPT Web MCP Client
        |
HTTPS Streamable HTTP
        |
Nitro v3 endpoint
        |
MCP SDK transport
        |
McpServer
        |
Skill Router Tools
        |
Skill Services
        |
GitHub exact-commit SourceSnapshot
```

---

# 5. Nitro 集成边界

`server/api/mcp.post.ts` 只做：

- HTTP Request/Response 适配。
- runtime binding 提取。
- MCP SDK transport 调用。

禁止：

- 手写 MCP method router。
- Skill parsing。
- GitHub 查询逻辑。
- Cloudflare KV/R2 业务逻辑。

---

# 6. Source Snapshot 协议语义

默认未 pin tool call：

```text
GITHUB_REF
  ↓
resolve current HEAD -> exact SHA
  ↓
all reads in this call use SHA
```

发现类结果必须暴露：

```text
sourceCommitSha
```

这样在高频 push 期间，后续 `load_skill` 可以可选复用 discovery 时的 exact SHA。

---

# 7. `list_skills`

输入：无业务参数。

行为：

```text
resolve latest snapshot
  ↓
read skill-registry.json @ SHA
  ↓
return summaries
```

每个 summary 建议包含：

- id。
- plugin。
- name。
- version。
- description。

结果还必须包含：

```text
sourceCommitSha
```

不要返回不存在于 registry v1 的 tags/references 字段。

---

# 8. `search_skills`

用途：根据任务描述查找 Skill。

输入：

```json
{
  "query": "Nitro API development"
}
```

第一版只在 registry：

```text
id
name
description
plugin
```

上做确定性关键词/token matching。

返回候选 + `sourceCommitSha`。

不读取所有 Skill 正文，不使用 vector database/embedding。

---

# 9. `load_skill`

用途：加载选中的 Skill 正文。

推荐输入：

```json
{
  "skillId": "nitro-api-development",
  "sourceCommitSha": "abc123"
}
```

`sourceCommitSha` 可选。

## 未提供

解析最新 `GITHUB_REF`，适合“加载当前最新版”。

## 已提供

在配置好的同一个 `GITHUB_OWNER/GITHUB_REPO` 内使用该 exact SHA。

不允许 input 覆盖 owner/repo。

流程：

```text
SourceSnapshot
  ↓
registry @ SHA
  ↓
find skillId -> entry
  ↓
SKILL.md @ same SHA
```

返回：

- registry metadata。
- SKILL.md content。
- sourceCommitSha。

第一版不要默认返回所有 references/templates/examples 内容。

---

# 10. 深层关联文件策略

Registry v1 不枚举 references/templates/examples。

`load_skill` 首先加载 `SKILL.md`。

如果 Skill 明确引用 repo-relative 关联文件，可由 Skill Router 在实际需要时继续按同一 SHA 读取。

第一版可以：

- 在 `load_skill` 内只解析/加载明确必要的文件；或
- 后续增加一个窄范围、只允许读取已选 Skill 目录内文件的 read tool。

具体方式由实现 Agent根据实际 MCP SDK/tool UX 选择，但必须满足：

- 不遍历/加载整个仓库。
- 不允许任意 repository path 读取。
- 所有关联读取固定在同一 commit SHA。

不要为了方便而把深层文件列表重新塞回 registry v1。

---

# 11. 可选 `get_skill_metadata`

如果需要独立 metadata tool：

输入：

```json
{
  "skillId": "nitro-api-development",
  "sourceCommitSha": "abc123"
}
```

pin 规则与 `load_skill` 相同。

输出 registry entry + `sourceCommitSha`。

它不是第一版必须 tool；核心仍是 list/search/load。

---

# 12. Tool Annotation

所有当前 Skill Router tools 是只读能力，应设置 SDK 当前版本支持的只读/非破坏性 annotations，例如语义上：

```text
readOnlyHint = true
destructiveHint = false
```

实现时以当前 MCP TypeScript SDK schema/API 为准，不自行发明字段签名。

---

# 13. 高频更新下的跨 Tool Call 一致性

典型：

```text
search_skills @ commit A
push commit B
load_skill(skillId, sourceCommitSha=A)
```

必须仍能加载 A。

若调用方不传 pin：

```text
load_skill(skillId)
```

则读取当前最新 HEAD。

这是轻量一致性机制，不需要 session token store、KV、Durable Objects 或会话数据库。

---

# 14. Error Contract

至少区分：

```text
REGISTRY_NOT_FOUND
REGISTRY_SCHEMA_UNSUPPORTED
SKILL_NOT_FOUND
REGISTRY_ENTRY_INVALID
SOURCE_COMMIT_INVALID / SOURCE_READ_FAILED
GITHUB_RATE_LIMITED
GITHUB_AUTH_FAILED
```

错误结果应包含足够诊断信息，例如 `sourceCommitSha`（如果 snapshot 已建立），但绝不能返回 GitHub Token/header。

---

# 15. Serverless 约束

Cloudflare Worker 第一版：

- stateless request/tool call。
- 不依赖 filesystem persistence。
- 不依赖 server session。
- 不要求 KV/R2/D1/DO。

Git commit SHA 是已有的不可变版本边界，不需要另造 snapshot 状态服务。

---

# 16. 轻量增长政策

中等 Skill 数量继续使用：

```text
one registry fetch
+
in-memory search
+
selected Skill fetch
```

只有真实性能数据证明需要时才评估 commit-addressed immutable cache。

详细见：

```text
high-frequency-skill-churn-strategy.md
```

---

# 17. 验收标准

- [ ] SDK initialize/tools lifecycle 正常。
- [ ] list/search 返回 `sourceCommitSha`。
- [ ] `load_skill` 可选接受 `sourceCommitSha` pin。
- [ ] 未 pin 调用能看到最新 HEAD。
- [ ] pinned load 可复现 discovery snapshot。
- [ ] 同一 tool call 所有读取 exact-SHA 一致。
- [ ] Registry v1 不依赖 tags/references 深层索引。
- [ ] 无 server-side session/KV/R2 依赖。
- [ ] ChatGPT Web Developer Mode 可连接和调用。
