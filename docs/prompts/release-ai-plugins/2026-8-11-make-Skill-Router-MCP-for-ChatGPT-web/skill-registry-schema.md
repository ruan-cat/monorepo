# Skill Registry Schema 实施规范

## 1. 文档目的

本文定义 Skill Router MCP Server 使用的仓库级 Skill Registry：

```text
ai-plugins/skill-registry.json
```

定位：

> **由现有 Skill 源文件确定性生成的、低 churn、机器可发现索引。**

它不是数据库、缓存、独立 Source of Truth，也不需要发布到 Cloudflare KV/R2。

真实工作负载：Skill 数量中等，但内容和附属文件高频更新，因此第一版优先减少重复索引和维护噪声。

---

# 2. 为什么需要仓库级 Registry

MCP 的 `list_skills` / `search_skills` 如果每次都遍历两个 Skill roots 并逐个读取 `SKILL.md`，请求和实现复杂度都会上升。

Registry 将 discovery 信息预整理为一个小型 manifest：

```text
commit abc123
  |
  +-- ai-plugins/skill-registry.json
  +-- ai-plugins/common-tools/skills/**
  +-- ai-plugins/dev-skills/skills/**
```

运行时：

```text
resolve/pin commit SHA
        |
read registry @ SHA
        |
list/search
        |
load selected SKILL.md @ same SHA
```

---

# 3. Registry 不保存自身 Commit SHA

`sourceCommitSha` 由 MCP Runtime `SourceSnapshot` 提供，不写入 registry。

正确：

```text
GITHUB_REF -> abc123
  +-- registry @ abc123
  +-- Skill @ abc123
```

---

# 4. 生成范围

覆盖：

```text
ai-plugins/common-tools/skills/*
ai-plugins/dev-skills/skills/*
```

每个直接子目录必须有 `SKILL.md`。

`id` 默认使用目录名，并要求两个 roots 全局唯一。

---

# 5. Registry v1 JSON

```json
{
	"schemaVersion": "1",
	"source": {
		"repository": "ruan-cat/monorepo",
		"roots": ["ai-plugins/common-tools/skills", "ai-plugins/dev-skills/skills"]
	},
	"skills": [
		{
			"id": "nitro-api-development",
			"plugin": "dev-skills",
			"name": "nitro-api-development",
			"description": "使用 Nitro v3 开发和维护服务端 API。",
			"version": "0.13.6",
			"entry": "ai-plugins/dev-skills/skills/nitro-api-development/SKILL.md"
		}
	]
}
```

字段：

- `schemaVersion`：格式版本。
- `source.repository`：诊断信息，不代表 commit。
- `source.roots`：固定生成范围。
- `id`：Skill 目录名，全局唯一。
- `plugin`：`common-tools` / `dev-skills`。
- `name`：frontmatter `name`。
- `description`：frontmatter `description`。
- `version`：`metadata.version`。
- `entry`：repo-relative `SKILL.md` path。

第一版不要求额外 `metadata.yaml`。

---

# 6. 为什么 v1 不包含 References / Templates / Examples

这些附属文件在高频维护中很容易变化，但 discovery/search 不需要它们。

如果 registry 复制文件列表，会形成：

```text
reference move/delete/add
 -> registry churn
 -> CI diff
```

而云 MCP 已经可以：

1. 读取选中的 `SKILL.md @ exact SHA`。
2. 根据 Skill 中明确引用的 repo-relative 文件按需读取。
3. 所有关联读取继续使用同一 SHA。

因此 v1 不建立深层文件第二索引。

---

# 7. 确定性生成要求

```text
same working tree => same registry bytes
```

禁止：

- `generatedAt`。
- 当前时间。
- 随机 id。
- 本机绝对路径。
- current commit SHA。

规则：

1. roots 顺序固定。
2. skills 按 id 稳定排序。
3. object 属性顺序固定。
4. JSON 固定缩进。
5. UTF-8 / LF / final newline。

---

# 8. Frontmatter 来源

至少解析：

```text
name
description
metadata.version
```

`id` 从目录名派生，`plugin` 从 root 派生。

缺失/非法字段必须阻断 generator。

---

# 9. Registry Builder

推荐独立脚本：

```text
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
```

支持：

```text
-Check
-Apply
```

中等 Skill 数量下始终 full scan 两个 roots，不维护旧 registry 增量 state。

一次多 Skill release 只在所有 Skill 更新后调用一次 Apply，并在最终验收调用一次 Check。

---

# 10. 与 `release-ai-plugins` 集成

建议：

```text
发现全部 changed Skill
        |
完成全部 metadata.version 更新
        |
完成 plugin/marketplace/CHANGELOG/README
        |
one registry Apply
        |
one final Check
```

Registry 加入严格写入白名单。

DryRun 不写 registry；Apply 才真实生成。

详细专项契约：

```text
../2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/
```

---

# 11. 高频修改与 CI

CI 使用 generator `-Check` 防止 stale registry。

CI：

- path-scoped。
- 只读。
- stale fail。
- 不自动 commit/push。

高频 reference/template 变化如果 discovery 字段不变，不因为附属文件索引产生额外 registry diff；正常 release 仍应按 Skill 行为变化升级 `metadata.version`。

---

# 12. 与 MCP Tool 映射

## `list_skills`

读取 registry @ SourceSnapshot SHA，返回 summaries + `sourceCommitSha`。

## `search_skills`

第一版基于：

```text
id + name + description + plugin
```

做轻量关键词/token matching，无向量数据库。

## `load_skill`

通过 `entry` 读取真实 `SKILL.md`。

输入可以带可选 `sourceCommitSha`：

- 无 pin：解析最新 `GITHUB_REF`。
- 有 pin：在配置好的同一 repository 使用 exact SHA。

这样 search -> load 可在高频 push 期间保持同 snapshot。

深层关联文件按需同 SHA 读取。

---

# 13. Schema 演进政策

高频 Skill 内容更新不升级 `schemaVersion`。

只有不兼容字段语义变化才升级 schema major。

不因为 MCP cache/transport/logging 内部变化修改 registry schema。

---

# 14. 轻量增长策略

中等 Skill 数量继续：

```text
full-scan generator
+
one small registry
+
in-memory search
```

不要提前引入：

- incremental registry DB。
- vector search。
- KV/R2 sync。
- deep-file manifest。

详细见：

```text
high-frequency-skill-churn-strategy.md
../2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/high-frequency-maintenance-and-growth-strategy.md
```

---

# 15. 验收规则

- [ ] Registry 覆盖两个 roots。
- [ ] id 全局唯一。
- [ ] 每个 entry 存在。
- [ ] name/description/version 可解析。
- [ ] 输出完全确定性。
- [ ] 不含 timestamp/current commit SHA。
- [ ] v1 不枚举 references/templates/examples。
- [ ] 多 Skill release 只生成一次 registry。
- [ ] CI 可检测 stale。
- [ ] MCP exact-SHA list/search/load 正常。
- [ ] search->load 可选 snapshot pin 正常。
- [ ] 高频更新不要求 Cloudflare storage sync/Worker redeploy。
