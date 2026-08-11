# `release-ai-plugins` 与 Skill Registry 集成设计

## 文档定位

本文是 `Skill-Router-MCP` 总体实施包与 `release-ai-plugins` 专项改造包之间的桥接文档。

真正修改 `release-ai-plugins` 时，以：

```text
docs/prompts/release-ai-plugins/
└── 2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/
```

为权威脚本级实施规格。

---

# 1. 冻结决策

真实模式：Skill 数量中等，但内容/附属文件高频维护。

采用：

```text
GitHub ai-plugins = 唯一 Source of Truth
+
ai-plugins/skill-registry.json = deterministic low-churn discovery manifest
```

第一版：

- 不发布 registry 到 KV/R2。
- 不建立增量 Registry DB。
- 不建立 references/templates/examples 第二份文件索引。
- 不建立 vector search。

---

# 2. Registry 与 Git Commit

```text
commit abc123
  ├─ ai-plugins/skill-registry.json
  ├─ ai-plugins/common-tools/skills/**
  └─ ai-plugins/dev-skills/skills/**
```

Cloud MCP：

```text
latest:
GITHUB_REF -> abc123

pinned:
sourceCommitSha -> abc123

then:
  +-- registry @ abc123
  +-- selected SKILL.md @ abc123
  +-- related files on demand @ abc123
```

Commit SHA 属于 Runtime `SourceSnapshot`，不写进 registry。

---

# 3. Registry v1

只保存：

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

这能显著降低高频深层文件变更时的 registry churn。

---

# 4. Generator

推荐：

```text
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
```

必须：

- PowerShell 5.1/7。
- 两 roots full scan。
- deterministic JSON。
- Check/Apply。
- 不调用 GitHub API。
- 不维护 old-registry incremental state。
- 不扫描/枚举 deep-file lists。

中等 Skill 数量下 full scan 是有意决策。

---

# 5. 高频多 Skill Release

一次 release 可以修改多个 Skill，但 generator 只集中运行：

```text
all changed Skill version/release state
  ↓
one generator -Apply
  ↓
one final generator -Check
```

禁止 per-Skill full scan。

---

# 6. CI

CI 只执行轻量 stale Check：

```text
generate-skill-registry.ps1 -Check
```

- path-scoped。
- 只读。
- stale fail。
- 不 Apply/commit/push。
- 不需要 Cloudflare credentials。

---

# 7. Cloud MCP 高频更新语义

Discovery tool 返回：

```text
sourceCommitSha
```

`load_skill`：

- 不传 pin -> 最新 HEAD。
- 传 `sourceCommitSha` -> 复现 discovery snapshot。

这样：

```text
search @ A
push B
load pinned A -> A
load latest -> B
```

不需要 server session/KV/DO snapshot store。

---

# 8. 专项提示词阅读顺序

```text
README.md
  ↓
implementation-plan.md
  ↓
high-frequency-maintenance-and-growth-strategy.md
  ↓
release-ai-plugins-modification-spec.md
  ↓
registry-generator-spec.md
  ↓
skill-registry-contract.md
  ↓
cloud-mcp-integration-contract.md
  ↓
ci-stale-registry-gate.md
  ↓
testing-and-acceptance.md
  ↓
agent-handoff-checklist.md
```

---

# 9. 演进边界

不要因为“更新频繁”就提前升级到复杂架构。

只有真实测量显示以下问题时才继续优化：

```text
generator/CI time
registry bytes
GitHub requests/tool call
MCP P95 latency
search quality
```

优先优化请求去重/parser/search；再考虑 immutable commit-addressed cache；不要跳级。

---

# 10. Definition of Done

- [ ] 专项提示词包独立可执行。
- [ ] Registry minimal/low-churn。
- [ ] 多 Skill release one Apply + one Check。
- [ ] full scan 无增量 state。
- [ ] CI 轻量只读。
- [ ] latest/pinned exact-SHA runtime semantics 一致。
- [ ] 无 KV/R2/vector DB/server session 必需依赖。
- [ ] 主 MCP 规格包只维护跨系统 contract，不重复脚本级细节。
