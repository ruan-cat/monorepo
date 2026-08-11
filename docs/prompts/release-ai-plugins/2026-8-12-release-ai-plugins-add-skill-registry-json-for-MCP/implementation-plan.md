# AI Agent 实施计划：为 `release-ai-plugins` 增加 Skill Registry

## 1. 文档目的

本文用于约束后续实际编码 Agent 的执行顺序。

目标不是重新设计 `release-ai-plugins`，而是在保留现有发布安全模型的基础上增加：

```text
deterministic skill registry generation
+
release orchestration integration
+
CI stale-registry gate
```

最终服务于 `Skill-Router-MCP` 的 Git exact-commit snapshot 读取模式。

---

# 2. 实施前必须确认的现状

开始编码前必须读取真实文件，而不是根据本提示词猜测当前实现：

```text
ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md
ai-plugins/common-tools/skills/release-ai-plugins/README.md
ai-plugins/common-tools/skills/release-ai-plugins/references/release-contract.md
ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1
```

并搜索：

```text
.github/workflows/**
```

确认仓库当前 CI 组织方式。

若实际代码与本文档有冲突：

1. 先判断是仓库后来演进还是本文遗漏。
2. 优先保留现有安全约束。
3. 不要机械覆盖新逻辑。
4. 必要时先更新实施规格再编码。

---

# 3. Phase 1：冻结 Registry Contract

先实现/确认：

```text
skill-registry-contract.md
```

必须先确定：

- roots。
- id 来源。
- name/description/version 来源。
- plugin 字段。
- entry path。
- references 枚举规则。
- 排序规则。
- JSON 格式。
- schemaVersion。
- duplicate id 行为。
- 缺失 metadata 行为。

在 schema 未冻结前不要写 generator。

---

# 4. Phase 2：实现独立 Generator

新增：

```text
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
```

职责仅限：

```text
scan -> parse -> validate -> normalize -> serialize -> compare/write
```

不负责：

- bump version。
- 修改 marketplace。
- 修改 CHANGELOG。
- Git commit。
- Cloudflare publish。

第一阶段要求：

- Windows PowerShell 5.1 兼容。
- 不依赖第三方 module。
- 能独立定位仓库根。
- deterministic output。
- Check 模式无写入。
- Apply 模式只写 `ai-plugins/skill-registry.json`。

---

# 5. Phase 3：生成首份 Registry

执行 generator，创建：

```text
ai-plugins/skill-registry.json
```

然后必须验证：

- JSON 可解析。
- 所有两个 roots 下的 Skill 都被发现。
- skill 数量一致。
- id 唯一。
- version 与 `SKILL.md` frontmatter 一致。
- entry path 存在。
- references path 存在。
- 重复执行没有 diff。

不要人工手写首份 registry。

---

# 6. Phase 4：改造 `release-ai-plugins.ps1`

主脚本继续负责 orchestration。

推荐调用点：

```text
changed skill discovery
  ↓
metadata.version bump
  ↓
plugin / marketplace / changelog / README work
  ↓
registry generator
  ↓
registry validation
  ↓
git diff --check
  ↓
final validation
```

关键原则：

> Registry 必须在所有 Skill metadata.version 更新完成后生成。

主脚本需要：

- 将 `ai-plugins/skill-registry.json` 纳入明确写入白名单。
- DryRun 时不得修改 registry。
- Apply 时调用 generator Apply。
- 最终验收再次调用 generator Check。
- generator failure 必须阻断 release。

不要复制 generator 的完整实现到主脚本中。

---

# 7. Phase 5：更新 Skill 自身文档契约

更新：

```text
SKILL.md
README.md
references/release-contract.md
```

必须明确：

- registry 已成为发布一致性产物。
- generator 是独立工具。
- 主 release 入口仍是 `release-ai-plugins.ps1`。
- registry 生成顺序。
- registry stale 是阻断错误。
- registry 不包含 current commit SHA。
- 不执行 Cloudflare storage publish。

