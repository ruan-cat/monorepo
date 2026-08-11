# `skill-registry.json` 测试与验收方案

## 1. 测试目标

证明这次改造同时满足：

```text
release-ai-plugins 原有行为不回退
+
registry deterministic generation
+
registry 与 Skill tree 一致
+
Cloud MCP exact-commit 可消费
```

测试不能只验证“JSON 能生成”。

---

# 2. 测试分层

```text
Generator Unit / Fixture Tests
        ↓
Registry Contract Tests
        ↓
Release Integration Tests
        ↓
CI Stale Gate Tests
        ↓
Cloud MCP Consumer Contract Tests
        ↓
Regression Tests
```

---

# 3. Generator 基础测试

必须覆盖：

- 扫描 common-tools。
- 扫描 dev-skills。
- 两个 roots 合并。
- id 稳定。
- plugin 派生正确。
- name 解析正确。
- folded/multiline description 正确。
- metadata.version 正确。
- entry path 正确。
- reference paths 正确。

---

# 4. Determinism Tests

同一 fixture/tree：

```text
run #1 -> output A
run #2 -> output B
A == B byte-for-byte
```

至少验证：

- skills 排序稳定。
- references 排序稳定。
- property order 稳定。
- LF 稳定。
- final newline 稳定。
- 不出现 timestamp。
- 不出现绝对路径。

可额外计算 SHA-256 方便诊断，但 hash 不写入 registry。

---

# 5. Encoding Tests

PowerShell 5.1 是重要风险面。

必须验证生成文件：

- UTF-8。
- 不意外写 UTF-16 LE。
- JSON parser 可正常读取中文 description。
- 中文/英文混合内容不乱码。

如果项目规范要求 UTF-8 BOM 与本规格不同，应显式统一并更新契约；不能依赖 `Out-File` 默认行为。

---

# 6. Frontmatter Tests

Fixture 至少包含：

## 单行 description

```yaml
description: simple description
```

## folded description

```yaml
description: >-
  first line
  second line
```

## quoted version

```yaml
metadata:
  version: "1.2.3"
```

## unquoted version（如果当前仓库允许）

```yaml
metadata:
  version: 1.2.3
```

错误 fixture：

- missing frontmatter。
- missing name。
- missing description。
- missing metadata.version。
- invalid version。

都必须 non-zero。

---

# 7. Duplicate ID Test

构造：

```text
common-tools/skills/foo/SKILL.md
dev-skills/skills/foo/SKILL.md
```

预期：

```text
FAIL
Duplicate skill id foo
```

不能静默选择其中一个。

---

# 8. 新增 Skill Test

初始：

```text
registry without foo
```

新增：

```text
skills/foo/SKILL.md
```

预期：

- `-Check` 先失败 stale。
- `-Apply` 后 registry 新增 foo。
- 再 `-Check` PASS。
- 再 Apply 无 diff。

---

# 9. 删除 Skill Test

删除真实目录后：

- `-Check` FAIL stale。
- `-Apply` 后旧 entry 消失。
- 不残留 orphan entry。

这是验证“全量重建而非增量 patch”的关键测试。

---

# 10. 重命名 Skill Test

```text
foo -> bar
```

预期 registry：

```text
foo disappears
bar appears
```

不要求 generator 做 Git rename detection。

---

# 11. Reference 变化测试

新增 reference：

```text
references/a.md
```

registry 应新增 path。

删除 reference：

registry 应删除 path。

移动 reference：

old path 消失/new path 出现。

Path 必须使用 `/`。

---

# 12. Entry / Path Escape Test

任何派生 path 都不能包含：

```text
../
```

或指向 skill root 外部。

如果实现允许 symbolic link，需要明确是否解析/拒绝；第一版建议不为 symlink 设计额外能力，按仓库真实普通文件处理。

---

# 13. Check Mode Test

在 stale registry 下执行：

```powershell
...generate-skill-registry.ps1 -Check
```

必须：

- non-zero。
- working tree 不发生任何修改。
- 输出修复命令。

在 current registry 下：

- exit 0。
- 不写文件。

---

# 14. Apply Mode Test

执行 Apply：

- 只允许目标 registry 被 generator 写入。
- 写入后自动/后续 Check PASS。
- 第二次 Apply 无 diff。

---

# 15. Release DryRun Regression

执行现有 `release-ai-plugins.ps1` DryRun：

必须保证：

- 不写 SKILL.md。
- 不写 manifest。
- 不写 CHANGELOG。
- 不写 registry。
- 输出 registry 将被 regenerate 的计划信息。

DryRun 结束后：

```text
git diff
```

与执行前一致。

---

# 16. Release Apply Integration

准备一个真实 changed Skill fixture/测试工作树：

```text
Skill old version 1.2.3
```

Apply 后：

```text
SKILL.md version 1.2.4
registry entry version 1.2.4
```

不能出现 registry 仍为 1.2.3。

这验证 generator 调用顺序正确。

---

# 17. Existing Release Regression

必须确认原有功能继续通过：

- changed Skill 自动/显式发现。
- 未修改 Skill 不被误 bump。
- six plugin json 版本关系。
- Claude/Cursor marketplace 版本。
- Codex marketplace 字段规则。
- two CHANGELOG。
- NewSkill README gate。
- `git diff --check`。
- DryRun/Apply 互斥。

Registry 改造不能降低这些约束。

---

# 18. CI Stale Test

模拟：

```text
modify SKILL.md
DO NOT regenerate registry
```

CI-equivalent `-Check` 必须失败。

然后 Apply generator，再 Check：

```text
PASS
```

---

# 19. Manual Registry Edit Test

手动改变 registry description/version，但不改 source Skill：

`-Check` 必须失败，并恢复 canonical output 后通过。

证明 registry 不是人工真源。

---

# 20. Cloud MCP Consumer Contract Test

无需真实部署 Worker，也可写 contract test：

给定 fixture commit/tree：

```text
registry entry.entry = path P
```

消费者应能：

```text
read registry
find skill id
read path P
```

并验证 entry 对应文件存在。

如果集成测试可以调用 GitHub fixture commit，则进一步验证：

```text
registry @ commit A
skill @ commit A
```

而不是 mutable branch。

---

# 21. 高频更新 Snapshot Test

概念/集成测试：

```text
branch HEAD -> commit A
call A resolves A
branch moves -> commit B
call B resolves B
```

验证：

- call A 内所有读取仍使用 A。
- call B 能看到 B。
- 不需要 purge KV/R2。

该测试属于云 MCP 实现，但 registry release contract 必须支持它。

---

# 22. Performance Sanity

Generator 是发布/CI 工具，不需要极端优化。

但应避免：

- 对每个 Skill 启动新的外部进程。
- 重复读取同一 SKILL.md 多次。
- 无必要扫描整个 monorepo。

目标扫描范围严格限制两个 skill roots。

---

# 23. Acceptance Checklist

## Generator

- [ ] Check/Apply 正确。
- [ ] deterministic。
- [ ] encoding 正确。
- [ ] duplicate/missing metadata 阻断。
- [ ] add/delete/rename/reference 测试通过。

## Release

- [ ] DryRun 零写入。
- [ ] Apply 顺序正确。
- [ ] Registry 白名单正确。
- [ ] Skill version 与 registry version 一致。
- [ ] 原 release 全部回归通过。

## CI

- [ ] stale registry fail。
- [ ] canonical registry pass。
- [ ] CI 不写仓库。

## MCP Contract

- [ ] exact-commit registry 可消费。
- [ ] registry 不含自引用 commit SHA。
- [ ] Skill 更新不需要 Worker redeploy/storage sync。
