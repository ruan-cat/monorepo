# `skill-registry.json` 测试与验收方案

## 1. 测试目标

证明本改造同时满足：

```text
release-ai-plugins 原有行为不回退
+
registry deterministic generation
+
高频多 Skill 维护仍低摩擦
+
registry 与 Skill tree 一致
+
Cloud MCP exact-commit / optional pin 可消费
```

测试不能只验证“JSON 能生成”。

---

# 2. 测试分层

```text
Generator Unit / Fixture Tests
Registry Contract Tests
Release Integration Tests
High-frequency Batch Tests
CI Stale Gate Tests
Cloud MCP Consumer Contract Tests
Regression Tests
```

---

# 3. Generator 基础测试

必须覆盖：

- 扫描 common-tools。
- 扫描 dev-skills。
- 两个 roots 合并。
- id 稳定/全局唯一。
- plugin 派生正确。
- name/description/version 正确。
- entry path 正确。
- 不枚举 references/templates/examples。

---

# 4. Determinism Tests

同一 fixture/tree：

```text
run #1 -> output A
run #2 -> output B
A == B byte-for-byte
```

验证：

- skills 排序稳定。
- property order 稳定。
- LF/final newline 稳定。
- 不出现 timestamp/绝对路径/current commit SHA。

可计算 SHA-256 诊断，但 hash 不写入 registry。

---

# 5. Encoding Tests

PowerShell 5.1 必须验证：

- UTF-8。
- 不意外写 UTF-16 LE。
- 中文 description 正常。
- 中文/英文混合不乱码。

不能依赖 `Out-File` 默认编码。

---

# 6. Frontmatter Tests

覆盖：

- 单行 description。
- folded description。
- quoted version。
- 若仓库允许，unquoted version。

错误 fixture：

- missing frontmatter/name/description/metadata.version。
- invalid version。

全部 non-zero。

---

# 7. Duplicate ID Test

```text
common-tools/skills/foo/SKILL.md
dev-skills/skills/foo/SKILL.md
```

预期 FAIL，不静默选择。

---

# 8. 新增 / 删除 / 重命名 Test

## 新增

- `-Check` stale fail。
- `-Apply` 新增 entry。
- 再 Check PASS。
- 再 Apply 无 diff。

## 删除

- Check FAIL。
- Apply 后 old entry 消失。
- 不残留 orphan entry。

## 重命名

```text
foo -> bar
```

预期 old 消失/new 出现，不要求 Git rename detection。

---

# 9. 深层文件高频变化 Test

Registry v1 不枚举 references/templates/examples。

场景：

```text
新增 references/a.md
删除 templates/x.md
移动 examples/foo.md
```

如果 `id/name/description/version/entry` 没变化，generator 的 schema 不应因为“文件列表镜像”产生额外字段 diff。

正常 release 若认为该 Skill 行为已变化，应按既有规则 bump `metadata.version`；registry 只反映新的 version。

该测试专门防止未来 Agent 把 `references[]` 偷偷加回 v1。

---

# 10. Entry / Path Escape Test

`entry` 不能包含 `../`，也不能指向对应 Skill 目录外部。

第一版不为 symlink 设计额外能力。

---

# 11. Check Mode Test

Stale 下：

```powershell
generate-skill-registry.ps1 -Check
```

必须：

- non-zero。
- working tree 零修改。
- 输出修复命令。

Current 下 exit 0 且零写入。

---

# 12. Apply Mode Test

- 只写目标 registry。
- 写后 Check PASS。
- 第二次 Apply 无 diff。

---

# 13. Release DryRun Regression

DryRun 必须：

- 不写 SKILL.md/manifest/CHANGELOG/registry。
- 报告 Apply 将 regenerate registry。
- 执行前后 git diff 一致。

---

# 14. Release Apply Integration

Changed Skill：

```text
version 1.2.3 -> 1.2.4
```

Apply 后 registry 必须是 1.2.4，不允许旧版本残留。

---

# 15. 高频多 Skill Batch Test

一次 release 同时修改多个 Skill，例如：

```text
A body
B description
C new Skill
D reference/template
```

通过 mock/log/counter 验证主 release orchestration：

```text
generator -Apply invocation count == 1
generator -Check final invocation count == 1
```

禁止每个 Skill 都触发 full-scan generator。

同时确认所有 changed Skill 的 version 先完成，再生成 registry。

---

# 16. Existing Release Regression

确认：

- changed Skill discovery。
- 未修改 Skill 不误 bump。
- six plugin json。
- Claude/Cursor marketplace。
- Codex marketplace。
- two CHANGELOG。
- NewSkill README gate。
- `git diff --check`。
- DryRun/Apply 互斥。

Registry 改造不能降低这些约束。

---

# 17. CI Stale Test

模拟：修改 discovery 字段/version 但不 regenerate registry。

CI-equivalent Check 必须失败；Apply 后再 Check PASS。

CI 不能写仓库。

---

# 18. Manual Registry Edit Test

手工改 registry description/version，但 source Skill 不变：Check 必须失败。

证明 registry 不是人工 Source of Truth。

---

# 19. Cloud MCP Exact-Commit Consumer Test

给定 snapshot A：

```text
registry @ A
entry P
SKILL.md P @ A
```

消费者必须始终使用 A，不回退 mutable branch。

---

# 20. 高频更新 Snapshot Test

```text
branch HEAD -> A
call A resolves A
branch moves -> B
call B resolves B
```

验证：

- call A 内仍全读 A。
- 新 unpinned call B 能看到 B。
- 不需要 KV/R2 purge/upload。

---

# 21. Search -> Load Snapshot Pin Test

场景：

```text
search_skills @ A
returns skill + sourceCommitSha=A
branch moves -> B
load_skill(skillId, sourceCommitSha=A)
```

预期：load 仍读取 A。

另测：

```text
load_skill(skillId)
```

未提供 pin 时读取最新 B。

还必须确认 pinned 输入不能覆盖配置的 owner/repo。

该测试证明高频 push 期间不需要 server session 也可维持跨 tool-call 复现性。

---

# 22. Performance Sanity

Generator 是发布/CI 工具，不做极端优化，但应避免：

- 对每个 Skill 启新进程。
- 重复读取同一 SKILL.md。
- 扫描整个 monorepo。
- 多 Skill release 中重复 full scan。

Cloud MCP 记录/测量：

- registry byte size。
- skill count。
- GitHub requests per tool call。
- tool P50/P95。

只有真实指标显示瓶颈才进入下一优化阶段。

---

# 23. Acceptance Checklist

## Generator

- [ ] Check/Apply 正确。
- [ ] deterministic / encoding 正确。
- [ ] duplicate/missing metadata 阻断。
- [ ] add/delete/rename 正确。
- [ ] 不枚举深层附属文件。

## Release

- [ ] DryRun 零写入。
- [ ] 多 Skill Apply 只集中生成一次 registry。
- [ ] Registry 白名单正确。
- [ ] Skill version 与 registry version 一致。
- [ ] 原 release 全部回归通过。

## CI

- [ ] stale fail / canonical pass。
- [ ] 只读/path-scoped。

## MCP Contract

- [ ] exact-commit registry 可消费。
- [ ] list/search 返回 sourceCommitSha。
- [ ] load_skill optional sourceCommitSha pin 正常。
- [ ] 深层文件按需同 SHA 读取。
- [ ] Skill 更新不需要 Worker redeploy/storage sync。

## Growth Policy

- [ ] 没有增量 registry DB。
- [ ] 没有 KV/R2/vector search 提前复杂化。
- [ ] 未来优化由真实指标触发。