Skill 的 `metadata.version` 应按现有 release 规则合理升级，因为本次属于真实行为扩展。

---

# 8. Phase 6：处理删除与重命名

这是最容易遗漏的测试面。

Generator 必须基于**当前 working tree 全量扫描**，不能只处理 `$SkillList`。

因此：

```text
删除目录 -> registry 自动删除该 id
重命名目录 -> old id 消失 + new id 出现
```

主 release script 若目前无法优雅表达删除/重命名，不允许 generator 因此保留不存在的 Skill。

应单独决定：

- 是否新增 `-RemovedSkill` / `-RenamedSkill` 等显式参数；或
- 保持主脚本参数不变，但让最终 registry check 始终扫描真实树。

优先最小化 CLI 表面积，不要为 registry 过度增加参数。

---

# 9. Phase 7：CI Stale Gate

新增或扩展 CI：

```text
run generate-skill-registry.ps1 -Check
```

至少在以下变化时触发：

```text
ai-plugins/common-tools/skills/**
ai-plugins/dev-skills/skills/**
ai-plugins/skill-registry.json
.../generate-skill-registry.ps1
```

CI 必须：

- 只读。
- 无仓库写权限需求。
- stale -> 非零退出。
- 输出可操作的错误信息和修复命令。

禁止 CI 自动 commit 生成结果。

---

# 10. Phase 8：回归 release 流程

必须重新验证现有能力没有回退：

- DryRun 仍然无写入。
- Apply 才写文件。
- six plugin manifests 正常。
- three marketplace 校验正常。
- CHANGELOG 正常。
- README new-skill gate 正常。
- skill metadata.version 只升级真实修改 Skill。
- `git diff --check` 正常。
- Codex smoke-test 契约不受影响。

Registry 是新增职责，不应该破坏现有发布功能。

---

# 11. Phase 9：验证 Cloud MCP Contract

不要求在本次 release skill 改造中部署 Worker，但要通过静态/集成测试证明输出满足 MCP 使用方式：

```text
commit abc123
  |
  +-- ai-plugins/skill-registry.json
  +-- ai-plugins/.../SKILL.md
```

MCP 只需要 exact SHA 即可：

```text
read registry @ abc123
read skill @ abc123
```

Registry 不依赖 branch mutable state，也不依赖 Cloudflare storage。

---

# 12. 提交前检查顺序

```text
1. generator Check
2. release-ai-plugins DryRun
3. release-ai-plugins Apply（在测试分支/预期工作树）
4. generator Check
5. registry deterministic regeneration
6. JSON parse / path validation
7. existing release validation
8. git diff --check
9. CI-equivalent registry check
10. inspect git diff for whitelist violations
```

---

# 13. 禁止实现方式

禁止：

- 每次生成写 `generatedAt`。
- Registry 写当前 commit SHA。
- 使用 GitHub Action 自动回写 registry。
- Generator 调 GitHub API 获取 Skill 数据。
- Generator 从 marketplace 反推 skills。
- 只增量修改 JSON 而不全量重建。
- 让 Cloud MCP 成为 generator 的依赖。
- 在 release 脚本中增加 KV/R2 上传。
- 为了 JSON/YAML 解析随意加入新的大型运行时依赖。

---

# 14. Definition of Done

完成实现后必须同时满足：

- [ ] 独立 generator 存在。
- [ ] 首份 registry 由 generator 生成。
- [ ] 输出 byte-deterministic。
- [ ] Check/Apply 边界清晰。
- [ ] 主 release script 正确 orchestration。
- [ ] Registry 加入白名单和最终验收。
- [ ] Skill 文档契约已更新。
- [ ] CI stale gate 生效。
- [ ] 新增/修改/删除/重命名测试通过。
- [ ] 原 release 行为全部回归通过。
- [ ] Cloud MCP 可以把 registry 作为 exact-commit discovery index 使用。
