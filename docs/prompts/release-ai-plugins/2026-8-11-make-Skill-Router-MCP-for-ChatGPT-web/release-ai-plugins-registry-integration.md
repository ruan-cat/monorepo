# `release-ai-plugins` 与 Skill Registry 集成设计

## 文档定位

本文是 `Skill-Router-MCP` 总体实施包与 `release-ai-plugins` 专项改造包之间的桥接文档。

完整的 `release-ai-plugins` 改造提示词已经拆分到：

```text
docs/prompts/release-ai-plugins/
└── 2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/
```

后续真正修改 `release-ai-plugins` 时，必须以该目录为主要实施规格，不要仅依赖本文摘要。

---

# 1. 冻结决策

为了支持高频更新的 `ai-plugins` skills，同时保持 Cloud MCP 部署和调试简单，采用：

```text
GitHub ai-plugins = 唯一 Source of Truth
```

新增仓库级生成文件：

```text
ai-plugins/skill-registry.json
```

作为：

```text
Git-native deterministic Skill Discovery Manifest
```

第一版不把 registry 发布到 Cloudflare KV/R2。

---

# 2. Registry 与 Git Commit

禁止把 current commit SHA 写入 registry 本身。

正确模型：

```text
commit abc123
  ├─ ai-plugins/skill-registry.json
  ├─ ai-plugins/common-tools/skills/**
  └─ ai-plugins/dev-skills/skills/**
```

Cloud MCP 运行时：

```text
GITHUB_REF -> abc123
      |
      +-- registry @ abc123
      +-- SKILL.md @ abc123
      +-- references @ abc123
```

因此 commit SHA 属于 MCP Runtime `SourceSnapshot`，不属于 registry schema。

---

# 3. Generator 决策

推荐新增：

```text
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
```

它必须：

- 独立可调用。
- PowerShell 5.1/7 兼容。
- 全量扫描两个 skill roots。
- 生成 deterministic JSON。
- 支持 Check/Apply。
- 不调用 GitHub API。
- 不发布 Cloudflare storage。

主 `release-ai-plugins.ps1` 只负责 orchestration。

---

# 4. Release 集成决策

`release-ai-plugins` 必须显式扩展现有严格写入白名单，允许：

```text
ai-plugins/skill-registry.json
```

推荐执行顺序：

```text
changed skill discovery
  ↓
Skill metadata.version bump
  ↓
manifest / marketplace / CHANGELOG / README consistency
  ↓
generate skill registry
  ↓
registry Check
  ↓
existing final validations
  ↓
git diff --check
```

Registry 必须在 Skill version 已更新后生成。

---

# 5. CI 决策

CI 只执行：

```text
generate-skill-registry.ps1 -Check
```

stale 即 fail。

禁止：

- CI Apply。
- bot commit。
- git push。
- Cloudflare credentials。

Skill 与 registry 必须由开发/发布流程放进同一个 commit。

---

# 6. 专项提示词阅读顺序

```text
2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/
  README.md
    ↓
  implementation-plan.md
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

# 7. 本文与专项包的边界

本文只冻结跨项目接口：

```text
release side:
Skill tree -> deterministic registry in Git

runtime side:
ref -> exact SHA -> registry/Skill same snapshot
```

具体：

- generator CLI。
- schema 字段。
- PowerShell 编码。
- DryRun/Apply。
- 白名单修改。
- CI path trigger。
- add/delete/rename 测试。

全部以 2026-8-12 专项提示词目录为准。

---

# 8. Definition of Done

- [ ] 专项提示词包存在且可独立指导实现。
- [ ] Registry schema/generator/release/CI/MCP 边界一致。
- [ ] 无 current commit SHA 自引用。
- [ ] 无 KV/R2 发布依赖。
- [ ] 主 MCP 规格包只引用，不重复维护两套实施细节。
