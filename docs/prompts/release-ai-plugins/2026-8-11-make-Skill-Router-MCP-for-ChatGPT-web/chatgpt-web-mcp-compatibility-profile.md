# ChatGPT Web MCP Compatibility Profile

## 1. 文档目的

本项目的首要产品目标不是“实现 MCP 上游最新草案/最新 revision”，而是：

> **稳定、真实地被 ChatGPT Web Developer Mode / Plugins 当前支持的 MCP 客户端连接和调用。**

因此必须把：

```text
MCP upstream 最新协议能力
```

与：

```text
OpenAI ChatGPT 当前公开支持/推荐的 MCP 实现方式
```

分开处理。

生产基线永远优先后者。

---

# 2. 当前 OpenAI 官方 Compatibility Baseline

截至本实施规格冻结时，OpenAI 官方 `Build an MCP server` 文档仍明确推荐 TypeScript：

```text
@modelcontextprotocol/sdk
```

并使用：

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
```

构建带稳定：

```text
name
version
```

的 MCP Server。

OpenAI 官方本地测试流程仍要求 MCP Inspector 验证：

```text
initialization
server instructions
advertised tool list
tool calls
schemas/results/errors/annotations
```

生产 endpoint 继续使用：

```text
Streamable HTTP
```

通常部署于：

```text
/mcp
```

因此 `Skill-Router-MCP` 当前生产实现必须遵循这一兼容基线。

---

# 3. SDK 决策

当前生产直接依赖：

```text
@modelcontextprotocol/sdk
zod
```

而不是因为 MCP upstream 出现新 major SDK/package split，就立即切换：

```text
@modelcontextprotocol/server
@modelcontextprotocol/client
```

除非 OpenAI 当前 ChatGPT MCP 文档已明确采用该新包线，或真实 ChatGPT Developer Mode compatibility test 已证明完整支持。

具体 `@modelcontextprotocol/sdk` minor/patch 仍由实施时：

1. 核对 OpenAI 当前官方文档。
2. 核对 MCP TypeScript SDK 官方兼容说明。
3. 运行 MCP Inspector。
4. 运行 ChatGPT Web Developer Mode acceptance。
5. 用 `pnpm-lock.yaml` 固化。

---

# 4. Protocol Version 不硬编码“未来版本”

本项目不把某个比 OpenAI 当前文档更激进的 MCP protocol revision 写死为 production contract。

正确原则：

```text
OpenAI-supported SDK/client
  ↓
initialize / protocol negotiation
  ↓
