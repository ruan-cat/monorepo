# Skill Router MCP Server 架构设计

## 文档定位

本文定义生产级 Remote MCP Server 最终主架构。

真实工作负载：Skill 数量中等，但更新频率高。架构优先保证 **freshness、exact-commit 一致性、低维护成本和简单调试**，不提前为假设中的巨大规模建设数据库/多级缓存。

核心原则：

- GitHub `ai-plugins` 是唯一 Skill Source of Truth。
- 未 pin tool call 将 `GITHUB_REF` 解析为 exact Git commit SHA。
- 单个 tool call 的 registry/Skill/关联文件读取固定在同一 SHA。
- discovery 返回 `sourceCommitSha`；后续 `load_skill` 可选 pin 该 SHA。
- `skill-registry.json` 是 minimal/low-churn discovery manifest。
- references/templates/examples 不进入 Registry v1 文件索引。
- KV/R2/D1/DO/vector DB 不属于第一版必需架构。
- MCP SDK 管协议；Nitro v3 管 Runtime；H3 由 Nitro 管理。

---

# 1. 总体架构

```text
ChatGPT Web Developer Mode
          |
Remote MCP / Streamable HTTP
          |
Cloudflare Worker
          |
Nitro v3 Runtime
          |
MCP TypeScript SDK / McpServer
          |
Skill Router Tools
          |
Skill Services
          |
GitHub Skill Repository Adapter
          |
          +---- latest: GITHUB_REF -> exact commit SHA
          |
          +---- pinned: sourceCommitSha -> exact snapshot
          |
          +---- skill-registry.json @ SHA
          |
          +---- selected SKILL.md @ SHA
          |
          +---- related files on demand @ same SHA
          v
ruan-cat/monorepo ai-plugins
```

第一版没有 mandatory：

```text
Cloudflare KV
Cloudflare R2
D1
Durable Objects
vector database
snapshot session store
```

---

# 2. SourceSnapshot 一致性模型

## Latest Snapshot

```text
GITHUB_REF=dev
  ↓
resolve once
  ↓
commit SHA=A
  ↓
all reads in this call use A
```

## Pinned Snapshot

Discovery result 返回：

```text
sourceCommitSha=A
```

后续：

```text
load_skill(skillId, sourceCommitSha=A)
```

直接在配置好的同一 repository 使用 A。

这样：

```text
search @ A
branch moves -> B
pinned load -> A
latest unpinned load -> B
```

不需要 server-side session/state。

---

# 3. Skill Registry 定位

仓库维护：

```text
ai-plugins/skill-registry.json
```

它是机器发现索引，不是事实来源。

Registry v1 仅保存：

```text
id
plugin
name
description
version
entry
```

不保存：

```text
references
templates
examples
content copy
sourceCommitSha
cache metadata
```

原因：高频维护时深层文件变化很频繁，而 discovery/search 不需要它们；让 registry 保持小而稳定可以减少 diff/CI/生成成本。

---

# 4. 高频维护数据流

发布侧：

```text
many Skill changes
  ↓
release-ai-plugins 完成全部版本/发布状态
  ↓
one deterministic registry generation
  ↓
one Git commit
```

运行时：

```text
one tool call
  ↓
one SourceSnapshot
  ↓
one registry read
  ↓
selected Skill only
```

因此“更新频率高”不会转化为 Cloudflare 同步复杂度。

---

# 5. 深层文件策略

Cloud MCP 先读取 `SKILL.md @ SHA`。

若 Skill 明确引用 reference/template/example：

- 仅在实际需要时读取。
- path 限制在已选 Skill 的允许范围。
- 全部继续使用同一 SHA。
- 不默认递归加载整个 Skill 目录。

这既控制 GitHub 请求，也控制 ChatGPT context 大小。

---

# 6. 搜索模型

中等 Skill 数量下：

```text
one registry
  ↓
in-memory matching on id/name/description/plugin
```

第一版不需要：

- embedding。
- vector DB。
- 搜索数据库。
- AI 自动 keywords/tags。

只有真实查询样本证明简单搜索不足时再扩展权威 metadata。

---

# 7. 缓存策略

## MVP

无持久缓存依赖。

## 未来

只有指标证明重复 GitHub 读取成为瓶颈时，才评估 immutable commit-addressed cache：

```text
registry:{commitSha}
skill:{commitSha}:{skillId}
```

新 commit 自然使用新 key，不设计 mutable cache purge 系统。

Release side 永远不感知 cache。

---

# 8. 依赖边界

## Nitro v3

- Runtime abstraction/build/routes/Cloudflare adapter。

## H3

- Nitro-managed HTTP runtime layer，不独立 pin。

## MCP TypeScript SDK

- initialize/capability/tools/Streamable HTTP protocol lifecycle。

## GitHub Repository Adapter

- 只读 credential。
- ref -> SHA。
- pinned exact SHA。
- registry/Skill/related-file reads。
- GitHub errors -> domain errors。

只有这一层接触 GitHub Token。

---

# 9. 轻量观测

第一版只要求能够测量：

```text
skill count
registry bytes
GitHub requests/tool call
ref resolve latency
registry fetch latency
selected Skill fetch latency
tool P50/P95
rate-limit/auth/errors
```

不要求额外 metrics database。

这些数据决定未来是否需要 cache/search 升级。

---

# 10. 演进顺序

```text
Level 0
Git exact commit + small registry + in-memory search

Level 1
request dedupe / conditional request / parser/search optimization

Level 2
immutable commit-addressed cache（仅真实指标需要）

Level 3
更复杂搜索/存储（仅真实规模/质量问题出现）
```

禁止跳级。

---

# 11. Skill Router 职责

负责：

- discovery/search/load。
- metadata/version/source commit reporting。
- latest/pinned SourceSnapshot。
- 已选 Skill 关联文件按需读取。

不负责：

- GitHub 写操作。
- Shell/Docker/CI。
- Cloudflare storage sync。
- vector index。
- conversation snapshot database。

---

# 12. 最终优先级

```text
freshness / correctness
>
protocol compatibility
>
simple deployment/debugging
>
measured optimization
```

详细维护策略见：

```text
high-frequency-skill-churn-strategy.md
../2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/high-frequency-maintenance-and-growth-strategy.md
```
