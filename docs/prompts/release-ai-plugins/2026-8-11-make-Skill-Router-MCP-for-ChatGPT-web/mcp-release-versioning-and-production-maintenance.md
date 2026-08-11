# Skill Router MCP 发版、版本查询与生产维护规范

## 1. 文档目的

本文定义 `Skill-Router-MCP` 上线 Cloudflare Workers 后如何长期维护：

- Skill 内容高频发布。
- MCP Server Runtime/code/config 发版。
- MCP 应用 SemVer。
- Cloudflare Worker Version 上传、预览、上线、查询和回滚。
- ChatGPT Developer Mode / Workspace App 的工具定义刷新。
- MCP 服务版本查询。
- 当前完整工具列表查询。

核心原则：

> **Skill 内容发布、Worker Runtime 发布、ChatGPT Tool Metadata 发布是三个不同 freshness domain。**

流水线可以把日常维护自动化得很轻，但不能把三者误认为“git push 后一定同时自动更新”。

---

# 2. 三条维护链

## 2.1 Skill Content Lane

```text
修改一个/多个 ai-plugins Skill
        ↓
release-ai-plugins
        ↓
Skill version / manifest / CHANGELOG / registry
        ↓
Git commit / push
        ↓
下一次 unpinned MCP Skill call 解析最新 HEAD
```

不需要：

- Worker rebuild/deploy。
- KV/R2 sync。
- ChatGPT tool rescan。

原因：稳定 MCP tools 的 schema 没变，只是它们读取的 Git data snapshot 更新。

## 2.2 MCP Runtime Lane

适用：

- tool handler 内部实现。
- Nitro / MCP SDK / Wrangler 依赖。
- GitHub Repository Adapter。
- SourceSnapshot。
- `get_server_info` 实现。
- routes/bindings/security/observability。

```text
Runtime change
  ↓
bump MCP application SemVer
  ↓
tests
  ↓
Nitro production build
  ↓
Worker version upload
  ↓
Preview/Staging smoke
  ↓
exact version production promotion
  ↓
Production smoke
```

## 2.3 ChatGPT Tool Metadata Lane

只有当：

```text
tool name/title/description
input/output schema
annotations
server/plugin metadata
```

发生变化时，除了 Worker 发布，还需要让 ChatGPT **重新扫描/刷新连接中的工具定义**。

OpenAI 当前文档明确要求 metadata 变化后刷新 developer-mode connection 并重新运行评估；Workspace 已批准应用还存在管理员审核/刷新工具 snapshot 的独立生命周期。

---

# 3. OpenAI ChatGPT Compatibility Profile

生产 MCP 的首要目标是 ChatGPT Web 真实兼容。

当前 OpenAI 官方 `Build an MCP server` 指引明确使用：

```text
@modelcontextprotocol/sdk
zod
McpServer
Streamable HTTP
initialization
```

因此本项目生产线以：

```text
@modelcontextprotocol/sdk
```

为当前 compatibility baseline。

不要仅因为 MCP upstream 发布更新的 protocol revision/SDK major 就抢跑切 production。协议/SDK major 迁移必须满足：

```text
OpenAI 当前官方 ChatGPT 文档支持
+
MCP Inspector 通过
+
ChatGPT Web Developer Mode 真实验收通过
```

详细见：

```text
chatgpt-web-mcp-compatibility-profile.md
```

---

# 4. 版本概念必须分离

至少区分：

| 概念                            | 示例                      | 含义                              |
| ------------------------------- | ------------------------- | --------------------------------- |
| MCP Application Version         | `1.4.0`                   | Skill Router Server 自身 SemVer   |
| Negotiated MCP Protocol Version | initialization 结果       | SDK/客户端实际协商版本            |
| Worker Version ID               | Cloudflare ID             | 不可变 Worker version             |
| Worker Version Tag              | `skill-router-mcp-v1.4.0` | 人类可识别 deployment tag         |
| Worker Build Git SHA            | `abc123...`               | 生成 Worker bundle 的 code commit |
| Skill Source Commit             | `def456...`               | 本次 Skill 读取 snapshot          |
| Skill Version                   | `0.13.7`                  | 单 Skill `metadata.version`       |
| Registry Schema Version         | `1`                       | `skill-registry.json` schema      |

Worker Build Git SHA 与 Skill Source Commit 通常可以不同：

```text
Worker code remains at commit X
Skills move A -> B -> C
latest Skill call reads C
```

这是正常设计，不代表 Worker“过期”。

---