实际协商的 protocol version
```

如果未来 MCP upstream 发布新 revision，而 OpenAI 文档仍使用旧兼容方式：

```text
不要抢跑迁移 production server
```

可以在兼容测试分支/fixture 中研究，但生产线保持 ChatGPT-compatible。

---

# 5. Server Identity 与版本号

OpenAI 官方要求创建具有稳定 name/version 的 `McpServer`。

本项目：

```text
name = skill-router-mcp
version = MCP package package.json.version
```

MCP application SemVer 是唯一 server version 来源。

初始化结果中的 server info 应能让标准 MCP client/Inspector识别该版本。

另外增加：

```text
get_server_info
```

作为面向 ChatGPT/人的只读诊断工具，返回更完整的：

- MCP application SemVer。
- Worker Version ID/tag/timestamp。
- build Git SHA。
- Skill source repository/ref。
- Registry schema version。
- 当前完整 tool catalog。

`get_server_info` 是诊断 facade，不替代标准 MCP server info / `tools/list`。

---

# 6. 标准 Tool Discovery

当前完整工具列表的 MCP 协议真源：

```text
tools/list
```

当前核心 tools：

```text
get_server_info
list_skills
search_skills
load_skill
```

所有 tool 必须由统一：

```text
toolDefinitions
```

驱动：

- `server.registerTool(...)`。
- tests。
- `get_server_info.tools`。

不要让 README/诊断 tool/SDK registration 各维护一份列表。

---

# 7. Tool Annotation

遵循 OpenAI 当前文档的 MCP annotations：

```text
readOnlyHint
destructiveHint
openWorldHint
```

Skill Router 当前所有核心 tool 均只读。

对读取 GitHub 公开/受控外部数据的语义，`openWorldHint` 应按 OpenAI 当前定义和实际行为准确标注，而不是机械写死。

---

# 8. ChatGPT Tool Snapshot 与 Server Runtime 更新不是一回事

这是长期维护中最重要的 ChatGPT 特有边界。

Cloudflare Worker 更新后，公网 endpoint 的代码可以已经变成新版本；但 ChatGPT 对已连接/已发布应用的 tool metadata/schema 可能仍使用之前审核/扫描的 snapshot。

因此必须区分：

```text
Worker Runtime freshness
```

和：

```text
ChatGPT tool metadata snapshot freshness
```

## 内部实现变更，Tool Contract 不变

例如：

- bug fix。
- GitHub adapter 优化。
- latency 优化。
- `get_server_info` 动态版本值改变。

如果 tool name/input schema/metadata contract 不变，正常 Worker deploy 后客户端继续调用同一 endpoint 即可；仍要执行 production smoke。

## Tool Metadata/Schema 变化

例如：

- 新增 tool。
- 重命名/删除 tool。
- input schema 变化。
- description/annotation 显著变化。

除了 Worker deploy，还必须执行 ChatGPT 侧的：

```text
refresh / rescan / reconnect tool metadata
```

并重新跑 use-case/evaluation acceptance。

OpenAI 当前官方文档明确要求 metadata 变化后刷新 developer-mode connection 并重新评估。

---

# 9. Workspace Published App 更新边界

对于 Workspace 发布后的 MCP app，ChatGPT 会保存被管理员批准的工具/input snapshot。

因此 server 端新增/修改工具**不会仅凭 Cloudflare 自动部署就自动获得工作区批准**。

必须遵循当时 ChatGPT 管理 UI 的更新流程：

- Enterprise/Edu：管理员刷新应用操作/工具定义，审核差异，启用并发布更新。
- Business：如果当时产品仍不支持发布后直接更新，则按官方 UI 要求重新创建/重新发布应用。
- Developer Mode 私下测试：刷新/重建连接以重新扫描 metadata，并重跑验收。

产品 UI/权限会变化，因此实施 Agent 每次设计自动发布时必须重新核对 OpenAI 官方 Help Center，不把当前 UI 永久写死进 Worker 代码。

---

# 10. 为什么 Skill 内容更新不受 Tool Snapshot 影响

我们的 Skill 内容不是通过改变 MCP tool schema 来发布。

稳定工具：

```text
list_skills
search_skills
load_skill
```

内部实时读取：

```text
GitHub exact commit snapshot
```

所以：

```text
更新 SKILL.md / registry data
```

不会改变 tool name/input schema。

只要现有 tool contract 不变，Skill 高频更新不需要：

- Worker redeploy。
- ChatGPT tool rescan。
- Workspace app republish。

这正是将 Skill 内容与 MCP runtime/tool contract 分离的长期维护价值。

---

# 11. OpenAI MCP Skills Extension 不作为本项目主通道

OpenAI 当前也支持一个受限、静态的 MCP Skills import 扩展，但它的语义是：

```text
Scan Tools / submission time
  ↓
静态导入 Skill snapshot
```

而且当前官方限制技能数量/文件大小，并明确 Skill 修改后需要重新 Scan Tools / submit。

这与我们的核心目标：

```text
中等数量 Skills
+
高频更新
+
下一次 tool call 读取最新 Git snapshot
```

不一致。

因此第一版继续使用稳定的：

```text
list_skills
search_skills
load_skill
```

作为 live Skill Router；不要因为 OpenAI 存在 Skills import extension 就把动态 Git source 退化为 submission-time snapshot。

---

# 12. MCP Protocol / SDK 升级门槛

只有同时满足以下条件，才迁移到新的 MCP protocol era / SDK major：

```text
1. OpenAI 当前 ChatGPT 官方文档明确支持/推荐
2. MCP TypeScript SDK stable release
3. Streamable HTTP behavior 对 Cloudflare Worker 可用
4. Node unit / Worker runtime / production harness 全绿
5. MCP Inspector 全绿
6. ChatGPT Web Developer Mode 真实连接全绿
7. 现有 Tool Contract backward compatibility 已评估
8. rollback plan 明确
```

不要仅因为 MCP upstream 发布新 spec 就自动升级 production server。

---

# 13. Definition of Done

- [ ] Production SDK 与 OpenAI 当前官方 ChatGPT MCP 指引一致。
- [ ] `McpServer` name/version 稳定。
- [ ] initialization / Inspector path 可用。
- [ ] Streamable HTTP `/mcp` 可用。
- [ ] `tools/list` 是标准完整工具目录。
- [ ] `get_server_info` 提供额外生产版本诊断。
- [ ] Worker runtime 更新与 ChatGPT tool metadata refresh 分开处理。
- [ ] Skill-only 更新不要求 Worker deploy 或 ChatGPT tool rescan。
- [ ] Tool schema/metadata 变化有 ChatGPT refresh/review gate。
- [ ] 不抢跑 OpenAI 尚未明确支持的新 MCP major protocol。
