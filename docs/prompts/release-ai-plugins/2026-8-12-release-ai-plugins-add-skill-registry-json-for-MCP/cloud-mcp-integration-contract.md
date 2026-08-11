# Skill Registry 与 `Skill-Router-MCP` 集成契约

## 1. 文档目的

本文明确 `release-ai-plugins` 生成的：

```text
ai-plugins/skill-registry.json
```

与云端 `Skill-Router-MCP` 的职责边界。

目标是避免后续实现时重新引入 KV/R2 同步、mutable branch 混读或 registry 自引用 commit SHA。

---

# 2. 两侧职责

## Release / Repository Side

负责：

```text
Skill tree
  ↓
release consistency
  ↓
deterministic skill-registry.json
  ↓
commit together
```

保证：

- registry 与 Skill tree 在同一个 Git commit。
- registry 是当前 tree 的 canonical discovery manifest。
- schema 可验证。
- entry/reference paths 有效。

## Cloud MCP Side

负责：

```text
GITHUB_REF
  ↓
resolve exact commit SHA
  ↓
read registry @ SHA
  ↓
search/select
  ↓
read skill @ same SHA
```

保证：

- 一次 tool call 不跨 commit。
- 返回 source commit 用于诊断。
- 不依赖 registry 内嵌 commit SHA。

---

# 3. SourceSnapshot

云 MCP 推荐内部模型：

```ts
interface SourceSnapshot {
  owner: string
  repo: string
  ref: string
  commitSha: string
}
```

注意：这是 MCP runtime 类型，不是 registry schema。

创建流程：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
  ↓
GitHub Repository Adapter.resolveRef()
  ↓
SourceSnapshot(commitSha)
```

此后本次 tool call 的所有 GitHub 内容读取都必须使用：

```text
snapshot.commitSha
```

而不是继续用 mutable `dev`。

---

# 4. `list_skills`

流程：

```text
resolve snapshot
  ↓
read ai-plugins/skill-registry.json @ snapshot.commitSha
  ↓
validate schemaVersion
  ↓
return skill summaries + source commit
```

不需要：

- GitHub directory traversal。
- 读取每个 SKILL.md。
- Cloudflare storage lookup。

---

# 5. `search_skills`

第一版搜索输入：

```text
id
name
description
```

全部来自 registry。

流程：

```text
registry @ SHA
  ↓
normalize query
  ↓
keyword/token matching
  ↓
rank candidates
```

不要为了搜索而一次读取所有 SKILL.md 正文。

---

# 6. `get_skill_metadata`

如果实现该 tool，可以直接返回 registry entry，并附加：

```text
sourceCommitSha
```

该 SHA 来自 SourceSnapshot。

---

# 7. `load_skill`

输入：

```text
skillId
```

流程：

```text
resolve snapshot
  ↓
read registry @ SHA
  ↓
find skillId
  ↓
entry path
  ↓
read SKILL.md @ same SHA
```

若需要 reference：

```text
references[] path @ same SHA
```

禁止：

```text
registry @ abc123
SKILL.md @ dev(latest=def456)
```

---

# 8. Tool Call Snapshot 粒度

第一版推荐：

> 每个 MCP tool call 独立 resolve `GITHUB_REF`。

这样高频 push 后：

```text
call A -> abc123
push def456
call B -> def456
```

新版本无需等待 Worker deployment/cache purge。

一个 tool call 内则保持一致性。

未来如果一个高层 MCP operation 横跨多个 tool call，需要更强 transaction-like snapshot，再单独设计 snapshot token；第一版不要提前增加 session state。

---

# 9. Registry Missing / Stale Runtime 行为

理论上 CI/release 应阻止 stale registry 进入 Git。

Runtime 仍需处理：

## Registry missing

返回可诊断错误：

```text
REGISTRY_NOT_FOUND
sourceCommitSha
registryPath
```

## Unsupported schema

```text
REGISTRY_SCHEMA_UNSUPPORTED
schemaVersion
sourceCommitSha
```

## Skill entry points to missing file

```text
REGISTRY_ENTRY_INVALID
skillId
entry
sourceCommitSha
```

不要 fallback 到扫描整个仓库并静默隐藏 registry 错误，否则会掩盖发布契约破坏。

---

# 10. 高频更新 Freshness

该模型专门适合高频 skill 更新：

```text
push commit
  ↓
GitHub branch HEAD changes
  ↓
new MCP tool call resolves new HEAD
```

没有：

```text
GitHub -> KV sync latency
GitHub -> R2 upload latency
Worker redeploy latency
cache invalidation requirement
```

---

# 11. 可选缓存的未来边界

只有性能数据证明有必要时，云 MCP 才允许增加：

```text
registry:{commitSha}
skill:{commitSha}:{skillId}
```

这类 immutable commit-addressed cache。

Release side 不需要知道缓存存在。

Release side 永远只负责 Git artifact。

---

# 12. GitHub API 优化原则

云 MCP 可以独立采用：

- conditional requests。
- ETag。
- request coalescing。
- short-lived in-isolate memoization（如果不会破坏 freshness/secret boundaries）。

这些属于 runtime optimization，不应写进 `skill-registry.json`。

---

# 13. Registry 更新不要求 Worker 重新部署

这是必须保留的产品能力：

```text
Skill update
!=
Worker code update
```

只修改 skills/registry：

```text
push Git commit
```

即可被下一次 snapshot 使用。

只有 MCP Server 自己的代码/配置变化才需要部署 Worker。

---

# 14. Source Information in MCP Result

推荐 MCP tool result 包含诊断信息：

```json
{
  "source": {
    "repository": "ruan-cat/monorepo",
    "ref": "dev",
    "commitSha": "abc123"
  }
}
```

不要返回 GitHub Token、认证 header 或内部 request details。

---

# 15. Release 与 MCP 的独立演进

双方 contract 只有：

```text
registry schema
+
Git exact commit semantics
```

因此：

- release script 可以独立改进实现。
- Worker 可以独立优化 transport/search/cache。
- 只要 schema 与 commit semantics 不变，双方无需同步发布。

---

# 16. Definition of Done

- [ ] GitHub 是唯一 Skill 真源。
- [ ] Release 只生成 Git artifact。
- [ ] MCP 每个 tool call resolve exact SHA。
- [ ] Registry/Skill 同 SHA 读取。
- [ ] Registry 不内嵌 commit SHA。
- [ ] stale/missing registry 不静默 fallback。
- [ ] Skill push 不要求 Worker redeploy。
- [ ] KV/R2 不进入第一版 contract。
