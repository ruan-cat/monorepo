# Skill Router MCP 高频 Skill 更新与轻量增长策略

## 1. 真实工作负载

本服务按以下模式设计：

```text
Skill 数量：中等，不会无限膨胀
Skill 更新：高频
用户读取：频繁 list/search/load
运行环境：Cloudflare Worker
Source of Truth：GitHub ai-plugins
```

因此第一优先级是：

```text
freshness
+
commit consistency
+
简单部署/调试
```

而不是提前建设大型索引、数据库或多级缓存。

---

# 2. 读取模型保持 O(N) Registry 搜索 + 按需正文加载

第一版：

```text
list/search
  -> 读取一个 skill-registry.json
  -> 在内存对 entries 做轻量匹配

load
  -> 读取选中的 SKILL.md
  -> 需要时再读取该 Skill 的关联文件
```

对于中等 Skill 数量，不需要：

- 向量数据库。
- 搜索服务。
- D1。
- Durable Objects。
- KV 索引。

`search_skills` 第一版只在：

```text
id + name + description + plugin
```

上做确定性关键词/token matching。

---

# 3. Registry v1 保持低 churn

为了适配 Skill 高频修改，registry v1 只保留：

```text
id
plugin
name
description
version
entry
```

不枚举：

```text
references
templates
examples
```

原因：这些文件经常随 Skill 维护发生变化，但不是 discovery/search 所必需。

`load_skill` 使用 `entry` 从同一 exact commit SHA 读取 `SKILL.md`；Skill 内真实链接或需要的关联文件再按需加载。

这样 reference/template 的频繁增删不会制造额外 registry diff 和 generator 工作量。

---

# 4. 每次新 tool call 默认看到最新 HEAD

默认模式：

```text
GITHUB_REF=dev
  ↓
resolve current HEAD -> commit SHA
  ↓
本次 tool call 全部使用该 SHA
```

因此：

```text
push A
call A -> commit A
push B
call B -> commit B
```

不需要：

- Worker redeploy。
- KV purge。
- R2 upload。
- cache invalidation workflow。

---

# 5. 高频更新下的跨 Tool Call 一致性：可选 Snapshot Pin

仅做到“每个 tool call 内一致”还存在一个边界：

```text
search_skills @ commit A
       |
       | 此时 branch 推进到 B
       v
load_skill @ commit B
```

如果 Skill 在 B 中被重命名、删除或行为发生明显变化，search -> load 可能出现语义漂移。

第一版用一个轻量、无 session 的方式解决：

## Discovery Tool Result

`list_skills` / `search_skills` 返回：

```json
{
	"sourceCommitSha": "abc123"
}
```

## `load_skill`

输入允许：

```json
{
	"skillId": "nitro-api-development",
	"sourceCommitSha": "abc123"
}
```

其中 `sourceCommitSha` 可选：

- 未提供：解析最新 `GITHUB_REF`，获得最新 snapshot。
- 已提供：在当前配置的同一个 `GITHUB_OWNER/GITHUB_REPO` 内直接使用该 exact commit SHA。

这不是 session token，也不需要服务器保存状态。

禁止允许调用方同时覆盖 owner/repo，避免把 Skill Router 变成任意 GitHub 文件代理。

---

# 6. Snapshot Pin 的使用建议

常规“我要最新 Skill”场景：

```text
load_skill(skillId)
```

即可。

典型 search -> load 链路：

```text
search_skills
  -> candidate + sourceCommitSha=A

load_skill(skillId, sourceCommitSha=A)
```

这样用户在高频发布期间仍然能复现刚刚被搜索到的那一版 Skill。

下一次独立任务则重新使用最新 HEAD。

---

# 7. 不引入 Server Session

不要为了跨 tool call 一致性增加：

- Durable Object session。
- KV snapshot token。
- Worker memory session map。
- database transaction state。

Exact commit SHA 本身就是 Git 已有的不可变 snapshot identifier。

复用它即可。

---

# 8. GitHub 请求数量的轻量控制

目标不是“零 GitHub 请求”，而是避免无意义请求。

典型调用：

## list/search

```text
1. resolve ref（若未 pin）
2. fetch registry @ SHA
```

## load

```text
1. resolve ref（若未 pin）
2. fetch registry @ SHA
3. fetch selected SKILL.md @ SHA
4. 仅在需要时 fetch selected related files @ SHA
```

同一 tool call 中：

- `SourceSnapshot` 只创建一次。
- registry 只读取一次。
- 不逐个读取所有 Skill 正文。
- 不逐个调用目录 API。

---

# 9. references/templates/examples 按需读取

Registry 不维护它们的列表。

Cloud MCP 可根据真实 Skill 内容采用轻量策略：

1. 先返回/解析 `SKILL.md`。
2. 识别其中明确引用的 repo-relative 文件。
3. 仅在该 Skill 的执行上下文确实需要时读取。
4. 所有读取继续使用同一 `SourceSnapshot.commitSha`。

不要默认把一个 Skill 的所有深层文件全部塞入 ChatGPT 上下文。

这同时控制：

- GitHub 请求。
- MCP response 大小。
- ChatGPT context 污染。

---

# 10. 更新频率与缓存政策

高频更新意味着 mutable-name cache 的维护成本高，因此 MVP 不缓存：

```text
skill:{id}
registry:current
```

如果以后真实指标证明需要缓存，只允许不可变 key：

```text
registry:{commitSha}
skill:{commitSha}:{skillId}
```

旧缓存无需 purge，因为新 commit 使用新 key。

Release side 永远不感知缓存。

---

# 11. 轻量诊断与观测

第一版不要求额外 observability 平台。

结构化日志/测试至少能看到：

```text
sourceCommitSha
registry byte size
skill count
GitHub requests per tool call
tool latency
GitHub error/rate-limit condition
```

不要记录 Token 或完整用户敏感输入。

这些指标足够判断未来是否真的需要缓存或搜索升级。

---

# 12. 数据增长的升级顺序

只有真实瓶颈出现时，按以下顺序演进：

## Level 0：当前设计

```text
GitHub exact commit
+
small registry
+
in-memory search
```

## Level 1：无新存储的优化

- conditional request / ETag（适用处）。
- 同请求去重。
- 小范围 in-isolate immutable memoization（不作为正确性依赖）。
- parser/search 算法优化。

## Level 2：commit-addressed cache

只有指标证明 GitHub 重复读取是瓶颈时再评估。

## Level 3：更复杂存储/搜索

只有 Skill 数量、registry 大小或搜索质量已经真实超过简单方案能力时才讨论。

不要跳级。

---

# 13. 明确不做的过度设计

当前不引入：

- KV/R2/D1/DO 作为必需依赖。
- vector database。
- embedding pipeline。
- background sync。
- webhook freshness service。
- mutable cache invalidation service。
- per-conversation snapshot database。
- registry 中的 references/templates/examples index。

---

# 14. Definition of Done

- [ ] 中等 Skill 数量继续使用单 registry + 内存搜索。
- [ ] 高频更新的新 tool call 可直接看到新 HEAD。
- [ ] 单 tool call 内 exact commit 一致。
- [ ] search/list 返回 `sourceCommitSha`。
- [ ] `load_skill` 支持可选 `sourceCommitSha` pin。
- [ ] 不需要 server-side session。
- [ ] Registry v1 不枚举 reference/template/example。
- [ ] 深层文件按需读取且保持同 SHA。
- [ ] 没有 Cloudflare storage / vector search 过度设计。
- [ ] 未来优化以真实请求数、延迟、registry 大小等指标触发。
