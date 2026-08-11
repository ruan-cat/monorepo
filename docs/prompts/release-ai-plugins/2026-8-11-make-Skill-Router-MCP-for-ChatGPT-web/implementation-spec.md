# Skill Router MCP Server 生产实现规格

## 文档定位

本文用于指导独立 AI Agent 实现生产级 Remote MCP Server。

目标：

```text
Cloudflare Worker
+
Nitro v3 Runtime
+
MCP TypeScript SDK
+
GitHub exact-commit Skill Source
+
Skill Router
```

真实工作负载：Skill 数量中等但更新频率高。第一版优先保证 freshness、版本一致性、部署简单、调试可复现，并避免为了“未来规模”提前增加复杂存储/搜索系统。

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
| Discovery Index | `ai-plugins/skill-registry.json` |
| Persistent Cloudflare storage | MVP 不需要 |
| Search | Registry 内存关键词/token matching |
| Optional cache | 仅在真实指标需要时评估，key 必须包含 commit SHA |

---

# 2. 依赖管理原则

`package.json` 直接管理：

```text
nitro
@modelcontextprotocol/sdk
```

H3 由 Nitro v3 依赖树/lockfile 管理，不单独 pin 主版本。

Wrangler 属于部署工具依赖。

必须提交 package-manager lockfile。

---

# 3. MCP 实现层

禁止手写：

- JSON-RPC lifecycle。
- initialize/tools/list/tools/call。
- MCP transport。

必须使用 MCP TypeScript SDK + `McpServer` + Streamable HTTP transport。

Nitro endpoint 只做最薄 Web Runtime adapter。

---

# 4. Source Snapshot 契约

默认未 pin tool call：

```text
GITHUB_REF
  ↓
resolve exact commit SHA once
  ↓
SourceSnapshot
  ↓
all reads use commitSha
```

领域类型：

```ts
interface SourceSnapshot {
  repository: string
  ref?: string
  commitSha: string
}
```

规则：

1. 每个未 pin tool call 只解析一次 ref。
2. 后续读取不再使用 mutable branch name。
3. list/search/load 返回 `sourceCommitSha`。
4. 测试覆盖 branch 在调用途中推进时不跨 commit 混读。

---

# 5. 跨 Tool Call 的 Optional Snapshot Pin

高频更新可能发生：

```text
search @ commit A
push commit B
load @ latest B
```

第一版不增加 server session，而让 discovery tool result 返回：

```text
sourceCommitSha=A
```

`load_skill` / 可选 metadata tool 接受：

```json
{
  "skillId": "...",
  "sourceCommitSha": "A"
}
```

规则：

- 不传：解析最新 `GITHUB_REF`。
- 传入：在配置好的同一 owner/repo 中读取 exact SHA。
- input 不允许覆盖 owner/repo。

Git commit SHA 本身就是不可变 snapshot identifier，不需要 KV/DO/session token store。

---

# 6. 项目结构

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

实际路径可按仓库 Nitro 约定调整，但职责不可混淆。

---

# 7. GitHub Repository Adapter

负责：

- 使用 `GITHUB_OWNER/GITHUB_REPO/GITHUB_REF`。
- 使用 `GITHUB_TOKEN` 只读访问。
- resolve ref -> exact SHA。
- 按 SHA 读取 registry。
- 按 SHA 读取选中 Skill / 关联文件。
- 转换 GitHub error 为领域错误。

只有这一层接触 Token。

禁止 tool/service 拼 Authorization header 或用 branch 分别读 registry/skill。

---

# 8. Skill Registry

推荐：

```text
ai-plugins/skill-registry.json
```

定位：低 churn discovery manifest，不是数据库。

v1 entry 仅包含：

```text
id
plugin
name
description
version
entry
```

不包含 references/templates/examples 文件列表。

运行时：

```text
registry @ SourceSnapshot SHA
  ↓
list/search
  ↓
entry
  ↓
selected SKILL.md @ same SHA
```

详细见 `skill-registry-schema.md`。

---

# 9. 深层文件读取

references/templates/examples 不在 Registry v1 中建立第二份目录索引。

Cloud MCP：

1. 先读取已选 `SKILL.md`。
2. 根据 Skill 中明确的 repo-relative 引用按需读取。
3. 限制在已选 Skill 目录/允许范围。
4. 全部使用同一 exact commit SHA。

不要默认加载整个 Skill 目录到上下文。

---

# 10. 搜索策略

对中等 Skill 数量第一版使用 Registry 内存搜索：

```text
id + name + description + plugin
```

不需要：

- vector DB。
- embedding pipeline。
- D1 搜索表。
- KV search index。

如果以后真实查询样本证明搜索质量不足，再扩展权威 metadata，而不是 generator 猜关键词。

---

# 11. Cloudflare 存储政策

MVP：

```text
KV: 不需要
R2: 不需要
D1: 不需要
Durable Objects: 不需要
```

未来若指标证明需要 cache，只允许 immutable commit-addressed key：

```text
registry:{commitSha}
skill:{commitSha}:{skillId}
```

禁止 `skill:{id}` / `registry:current` 作为 freshness 真源。

---

# 12. Wrangler 配置

第一版：

```toml
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

Secret：

```bash
wrangler secret put GITHUB_TOKEN
```

不要求 storage bindings。

---

# 13. 高频维护/轻量增长原则

发布侧：

```text
many Skill changes
 -> one release
 -> one deterministic registry generation
 -> one Git commit
```

运行时：

```text
one tool call
 -> one snapshot
 -> one registry read
 -> selected Skill only
```

不要把“更新频率高”误解成“数据规模巨大”。

详细见：

```text
high-frequency-skill-churn-strategy.md
../2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/high-frequency-maintenance-and-growth-strategy.md
```

---

# 14. 轻量观测指标

第一版只要求能够通过日志/测试测量：

- sourceCommitSha。
- registry byte size。
- Skill count。
- GitHub requests per tool call。
- tool P50/P95 latency。
- GitHub rate-limit/auth/failure。

不要求额外 observability database。

这些指标用于决定以后是否需要 cache/search 升级。

---

# 15. AI Agent 实施顺序

1. 初始化 Nitro v3 Worker。
2. 配置最小 Wrangler vars/secret。
3. 接入 MCP SDK + Streamable HTTP。
4. 创建 `McpServer` 与只读 tools。
5. 实现 GitHub Repository Adapter。
6. 实现 latest/pinned `SourceSnapshot`。
7. 实现 registry list/search。
8. 实现 exact-SHA `load_skill`。
9. 实现深层文件按需读取边界。
10. 增加 freshness/snapshot-pin/registry/protocol tests。
11. MCP Inspector 验证。
12. ChatGPT Web Developer Mode 验收。
13. 最后根据真实指标决定是否需要缓存/搜索升级。

---

# 16. Definition of Done

- [ ] ChatGPT Web 可连接。
- [ ] initialize/tools/list/tools/call 正常。
- [ ] list/search 返回 sourceCommitSha。
- [ ] load_skill 支持可选 sourceCommitSha pin。
- [ ] 未 pin 新请求能看到最新 HEAD。
- [ ] pinned load 可复现 discovery snapshot。
- [ ] 单 tool call 所有 Skill 数据来自同一 SHA。
- [ ] Registry v1 minimal/low-churn。
- [ ] 深层文件按需同 SHA 读取。
- [ ] Worker 无 KV/R2 也完整运行。
- [ ] GitHub Token 不泄露。
- [ ] 没有 vector DB/增量 registry state/server session 过度设计。
