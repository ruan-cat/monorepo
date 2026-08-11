# Skill Registry 与 `Skill-Router-MCP` 集成契约

## 1. 文档目的

本文明确 `release-ai-plugins` 生成的：

```text
ai-plugins/skill-registry.json
```

与云端 `Skill-Router-MCP` 的职责边界。

目标是支持 Skill 高频更新，同时保持架构轻量：不重新引入 KV/R2 同步、mutable branch 混读、registry 自引用 commit SHA 或 server-side session。

---

# 2. 两侧职责

## Release / Repository Side

负责：

```text
Skill tree
  ↓
release consistency
  ↓
deterministic low-churn skill-registry.json
  ↓
commit together
```

保证：

- registry 与 Skill tree 在同一 Git commit。
- registry 是当前 tree 的 canonical discovery manifest。
- schema 可验证。
- entry path 有效。
- v1 不复制 reference/template/example 文件列表。

## Cloud MCP Side

负责：

```text
GITHUB_REF or pinned commit SHA
  ↓
SourceSnapshot
  ↓
read registry @ SHA
  ↓
search/select
  ↓
read selected Skill @ same SHA
```

保证：

- 单个 tool call 不跨 commit。
- discovery 返回 source commit 用于诊断和可选 pin。
- 不依赖 registry 内嵌 commit SHA。

---

# 3. SourceSnapshot

推荐内部模型：

```ts
interface SourceSnapshot {
	owner: string;
	repo: string;
	ref?: string;
	commitSha: string;
}
```

创建模式有两种。

## Latest 模式

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
  ↓
resolveRef()
  ↓
SourceSnapshot(commitSha)
```

## Pinned 模式

当 tool input 带有此前由本 MCP 返回的 `sourceCommitSha`：

```text
configured owner/repo
+
sourceCommitSha
  ↓
SourceSnapshot(commitSha)
```

Pinned 模式不允许客户端覆盖 owner/repo，避免把服务变成任意 GitHub 文件代理。

此后本次调用所有读取都使用 `snapshot.commitSha`。

---

# 4`list_skills`

流程：

```text
resolve latest snapshot
  ↓
read skill-registry.json @ SHA
  ↓
validate schemaVersion
  ↓
return summaries + sourceCommitSha
```

不需要目录遍历或逐个读取 `SKILL.md`。

---

# 5`search_skills`

第一版搜索字段：

```text
id
name
description
plugin
```

流程：

```text
registry @ SHA
  ↓
normalize query
  ↓
keyword/token matching
  ↓
rank candidates
  ↓
return candidates + sourceCommitSha
```

不要为了搜索读取所有 Skill 正文。

---

# 6`get_skill_metadata`

如果实现该 tool，可直接返回 registry entry + `sourceCommitSha`。

可选接受 `sourceCommitSha` pin；未提供则使用最新 snapshot。

---

# 7`load_skill`

推荐输入：

```json
{
	"skillId": "nitro-api-development",
	"sourceCommitSha": "abc123"
}
```

其中 `sourceCommitSha` 可选。

## 未提供

```text
resolve GITHUB_REF -> latest SHA
```

适合“我要当前最新版 Skill”。

## 已提供

```text
use exact SHA in configured repository
```

适合：

```text
search_skills @ A
  ↓
load_skill(..., sourceCommitSha=A)
```

从而避免 branch 在两个 tool call 之间推进造成语义漂移。

然后：

```text
read registry @ SHA
  ↓
find skillId
  ↓
entry
  ↓