# 5. MCP Application SemVer

MCP package 必须有自己的：

```text
package.json.version
```

作为 server application version 唯一来源。

## PATCH

- bug fix。
- latency/performance。
- GitHub adapter internal fix。
- logging/diagnostics。
- tool public contract 不变。

## MINOR

- 向后兼容新增 tool。
- 新增 optional input/output。
- 新增只读诊断能力。

## MAJOR

- 删除/重命名 tool。
- 新 required input。
- 不兼容 response semantics/schema。

Skill version 更新不 bump MCP Server version。

---

# 6. MCP Server Identity

创建：

```ts
new McpServer({
	name: "skill-router-mcp",
	version: packageVersion,
});
```

稳定 name/version 是标准 MCP 客户端可以在 initialization/server info 中识别的服务身份。

版本值必须来自 package.json，不维护第二份手写常量。

---

# 7. 标准工具目录

标准 MCP 工具目录能力：

```text
tools/list
```

第一版核心 tools：

```text
get_server_info
list_skills
search_skills
load_skill
```

统一：

```text
toolDefinitions
```

驱动：

- `server.registerTool(...)`。
- standard tool catalog。
- `get_server_info.tools`。
- tests。

禁止维护多个手写 tool name 数组。

---

# 8. `get_server_info` 版本查询工具

目的：让用户直接问 ChatGPT：

```text
这个 MCP 是什么版本？
Cloudflare 当前部署的是哪一版？
你有哪些工具？
```

建议输出：

```json
{
	"server": {
		"name": "skill-router-mcp",
		"version": "1.4.0",
		"buildGitSha": "abc123"
	},
	"deployment": {
		"workerVersionId": "...",
		"workerVersionTag": "skill-router-mcp-v1.4.0",
		"workerVersionTimestamp": "..."
	},
	"skillSource": {
		"repository": "ruan-cat/monorepo",
		"ref": "dev"
	},
	"registrySchemaVersion": "1",
	"tools": [
		{ "name": "get_server_info", "description": "..." },
		{ "name": "list_skills", "description": "..." },
		{ "name": "search_skills", "description": "..." },
		{ "name": "load_skill", "description": "..." }
	]
}
```

可以额外报告 SDK/negotiated protocol diagnostics，但不要硬编码一个尚未被 ChatGPT 当前 compatibility profile 确认的未来 protocol revision。

`get_server_info` 默认不请求 GitHub HEAD。Skill 精确 source version 由 discovery/load tools 返回 `sourceCommitSha`。

---

# 9. Cloudflare Version Metadata Binding

Wrangler：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

运行时可读：

```text
id
tag
timestamp
```

用于：

- `get_server_info`。
- `/health`。
- logs。
- production smoke。
- rollback diagnosis。

Worker version ID 不等于 MCP SemVer。

---

# 10. Worker Build Git SHA

Worker bundle 应注入：

```text
buildGitSha
```

来源：

- GitHub Actions `GITHUB_SHA`；或
- build-time `git rev-parse HEAD`。

运行时不执行 Git 命令、不依赖 filesystem 猜 build version。

---

# 11. 推荐 Cloudflare 发布方式

`wrangler deploy` 默认会创建版本并立即部署 100% 流量。

生产更推荐把版本上传与上线拆开：

```text
CI gates
  ↓
wrangler versions upload
  ↓
immutable Worker Version + Preview URL
  ↓
Preview/Staging smoke
  ↓
wrangler versions deploy exact-version @ 100%
  ↓
Production smoke
```

Version tag：

```text
skill-router-mcp-vX.Y.Z
```

Version message：

```text
build Git SHA + release summary
```

实际 Wrangler 参数以实施时当前 CLI 为准。

---

# 12. 为什么 Tool Contract 变化默认原子上线

如果 gradual split 的两个 Worker 版本暴露不同：

```text
tools/list
input schemas
annotations
```

客户端可能在不同请求遇到 version skew。

因此：

- tool schema/metadata 变化：Preview/Staging 后默认 100% 原子 promote。
- 完全 backward-compatible internal change：才考虑 gradual rollout。

第一版不要为了复杂度而强制流量切分。

---

# 13. Worker 自动部署 Trigger Boundary

Skill-only：

```text
ai-plugins/**
```

不应触发 Worker redeploy。

MCP runtime/config/build input 才触发。

如果用 Cloudflare Git Integration，配置 Build Watch Paths；如果用 GitHub Actions，配置 workflow `paths`/`paths-ignore`。

推荐一个 production deployment authority：

