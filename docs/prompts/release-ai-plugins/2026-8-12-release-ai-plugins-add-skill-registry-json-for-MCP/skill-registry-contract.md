# `ai-plugins/skill-registry.json` 数据契约

## 1. 目标

定义供 `Skill-Router-MCP` 消费的仓库级 Skill Discovery Manifest。

目标文件：

```text
ai-plugins/skill-registry.json
```

它必须是：

- generated。
- committed to Git。
- deterministic。
- machine-readable。
- exact-commit addressable。
- low-churn。

它不是 Skill 正文的替代品，也不是深层文件目录索引。

本 schema 按真实工作负载优化：Skill 总量中等，但 Skill 内容和附属文件高频更新。因此 registry 应只保存 discovery/search/entry 定位真正需要的稳定字段。

---

# 2. 第一版 Schema

推荐：

```json
{
  "schemaVersion": "1",
  "roots": [
    "ai-plugins/common-tools/skills",
    "ai-plugins/dev-skills/skills"
  ],
  "skills": [
    {
      "id": "nitro-api-development",
      "plugin": "dev-skills",
      "name": "nitro-api-development",
      "description": "...",
      "version": "0.13.6",
      "entry": "ai-plugins/dev-skills/skills/nitro-api-development/SKILL.md"
    }
  ]
}
```

第一版保持最小 schema，不提前放云 MCP 特有字段，也不复制 references/templates/examples 文件列表。

---

# 3. 根字段

## `schemaVersion`

类型：

```text
string
```

第一版：

```json
"1"
```

这是 registry 文件格式版本，不是 plugin version，也不是 Skill version。

只有发生消费者需要显式适配的不兼容 schema 变化时才升级。

高频 Skill 内容更新不得导致 schemaVersion 高频变化。

## `roots`

固定：

```json
[
  "ai-plugins/common-tools/skills",
  "ai-plugins/dev-skills/skills"
]
```

固定顺序，不根据扫描结果变化。

## `skills`

所有可发布 Skill 的 machine discovery entries，按 `id` 稳定排序。

---

# 4. Skill Entry 字段

## `id`

来源：

```text
skill directory basename
```

要求全局唯一，作为 MCP API 的稳定 `skillId`。

## `plugin`

枚举：

```text
common-tools
dev-skills
```

来源是所在 root，不从 manifest 反推。

## `name`

来源：

```yaml
name:
```

来自 `SKILL.md` frontmatter。

消费者不要假设 `id` 与 `name` 永远等价。

## `description`

来源：

```yaml
description:
```

由 generator 规范化成单个 JSON string。

用于：

- `list_skills` 摘要。
- `search_skills` keyword/token matching。
- ChatGPT tool result 简介。

## `version`

来源：

```yaml
metadata:
  version: "x.y.z"
```

是 Skill 独立版本，不是 plugin marketplace version。

## `entry`

repo-relative POSIX path，固定指向该 Skill 的 `SKILL.md`。

MCP 的 `load_skill` 使用此 path 在 exact commit SHA 下读取真实正文。

---

# 5. 第一版明确不包含的字段

不要加入：

```text
generatedAt
updatedAt
sourceCommitSha
branch
etag
cacheKey
kvKey
r2Object
workerVersion
absolutePath
references
templates
examples
keywords
tags
embedding
contentHash
```

原因：

- timestamp 破坏 deterministic output。
- commit SHA 会产生自引用语义问题。
- branch 属于 runtime source config。
- Cloudflare storage 与第一版架构无关。
- absolute path 不可移植。
- references/templates/examples 高频变化但不是 discovery 必需字段，会制造无意义 registry churn。
- keywords/tags/embedding 没有稳定权威来源，第一版不应让 generator 猜测。

---

# 6. 为什么不复制完整 SKILL.md

Registry 如果保存完整正文，会产生两个正文副本并扩大：

- diff。
- 文件体积。
- stale 风险。
- generator 复杂度。

正确模式：

```text
Registry = discovery metadata + entry locator
Skill files = content source
```

Cloud MCP 使用 exact commit SHA 保证两者一致。

---

# 7. 为什么第一版不枚举 References

对本项目的真实维护习惯，reference/template/example 文件会随着 Skill 高频更新而经常增删、移动。

如果 registry 复制这些路径：

```text
reference change
 -> registry change
 -> generator diff
 -> CI diff
```

