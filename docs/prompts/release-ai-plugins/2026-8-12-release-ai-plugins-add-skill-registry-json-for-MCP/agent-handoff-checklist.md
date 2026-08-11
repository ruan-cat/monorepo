# `release-ai-plugins` Skill Registry 改造交接清单

## 1. 用途

用于把本专项规格交给后续实际编码 Agent。

Agent 不应重新争论是否使用 KV/R2、是否把 commit SHA 写入 registry 等已冻结决策。

---

# 2. 架构决策确认

- [ ] GitHub `ai-plugins` 是唯一 Skill Source of Truth。
- [ ] `ai-plugins/skill-registry.json` 是 generated discovery manifest。
- [ ] Registry 与 Skill tree 同 commit。
- [ ] Registry 不包含 `generatedAt`。
- [ ] Registry 不包含 current commit SHA。
- [ ] Cloud MCP 运行时自己 resolve `GITHUB_REF -> exact SHA`。
- [ ] 第一版没有 KV/R2 publish。

---

# 3. Generator

- [ ] 新增 `generate-skill-registry.ps1`。
- [ ] Windows PowerShell 5.1 兼容。
- [ ] PowerShell 7 兼容。
- [ ] 默认/Check 无写入。
- [ ] Apply 只写 registry。
- [ ] 扫描两个 Skill roots。
- [ ] 全量重建，不 patch 旧 JSON。
- [ ] duplicate id 阻断。
- [ ] name/description/version 校验。
- [ ] POSIX repo-relative paths。
- [ ] deterministic JSON。
- [ ] UTF-8/LF/final newline 明确。

---

# 4. Registry Schema

- [ ] `schemaVersion`。
- [ ] fixed `roots`。
- [ ] `skills[]`。
- [ ] `id`。
- [ ] `plugin`。
- [ ] `name`。
- [ ] `description`。
- [ ] `version`。
- [ ] `entry`。
- [ ] `references`。
- [ ] 没有正文副本。
- [ ] 没有 Cloudflare-specific fields。

---

# 5. release-ai-plugins 主脚本

- [ ] Registry 加入严格写入白名单。
- [ ] Registry 在 Skill version bump 后生成。
- [ ] DryRun 不写 registry。
- [ ] Apply 调 generator Apply。
- [ ] Final validation 调 generator Check。
- [ ] generator failure 阻断 release。
- [ ] 不复制 generator 算法进主脚本。
- [ ] 原 manifest/marketplace/changelog/README gate 不回退。

---

# 6. Skill 文档

- [ ] `SKILL.md` description 增加 registry/MCP 触发词。
- [ ] “核心职责固定四项”更新为包含 registry。
- [ ] 强制执行顺序增加 registry。
- [ ] 禁止完成条件增加 stale registry。
- [ ] `README.md` 增加 standalone Check 命令。
- [ ] `references/release-contract.md` 增加字段级契约。
- [ ] `release-ai-plugins` 自身 metadata.version 合理升级。

---

# 7. Change Scenarios

- [ ] 修改 Skill -> version/registry 一致。
- [ ] 新增 Skill -> registry 自动出现。
- [ ] 删除 Skill -> registry 自动消失。
- [ ] 重命名 Skill -> old 消失/new 出现。
- [ ] reference 新增/删除/移动 -> registry 路径同步。
- [ ] 手工修改 registry -> Check 拒绝。

---

# 8. CI

- [ ] 读取当前 `.github/workflows` 再决定接入点。
- [ ] Registry check 是轻量只读 gate。
- [ ] Skill/generator/registry 变化都会运行。
- [ ] PR 阶段可检查时优先检查。
- [ ] dev push 保留最终保险。
- [ ] CI 不 Apply。
- [ ] CI 不 commit/push。
- [ ] 不需要 Cloudflare/Vercel secrets。
- [ ] 错误提示包含本地修复命令。

---

# 9. Testing

- [ ] deterministic 重复生成测试。
- [ ] encoding 测试。
- [ ] frontmatter fixture 测试。
- [ ] duplicate id 测试。
- [ ] add/delete/rename 测试。
- [ ] reference 变化测试。
- [ ] DryRun 零写入测试。
- [ ] Apply 顺序测试。
- [ ] existing release regression。
- [ ] CI stale test。
- [ ] Cloud MCP consumer contract test。

---

# 10. Cloud MCP Boundary

- [ ] `list_skills` 可只读 registry。
- [ ] `search_skills` 可在 registry metadata 搜索。
- [ ] `load_skill` 按 registry entry 读取同 SHA Skill。
- [ ] sourceCommitSha 来自 Runtime SourceSnapshot。
- [ ] missing/invalid registry 不静默 fallback 全仓库扫描。
- [ ] Skill-only push 不要求 Worker redeploy。

---

# 11. 最终禁止项

不得：

- [ ] 写 registry current commit SHA。
- [ ] 写 timestamp。
- [ ] CI bot 自动补 registry commit。
- [ ] release 脚本发布 KV/R2。
- [ ] Generator 调 GitHub API。
- [ ] Generator 使用旧 registry 作为生成输入。
- [ ] 放宽 release 白名单为整个 `ai-plugins/**`。
- [ ] 为了 registry 重写现有 release 工具链语言。

---

# 12. 交付证据

最终实施 Agent 应提供：

```text
1. changed files list
2. generator Check output
3. generator Apply + second Check evidence
4. deterministic/no-diff evidence
5. release DryRun evidence
6. release Apply/regression evidence
7. CI stale/pass evidence
8. representative registry entry
9. git diff --check evidence
10. any unverified governance item (e.g. branch protection required check)
```

不得仅以“脚本执行成功”声称完成。
