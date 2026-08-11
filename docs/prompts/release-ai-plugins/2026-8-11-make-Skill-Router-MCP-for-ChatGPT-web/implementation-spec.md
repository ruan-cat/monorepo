# Skill Router MCP Server 生产实现规格

## 文档定位

本文档用于指导独立 AI Agent 实现生产级 Remote MCP Server。

目标：

```text
Cloudflare Worker
+
Nitro v3 Runtime
+
MCP TypeScript SDK
+
GitHub commit-SHA Skill Source
+
Skill Router
```

第一版优先保证 skills 高频更新时的最新可见性、单请求版本一致性、部署简单和调试可复现。

---

# 1. 核心技术栈

| 层 | 技术 |
| --- | --- |
| Serverless Runtime | Cloudflare Workers |
| Application Runtime | Nitro v3 |
| HTTP Runtime Layer | Nitro 管理的 H3 Runtime Layer |
| MCP Protocol | `@modelcontextprotocol/sdk` |
| Transport | Streamable HTTP |
| Skill Source of Truth | GitHub `ai-plugins` |
| Version boundary | Git commit SHA |
| Persistent Cloudflare storage | MVP 不需要 |
| Optional cache | 仅在指标需要时评估，key 必须包含 commit SHA |

禁止把 KV、R2、D1 或 Durable Objects 当成第一版必需组件。

---

# 2. 依赖管理原则

`package.json` 直接管理：

```text
nitro
@modelcontextprotocol/sdk
```

H3 由 Nitro v3 依赖树和 lockfile 管理，不手动 pin 独立 H3 主版本。

Wrangler 属于部署工具依赖。

必须提交 package-manager lockfile。

---

# 3. MCP 实现层

禁止手写：

- JSON-RPC lifecycle
- initialize
- tools/list
- tools/call
- MCP transport

必须使用：

```text
MCP TypeScript SDK
+
McpServer
+
Streamable HTTP Transport
```

Nitro endpoint 只做 Web Runtime 与 MCP SDK transport 的最薄适配。

---

# 4. Source Snapshot 契约

任何读取 Skill 的 tool call 必须按以下顺序执行：

```text
GITHUB_REF (例如 dev)
      |
      v
resolve to exact commit SHA
      |
      v
SourceSnapshot
      |
      +---- registry read @ SHA
      +---- SKILL.md read @ SHA
      +---- references read @ SHA
```

建议领域类型：

```ts
interface SourceSnapshot {
  repository: string
  ref: string
  commitSha: string
}
```

规则：

1. 每个 tool call 只解析一次 ref。
2. 后续所有读取使用 `commitSha`，不再使用 mutable branch name。
3. 返回结果包含 `sourceCommitSha`。
4. 测试必须覆盖 branch 在调用途中推进时不会发生跨 commit 混读。

---

# 5. 项目结构

概念结构：

```text
skill-router-mcp/
├── mcp/
│   ├── server.ts
│   └── tools/
│       ├── list-skills.ts
│       ├── search-skills.ts
│       └── load-skill.ts
├── services/
│   ├── skill-router.ts
│   └── source-snapshot.ts
├── repositories/
│   └── github-skill-source.ts
├── server/api/
│   ├── mcp.post.ts
│   └── health.get.ts
├── nitro.config.ts
└── wrangler.toml
```

实际路径可按仓库 Nitro 约定调整，但职责边界不可改变。

---

# 6. GitHub Skill Repository Adapter

该层负责：

- 使用 `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_REF`
- 使用 `GITHUB_TOKEN` 执行只读请求
- 将 branch/tag/ref 解析成 exact commit SHA
- 读取 `ai-plugins/skill-registry.json`（存在时）
- 按 exact SHA 读取 Skill 文件
- 将 GitHub 错误转换为领域错误

只有这一层接触 `GITHUB_TOKEN`。

禁止：

- MCP tool handler 直接调用 GitHub
- Service 拼接 Authorization header
- 使用 branch name 分别读取 registry 与 skill 文件

---

# 7. Skill Registry

推荐仓库级生成文件：

```text
ai-plugins/skill-registry.json
```

定位：机器可发现索引，不是数据库，不是 Source of Truth。

运行时：

```text
SourceSnapshot.commitSha
        |
        v
skill-registry.json @ commitSha
        |
        v
search/list
```

`load_skill` 再根据 registry 的 entry path 从同一个 commit SHA 读取真实文件。

Registry 应由发布/校验工具确定性生成，详细规则见 `skill-registry-schema.md`。

---

# 8. Cloudflare 存储政策

MVP：

```text
KV: 不需要
R2: 不需要
D1: 不需要
Durable Objects: 不需要
```

不要为了“Cloudflare 原生”而增加 binding。

如果未来性能数据显示需要缓存：

```text
registry:{commitSha}
skill:{commitSha}:{skillId}
```

缓存必须是 commit-addressed；禁止以 `skill:{id}` 这种 mutable key 作为 freshness 机制。

---

# 9. Wrangler 配置

第一版只需要公开 vars 和 GitHub Secret。

示意：

```toml
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

敏感值：

```bash
wrangler secret put GITHUB_TOKEN
```

第一版 `wrangler.toml` 不要求 `kv_namespaces`、R2 bucket 或其他存储 binding。

---

# 10. AI Agent 实施顺序

1. 初始化 Nitro v3 Worker 项目。
2. 配置最小 Wrangler vars / secret 契约。
3. 安装并接入 MCP TypeScript SDK。
4. 创建 `McpServer` factory 和只读 tools。
5. 实现 GitHub Repository Adapter。
6. 实现 `SourceSnapshot`：ref -> exact commit SHA。
7. 实现 registry list/search 与 exact-SHA skill loading。
8. 增加 freshness、一致性、GitHub 错误与协议测试。
9. 使用 MCP Inspector 验证。
10. 使用 ChatGPT Web Developer Mode 做真实验收。

---

# 11. Definition of Done

必须满足：

- ChatGPT Web 可连接 Remote MCP。
- MCP initialize / tools/list / tools/call 正常。
- `search_skills` 与 `load_skill` 可用。
- 同一 tool call 的所有 Skill 数据来自同一 commit SHA。
- 新 push 后下一次新 snapshot 可以解析到新 HEAD。
- 返回结果可报告 `sourceCommitSha`。
- Worker 部署不依赖 KV/R2。
- GitHub Token 不泄露。
- 无 Node Server 专属实现。