```text
GitHub Actions + package-local Wrangler
```

因为我们有测试、version upload、preview smoke、promotion 和 production smoke 多层 gate。

如果改用 Cloudflare Git Integration，就不要同时让 GitHub Actions 自动部署同一 production Worker。

---

# 14. ChatGPT Tool Metadata 更新门禁

这是 Cloudflare CI 不能替你自动完成的部分。

## Runtime-only PATCH，Tool Contract 不变

```text
Worker deploy
  ↓
Production smoke
```

通常不要求重新创建 tool schema；同一个 ChatGPT connection 会继续调用稳定 endpoint。

## Tool metadata/schema 变化

```text
Worker candidate deploy
  ↓
MCP Inspector / ChatGPT Developer Mode test
  ↓
refresh/rescan ChatGPT connection tools
  ↓
review diff / rerun evaluation
  ↓
Workspace approval/publish if applicable
```

OpenAI 当前产品对已发布 Workspace MCP app 使用已批准的 tool/input snapshot，因此 server 更新不会自动获得新工具权限。

Business / Enterprise/Edu 的具体更新 UI/权限可能变化，每次 production tool-contract release 都必须核对当前 OpenAI Help Center。

---

# 15. 为什么 Skill 高频更新无需 ChatGPT Tool Refresh

我们的 Skill 通过稳定 tools 动态获取：

```text
list_skills
search_skills
load_skill
```

修改：

```text
SKILL.md
references/templates/examples
skill-registry data/version
```

不改变 tool schema。

因此：

```text
Skill push
  ↓
new Git HEAD
  ↓
next unpinned MCP call reads new snapshot
```

无需：

- Worker redeploy。
- ChatGPT tool rescan。
- Workspace app republish。

这正是当前架构针对高频 Skill 维护的核心优势。

---

# 16. OpenAI Skills Import Extension 不是本项目主发布路径

OpenAI 当前也提供受限、静态的 MCP Skills import extension；它在 Scan Tools / submission 时导入 Skill snapshot，并要求 Skill 改变后重新 Scan Tools / submit。

这不适合我们：

```text
中等数量 Skills
+
高频更新
+
live Git snapshot
```

因此继续使用 custom live Skill Router tools；不要把高频 Skill 维护重新绑定到 ChatGPT submission snapshot。

---

# 17. Production “及时更新”如何确认

不能只看：

```text
git push 成功
CI 绿色
wrangler exit 0
```

MCP Runtime release 完成必须确认：

```text
get_server_info.server.version
get_server_info.deployment.workerVersionId/tag
get_server_info.server.buildGitSha
tools/list
Cloudflare active deployment
Production smoke
```

如果 tool contract 变化，再确认 ChatGPT side tool refresh/approval 完成。

---

# 18. 回滚

## Runtime bug

```text
Cloudflare Worker rollback stable version
```

然后 health / initialization / tools/list / get_server_info smoke。

## Skill content bug

```text
Git revert/fix Skill commit
  ↓
new source HEAD
```

不回滚 Worker。

## Bad tool-contract release

除了 Worker rollback，还要确认 ChatGPT 当前批准/缓存的 tool metadata 与回滚版本兼容；必要时重新 refresh/restore tool snapshot。

---

# 19. Production Release Definition of Done

Runtime-only release：

```text
1. MCP SemVer bump
2. tests green
3. production build green
4. immutable Worker version uploaded
5. Preview/Staging smoke green
6. exact Worker version promoted
7. Production smoke green
8. get_server_info reports expected MCP/Worker/build version
9. tools/list matches expected toolDefinitions
10. rollback target known
```

Tool-contract release 额外：

```text
11. ChatGPT Developer Mode connection refreshed/rescanned
12. evaluation/use cases rerun
13. Workspace admin review/publish completed when applicable
```

---

# 20. 最终维护模型

```text
Skill Content
  ai-plugins change
    ↓
  Git release
    ↓
  next live tool call sees new snapshot
  (no Worker deploy / no ChatGPT tool refresh)

MCP Runtime Internal
  code change
    ↓
  SemVer + Worker versioned deploy
    ↓
  smoke + get_server_info verification

MCP Tool Contract
  schema/metadata change
    ↓
  Worker versioned deploy
    ↓
  ChatGPT refresh/rescan/review
    ↓
  end-user availability
```

目标：**Skill 发布轻、Runtime 发版可审计、Tool Contract 更新有 ChatGPT 侧门禁、线上版本和工具目录随时可查询。**
