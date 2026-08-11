# Skill Router MCP Server MCP 协议实施设计

## 1. 文档定位

本文定义面向 **ChatGPT Web 当前官方支持能力**的 Remote MCP 协议实现。

生产基线必须遵循：

```text
OpenAI current MCP compatibility profile
+
@modelcontextprotocol/sdk
+
McpServer
+
Streamable HTTP
```

不要仅因为 MCP upstream 发布更高 revision/major SDK 就抢跑生产迁移。

详细兼容策略：

```text
chatgpt-web-mcp-compatibility-profile.md
```

---

# 2. MCP SDK

当前 OpenAI 官方构建文档明确推荐 TypeScript：

```text
@modelcontextprotocol/sdk
zod
```

创建：

```ts
new McpServer({
  name: "skill-router-mcp",
  version: packageVersion,
})
```

SDK 负责：

- initialization / protocol negotiation。
- server info/instructions。
- `tools/list` / `tools/call`。
- schemas / results / errors / annotations。
- Streamable HTTP transport 能力。

Nitro endpoint 不手写 JSON-RPC lifecycle。

---

# 3. Protocol Version Policy

不要在业务代码硬编码一个 OpenAI 尚未明确支持的未来 MCP revision。

实际 protocol version 由：

```text
ChatGPT/MCP Client
  ↓
initialization / negotiation
  ↓
@modelcontextprotocol/sdk
```

处理。

升级 protocol/SDK major 的门槛：

```text
OpenAI 当前官方文档支持
+
MCP Inspector 通过
+
ChatGPT Web Developer Mode 真实验收通过
```

---

# 4. Transport

生产使用：

```text
Streamable HTTP
```

推荐 endpoint：

```text
POST /mcp
```

不使用 stdio 作为 ChatGPT Web 远程 transport，也不自定义 MCP-over-REST 协议。

---

# 5. 请求链路

```text
ChatGPT Web
  ↓
Streamable HTTP
  ↓
Cloudflare Worker
  ↓
Nitro v3 adapter
  ↓
@modelcontextprotocol/sdk / McpServer
  ↓
Tool Definitions
  ↓
Skill Services
  ↓
GitHub exact-commit SourceSnapshot
```

---

# 6. Nitro 边界

MCP endpoint 只负责：

- Request/Response adapter。
- runtime bindings 提取。
- 调 MCP SDK transport/server。

禁止：

- 手写 JSON-RPC method router。
- handler 内写 Skill search/load 业务。
- handler 直接拼 GitHub Authorization。

---

# 7. Server Identity / Version

唯一来源：

```text
MCP package package.json.version
```

Server identity：

```text
name = skill-router-mcp
version = package.json.version
```

初始化/server info 供标准 MCP client 识别该版本。

该 version 不等于 Worker Version ID、Skill version 或 Skill source commit。

---

# 8. 单一 Tool Definitions Registry

第一版：

```text
get_server_info
list_skills
search_skills
load_skill
```

所有工具从统一：

```text
toolDefinitions
```

注册。

它同时驱动：

- `server.registerTool(...)`。
- 标准 `tools/list` 结果。
- `get_server_info.tools`。
- tests。

---

# 9. `get_server_info`

用途：让 ChatGPT 能直接回答：

```text
当前 MCP 是什么版本？
当前 Worker 部署是哪一版？
有哪些工具？
```

输入：

```json
{}
```

建议结构：

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

可以返回当前 SDK/protocol diagnostics，但不要硬编码尚未被 ChatGPT compatibility profile 证实的未来 protocol revision。

`tools[]` 必须与标准 tool registry 同源。

---

# 10. `list_skills`

```text
resolve configured ref -> exact SHA
  ↓
registry @ SHA
  ↓
return summaries + sourceCommitSha
```

summary：

- id。
- plugin。
- name。
- version。
- description。

---

# 11. `search_skills`

输入：

```json
{"query":"Nitro API development"}
```

第一版只搜索 Registry v1：

```text
id / name / description / plugin
```

返回候选 + `sourceCommitSha`。

不逐个读取所有 Skill 正文，不使用 vector DB。

---

# 12. `load_skill`

输入：

```json
{
  "skillId": "nitro-api-development",
  "sourceCommitSha": "optional-exact-sha"
}
```

## 无 pin

解析当前 `GITHUB_REF` 最新 HEAD 一次。

## 有 pin

使用 configured owner/repo 内的 exact SHA，不重新解析 mutable branch。

读取：

```text
registry @ SHA
  ↓
entry
  ↓
SKILL.md @ same SHA
```

返回 metadata/content/sourceCommitSha。

---

# 13. 高频更新 Snapshot

```text
search @ A
push B
load(pin=A) -> A
load(no pin) -> B
```

Snapshot pin 复用 Git commit SHA；无需 KV/DO/session token store。

---

# 14. 深层文件

Registry v1 不枚举 references/templates/examples。

加载选中 Skill 后，根据实际需要读取 related files：

- 同一 sourceCommitSha。
- 限制在允许 Skill 目录。
- 不默认递归整个仓库。

---

# 15. Tool Annotation

按 OpenAI 当前官方 MCP 文档准确使用：

```text
readOnlyHint
destructiveHint
openWorldHint
```

Skill Router 当前核心工具均只读；`openWorldHint` 按读取外部 GitHub 数据的实际语义设置，不机械复制。

---

# 16. ChatGPT Tool Metadata Snapshot

Worker endpoint 已升级不代表 ChatGPT 已批准/刷新新 tool schema。

如果仅内部实现变化且 tool contract 不变：

```text
Worker version deploy + production smoke
```

如果 tool name/schema/description/annotation 变化：

```text
Worker candidate
  ↓
MCP Inspector + Developer Mode test
  ↓
ChatGPT refresh/rescan connection tools
  ↓
rerun evaluation
  ↓
workspace review/publish when applicable
```

Skill-only Git data 更新不需要 ChatGPT tool rescan。

---

# 17. Error Contract

至少区分：

```text
REGISTRY_NOT_FOUND
REGISTRY_SCHEMA_UNSUPPORTED
SKILL_NOT_FOUND
REGISTRY_ENTRY_INVALID
SOURCE_COMMIT_INVALID
SOURCE_READ_FAILED
GITHUB_RATE_LIMITED
GITHUB_AUTH_FAILED
```

绝不返回 Token/auth header/internal stack。

---

# 18. 验收标准

- [ ] SDK 与 OpenAI 当前 ChatGPT MCP 官方指引一致。
- [ ] initialization / server identity 正常。
- [ ] Streamable HTTP 正常。
- [ ] `tools/list` 返回完整当前 tool catalog。
- [ ] `get_server_info` 返回安全版本/部署/tool metadata。
- [ ] list/search 返回 sourceCommitSha。
- [ ] load latest/pin 正常。
- [ ] Skill 单调用所有读取同 SHA。
- [ ] Tool contract 更新有 ChatGPT refresh/rescan gate。
- [ ] Skill-only 更新不要求 Worker deploy/ChatGPT rescan。