但 `list_skills` / `search_skills` 根本不需要这些信息。

因此第一版只保存 `entry`。

Cloud MCP 在用户选中 Skill 后：

1. 读取 `SKILL.md @ exact SHA`。
2. 根据 Skill 本身明确引用的 repo-relative 文件按需加载。
3. 所有关联文件继续使用同一 exact SHA。

这避免为了维护深层文件列表而建立第二份索引。

---

# 8. Templates / Examples

第一版不放入 schema。

若未来真实 MCP use case 证明必须在 discovery 阶段直接知道这些文件，再独立评估 schema 扩展。

不要为“以后可能有用”提前加字段。

---

# 9. Search 字段策略

第一版搜索字段固定为：

```text
id
name
description
plugin
```

不新增独立 keywords/tags/triggers/embedding。

如果未来搜索质量不足，先基于实际查询样本决定是否扩展权威 metadata；不要由 generator 从正文自动猜关键词。

---

# 10. 全局唯一性

两个 roots 共享一个 MCP namespace：

```text
common-tools/foo
dev-skills/foo
```

不能同时存在。

Generator 遇到 duplicate id 必须失败，不自动变成 `plugin/id`。

---

# 11. Registry 与 Git Commit

正确版本模型：

```text
commit abc123
  ├─ ai-plugins/skill-registry.json
  ├─ ai-plugins/common-tools/skills/...
  └─ ai-plugins/dev-skills/skills/...
```

运行时：

```text
SourceSnapshot = {
  commitSha: abc123,
  registry: skill-registry.json @ abc123
}
```

Cloud MCP 可以在 tool result 报告 `sourceCommitSha`，但它来自 Runtime Snapshot，不来自 registry 文件。

---

# 12. Schema 兼容策略

云 MCP consumer 必须检查 `schemaVersion`。

第一版只支持 `1`。

高频 Skill 内容/version 更新不升级 schema。

只有删除/重命名字段、改变字段语义等不兼容变化才考虑新的 schema major。

不要让 MCP 内部缓存、transport、日志实现变化污染 registry schema。

---

# 13. Registry 与 Release Version

三个概念必须分离：

```text
Git commit SHA = registry/Skill snapshot 版本
schemaVersion = registry 格式版本
skills[].version = 每个 Skill 功能版本
```

不设置 `registryVersion = pluginVersion`。

---

# 14. 示例完整输出

```json
{
  "schemaVersion": "1",
  "roots": [
    "ai-plugins/common-tools/skills",
    "ai-plugins/dev-skills/skills"
  ],
  "skills": [
    {
      "id": "release-ai-plugins",
      "plugin": "common-tools",
      "name": "release-ai-plugins",
      "description": "固定化 ai-plugins 的版本发布流程。",
      "version": "0.18.0",
      "entry": "ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md"
    },
    {
      "id": "nitro-api-development",
      "plugin": "dev-skills",
      "name": "nitro-api-development",
      "description": "使用 Nitro v3 开发 Server API。",
      "version": "0.13.6",
      "entry": "ai-plugins/dev-skills/skills/nitro-api-development/SKILL.md"
    }
  ]
}
```

示例版本值仅表达结构，不是实施时应硬编码的真实当前版本。

---

# 15. 高频维护下的稳定性要求

- 多个 Skill 同时修改时仍只输出一个完整 canonical registry。
- unchanged entry 的 bytes/order 不应因为其他 Skill 变化而随机变化。
- body/reference/template 变化若不改变 discovery 字段，只通过该 Skill `metadata.version` 反映发布状态。
- Generator 不保存 incremental state。
- Registry 不成为附属文件目录镜像。

详细策略见 `high-frequency-maintenance-and-growth-strategy.md`。

---

# 16. Definition of Done

- [ ] schema 最小且足够 discovery/search/entry 定位。
- [ ] id 全局唯一。
- [ ] plugin/root 关系确定。
- [ ] name/description/version 来源唯一。
- [ ] entry 是 repo-relative POSIX path。
- [ ] 不复制 Skill 正文。
- [ ] 不枚举 references/templates/examples。
- [ ] 不包含 timestamp/commit/cloud-storage 字段。
- [ ] schemaVersion 与 Skill/plugin/version 概念分离。
- [ ] exact commit runtime semantics 明确。
- [ ] 高频 Skill 更新不会制造无意义 registry churn。