read SKILL.md @ same SHA
```

---

# 8. 深层文件按需读取

Registry v1 不枚举 references/templates/examples。

Cloud MCP 先读取所选 `SKILL.md @ SHA`，再根据 Skill 中明确的 repo-relative 引用按需读取关联文件。

所有关联读取继续使用同一个 `SourceSnapshot.commitSha`。

不要默认加载 Skill 目录全部文件，也不要为了发现深层文件给 registry 增加第二份目录镜像。

---

# 9. Tool Call Snapshot 粒度

默认每个未 pin 的 MCP tool call 独立解析 `GITHUB_REF`：

```text
call A -> commit A
push B
call B -> commit B
```

这保证新 push 很快可见。

同一 tool call 内保持 exact-SHA 一致。

对于 search -> load 这种跨 tool call 链路，使用可选 `sourceCommitSha` pin，而不是新增 session state/snapshot token 服务。

---

# 10. 为什么 Snapshot Pin 是轻量方案

不需要：

- Durable Object session。
- KV token store。
- Worker memory session map。
- database transaction state。
- opaque snapshot service。

Git commit SHA 本身已经是不可变 snapshot identifier。

服务只允许在配置好的同一个 repository 中按 exact SHA 读取。

---

# 11. Registry Missing / Invalid Runtime 行为

## Registry missing

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

## Missing entry target

```text
REGISTRY_ENTRY_INVALID
skillId
entry
sourceCommitSha
```

不要 fallback 到扫描整个仓库并静默隐藏 registry 契约错误。

---

# 12. 高频更新 Freshness

模型：

```text
push commit
  ↓
branch HEAD changes
  ↓
new unpinned tool call resolves new HEAD
```

没有：

```text
GitHub -> KV sync latency
GitHub -> R2 upload latency
Worker redeploy latency
cache invalidation requirement
```

同时，如果用户正在使用刚刚搜索到的旧 snapshot，可以用 `sourceCommitSha` pin 完成同一版本的后续 load。

---

# 13. 可选缓存未来边界

只有真实指标需要时允许：

```text
registry:{commitSha}
skill:{commitSha}:{skillId}
```

Release side 不感知缓存。

禁止 mutable cache key 作为 freshness 真源。

---

# 14. GitHub API 轻量优化原则

运行时可以独立采用：

- conditional request / ETag（适用处）。
- 同请求去重。
- short-lived immutable in-isolate memoization（不作为正确性依赖）。

这些都不写入 registry，也不改变 release contract。

---

# 15. Skill 更新不要求 Worker 重新部署

必须保持：

```text
Skill update != Worker code update
```

只修改 skills/registry：push Git commit 即可。

只有 MCP Server 自身代码/配置变化才部署 Worker。

---

# 16. Source Information in Tool Result

推荐：

```json
{
	"source": {
		"repository": "ruan-cat/monorepo",
		"ref": "dev",
		"commitSha": "abc123"
	}
}
```

`sourceCommitSha` 可以作为后续 pinned load 输入。

不要返回 Token、Authorization header 或内部 request details。

---

# 17. Release 与 MCP 的独立演进

双方 contract 只有：

```text
minimal registry schema
+
Git exact commit semantics
```

因此 release 可以独立改进 full-scan/generator；Worker 可以独立改进 transport/search/cache。

高频 Skill 内容维护不要求双方同步版本发布。

---

# 18. 轻量增长政策

对中等 Skill 数量，继续使用：

```text
one registry
+
in-memory search
+
selected Skill fetch
```

不要因为更新频繁就误判为“数据规模巨大”，从而引入数据库、向量搜索、后台同步。

详细见：

```text
../2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web/high-frequency-skill-churn-strategy.md
high-frequency-maintenance-and-growth-strategy.md
```

---

# 19. Definition of Done

- [ ] GitHub 是唯一 Skill 真源。
- [ ] Release 只生成 Git artifact。
- [ ] Unpinned tool call 可看到最新 HEAD。
- [ ] 单 tool call exact-SHA 一致。
- [ ] list/search 返回 sourceCommitSha。
- [ ] load_skill 可选接受同 repository 的 sourceCommitSha pin。
- [ ] 不需要 server-side session。
- [ ] Registry v1 不枚举深层附属文件。
- [ ] Related files 按需同 SHA 读取。
- [ ] Skill push 不要求 Worker redeploy。
- [ ] KV/R2 不进入第一版 contract。
