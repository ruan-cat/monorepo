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

它不是 Skill 正文的替代品。

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
      "version": "0.13.5",
      "entry": "ai-plugins/dev-skills/skills/nitro-api-development/SKILL.md",
      "references": [
        "ai-plugins/dev-skills/skills/nitro-api-development/references/api-reference.md"
      ]
    }
  ]
}
```

第一版保持最小 schema，不要提前放大量云 MCP 特有字段。

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

## `roots`

固定：

```json
[
  "ai-plugins/common-tools/skills",
  "ai-plugins/dev-skills/skills"
]
```

该字段允许消费者诊断 Registry 覆盖范围。

固定顺序，不根据扫描结果变化。

## `skills`

所有可发布 Skill 的 machine discovery entries。

按 `id` 稳定排序。

---

# 4. Skill Entry 字段

## `id`

来源：

```text
skill directory basename
```

要求全局唯一。

作为 MCP API 的稳定 `skillId`。

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

注意：第一版允许 `id` 与 `name` 相同，也允许将来 name 成为更适合展示的值；消费者不要假设二者永久等价。

## `description`

来源：

```yaml
description:
```

由 generator 规范化成单个 JSON string。

用于：

- `list_skills` 摘要。
- `search_skills` keyword matching。
- ChatGPT tool result 简介。

## `version`

来源：

```yaml
metadata:
  version: "x.y.z"
```

是 Skill 独立版本，不是 plugin marketplace version。

## `entry`

repo-relative POSIX path。

固定指向该 Skill 的 `SKILL.md`。

MCP 的 `load_skill` 使用此 path 在同一个 exact commit SHA 下读取正文。

## `references`

repo-relative POSIX path array。

只提供可发现路径，不复制文件正文。

固定排序。

---

# 5. 第一版不包含的字段

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
```

原因：

- timestamp 破坏 deterministic output。
- commit SHA 自引用。
- branch 是运行时 source config，不是 Skill 元数据。
- Cloudflare storage 与第一版架构无关。
- absolute path 不可移植。

---

# 6. 为什么不复制完整 SKILL.md

如果 registry 保存完整正文，会产生：

```text
SKILL.md source
+
registry content copy
```

两个正文副本。

这会扩大：

- diff。
- 文件体积。
- stale 风险。
- generator 复杂度。

正确模式：

```text
Registry = discovery metadata
Skill files = content source
```

Cloud MCP 使用 exact commit SHA 保证两者一致。

---

# 7. References 是否必须

第一版推荐保留 `references`，因为它允许 MCP：

- 返回“该 Skill 有哪些深层参考资料”。
- 按需加载 reference，而不是遍历 GitHub directory API。

但 MCP 不应在 `load_skill` 时默认把所有 references 全部塞入上下文。

应允许按需读取。

---

# 8. Templates / Examples

第一版不建议放入 schema，除非真实 MCP use case 已经需要。

理由：

- `SKILL.md` 可以描述如何使用它们。
- 先保持 discovery manifest 最小。
- schema 扩展容易，删除字段更困难。

如果未来需要，可向 Skill entry 增加：

```text
templates
examples
```

属于兼容性添加，可继续使用 `schemaVersion: "1"` 或按消费契约决定。

---

# 9. Search 字段策略

第一版不新增独立：

```text
keywords
tags
triggers
embedding
```

原因：当前每个 Skill 已有 description，且云 MCP 第一阶段可在：

```text
id + name + description
```

上做简单搜索。

如果未来需要高质量 search，应先明确 metadata 的权威来源，再增加字段；不要由 generator 从正文“猜关键词”，否则索引会变成不可预测的派生数据。

---

# 10. 全局唯一性

两个 roots 共享一个云 MCP namespace，因此：

```text
common-tools/foo
dev-skills/foo
```

不能同时存在。

Generator 遇到 duplicate id 必须失败。

不要自动把 id 改成：

```text
common-tools/foo
```

这样会破坏现有 Skill 名称语义，并把潜在发布冲突隐藏起来。

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

因此 Cloud MCP 可以在 tool response 中报告：

```json
{
  "sourceCommitSha": "abc123"
}
```

但该字段来自 Runtime Snapshot，不来自 registry 文件本身。

---

# 12. Schema 兼容策略

云 MCP consumer 必须检查：

```text
schemaVersion
```

第一版只支持：

```text
1
```

如果读到未知 major schema：

- 不要静默猜测。
- 返回可诊断 registry compatibility error。

生成器只有在明确实施 schema migration 时才能修改 version。

---

# 13. Registry 与 Release Version

一个 registry 文件同时描述两个 plugin roots，因此不设置：

```text
registryVersion = pluginVersion
```

Registry 的版本天然是：

```text
Git commit SHA
```

其 schema 格式版本是：

```text
schemaVersion
```

每个 Skill 的功能版本是：

```text
skills[].version
```

这三个概念必须分离。

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
      "entry": "ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md",
      "references": [
        "ai-plugins/common-tools/skills/release-ai-plugins/references/release-contract.md"
      ]
    },
    {
      "id": "nitro-api-development",
      "plugin": "dev-skills",
      "name": "nitro-api-development",
      "description": "使用 Nitro v3 开发 Server API。",
      "version": "0.13.5",
      "entry": "ai-plugins/dev-skills/skills/nitro-api-development/SKILL.md",
      "references": []
    }
  ]
}
```

示例版本值仅表达结构，不是实施时应硬编码的真实当前版本。

---

# 15. Definition of Done

- [ ] schema 最小且足够 discovery。
- [ ] id 全局唯一。
- [ ] plugin/root 关系确定。
- [ ] name/description/version 来源唯一。
- [ ] entry/reference 都是 repo-relative POSIX path。
- [ ] 不复制 Skill 正文。
- [ ] 不包含 timestamp/commit/cloud storage 字段。
- [ ] schemaVersion 与 Skill/plugin/version 概念分离。
- [ ] exact commit runtime semantics 明确。
