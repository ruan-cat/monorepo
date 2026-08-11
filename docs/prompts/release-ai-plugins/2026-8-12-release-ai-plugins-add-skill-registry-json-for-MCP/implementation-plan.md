# AI Agent 实施计划：为 `release-ai-plugins` 增加 Skill Registry

## 1. 文档目的

本文约束后续实际编码 Agent 的执行顺序。

目标不是重新设计 `release-ai-plugins`，而是在保留现有发布安全模型的基础上增加：

```text
deterministic skill registry generation
+
release orchestration integration
+
CI stale-registry gate
```

并针对真实使用模式优化：**Skill 数量中等，但会高频批量修改、维护和新增。**

---

# 2. 实施前必须确认的现状

开始编码前读取真实文件：

```text
ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md
ai-plugins/common-tools/skills/release-ai-plugins/README.md
ai-plugins/common-tools/skills/release-ai-plugins/references/release-contract.md
ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1
.github/workflows/**
```

若真实代码后来演进：优先保留现有安全约束，不机械覆盖。

---

# 3. Phase 0：理解高频维护策略

先读：

```text
high-frequency-maintenance-and-growth-strategy.md
```

必须理解并接受：

- 中等 Skill 数量继续 full scan，不做增量 Registry DB。
- 多 Skill release 只生成一次 registry。
- Registry v1 不枚举 references/templates/examples。
- 高频内容变化由 Skill version + Git commit 表达。
- CI 只做轻量 stale gate。
- schemaVersion 不随 Skill 高频更新变化。
- 优化由真实指标触发，而不是预设复杂架构。

---

# 4. Phase 1：冻结 Registry Contract

实现前确认：

```text
skill-registry-contract.md
```

第一版字段固定为：

```text
id
plugin
name
description
version
entry
```

并确定：

- roots。
- id 来源/唯一性。
- plugin 派生。
- frontmatter 字段来源。
- entry path。
- 排序和 JSON canonical 格式。
- schemaVersion。
- duplicate/missing metadata 行为。

不要在 schema 未冻结前写 generator。

---

# 5. Phase 2：实现独立 Generator

新增：

```text
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
```

职责：

```text
scan -> parse -> validate -> normalize -> serialize -> compare/write
```

第一阶段要求：

- Windows PowerShell 5.1 / PowerShell 7。
- 无第三方 module。
- 自动定位 repo root。
- full scan 两个 Skill roots。
- deterministic output。
- Check 无写入。
- Apply 只写 registry。
- 不扫描/枚举 references/templates/examples。

---

# 6. Phase 3：生成首份 Registry

由 generator 创建：

```text
ai-plugins/skill-registry.json
```

验证：

- JSON 可解析。
- 两个 roots 下 Skill 全部被发现。
- skill 数量一致。
- id 唯一。
- version 与 frontmatter 一致。
- entry 存在。
- 重复执行无 diff。

禁止人工手写首份 registry。

---

# 7. Phase 4：改造 `release-ai-plugins.ps1`

推荐数据依赖顺序：

```text
changed Skill discovery
  ↓
完成所有 changed Skill metadata.version bump
  ↓
plugin / marketplace / changelog / README work
  ↓
run generator -Apply ONCE
  ↓
run generator -Check ONCE
  ↓
existing release validation
  ↓
git diff --check
```

主脚本需要：

- registry 加入明确写入白名单。
- DryRun 不修改 registry，只报告 Apply 将 regenerate。
- Apply 在所有 Skill 修改完成后集中调用 generator。
- generator failure 阻断 release。

禁止在每个 changed Skill 循环中重新生成 registry。

---

# 8. Phase 5：更新 Skill 自身文档契约

更新：

```text
SKILL.md
README.md
references/release-contract.md
```

明确：

- registry 是发布一致性产物。
- generator 独立可调用。
- release 主入口仍是 `release-ai-plugins.ps1`。
- registry stale 为阻断错误。
- v1 是低 churn discovery manifest。
- 不包含 current commit SHA。
- 不枚举深层附属文件。
- 不执行 Cloudflare storage publish。

本次真实行为扩展必须按现有 SemVer 规则升级 `release-ai-plugins` 自身 version。

---

# 9. Phase 6：新增 / 删除 / 重命名

Generator 必须基于**当前 working tree 全量扫描**。

因此：

```text
新增目录 -> 新 entry
删除目录 -> old entry 消失
重命名 -> old id 消失 + new id 出现
```

不要让 generator 依赖 `$SkillList` 或旧 registry。

主 release CLI 如果对 delete/rename 表达不够优雅，优先保留简单参数面；先让 full scan + CI 正确工作，不提前设计复杂事件参数。

---

# 10. Phase 7：CI Stale Gate

新增/扩展 CI：

```text
run generate-skill-registry.ps1 -Check
```

CI 必须：

- 只读。
- path-scoped。
- 无仓库写权限需求。
- stale -> non-zero。
- 输出修复命令。

禁止 CI 自动 commit registry。

---

# 11. Phase 8：回归 release 流程

必须确认：

- DryRun 仍零写入。
- Apply 才写文件。
- 六个 plugin manifest 正常。
- 三个平台 marketplace 正常。
- CHANGELOG 正常。
- README new-skill gate 正常。
- 未修改 Skill 不误 bump。
- 多 Skill batch release 正常。
- registry 只集中生成一次。
- `git diff --check` 正常。

---

# 12. Phase 9：验证 Cloud MCP Contract

证明生成结果满足：

```text
commit abc123
  |
  +-- ai-plugins/skill-registry.json
  +-- ai-plugins/.../SKILL.md
```

MCP 可：

```text
read registry @ abc123
read selected skill @ abc123
```

Discovery result 的 `sourceCommitSha` 还可以作为后续 `load_skill` 的可选 snapshot pin，从而在高频 push 期间保持 search->load 复现性。

Registry 不依赖 mutable branch state，也不依赖 Cloudflare storage。

---

# 13. 提交前检查顺序

```text
1. generator Check
2. release-ai-plugins DryRun
3. Apply（预期测试工作树）
4. generator Check
5. deterministic regeneration
6. JSON / entry validation
7. existing release validation
8. git diff --check
9. CI-equivalent registry check
10. inspect whitelist + registry diff noise
```

特别检查：高频 reference/template 变化不应因为文件枚举导致 registry 大面积 diff。

---

# 14. 禁止实现方式

禁止：

- `generatedAt`。
- Registry 写当前 commit SHA。
- GitHub Action 自动回写。
- Generator 调 GitHub API。
- Generator 从 marketplace 反推 skills。
- old JSON incremental patch。
- references/templates/examples 文件列表进入 v1 registry。
- changed Skill 循环内反复 full scan。
- Cloudflare KV/R2 上传。
- 为 JSON/YAML 随意引入大型 runtime。
- 为中等 Skill 数量建立 registry database/event log。

---

# 15. Definition of Done

- [ ] 独立 generator。
- [ ] 首份 registry 由 generator 生成。
- [ ] 输出 byte-deterministic。
- [ ] minimal low-churn schema。
- [ ] Check/Apply 边界清晰。
- [ ] 主 release 正确 orchestration。
- [ ] 多 Skill release 只集中生成一次 registry。
- [ ] Registry 加入白名单和最终验收。
- [ ] Skill 文档契约更新。
- [ ] CI stale gate 生效。
- [ ] add/modify/delete/rename 测试通过。
- [ ] reference/template 高频维护不制造无必要 registry 索引 churn。
- [ ] 原 release 行为回归通过。
- [ ] Cloud MCP exact-commit consumer contract 通过。
