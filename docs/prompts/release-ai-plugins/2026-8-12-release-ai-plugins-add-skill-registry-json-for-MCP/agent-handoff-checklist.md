# `release-ai-plugins` Skill Registry 改造交接清单

## 1. 用途

用于把本专项规格交给后续实际编码 Agent。

真实工作负载：Skill 数量中等、更新频率高。不要重新争论已冻结的 KV/R2、commit SHA、增量 registry 等决策。

---

# 2. 架构决策

- [ ] GitHub `ai-plugins` 是唯一 Skill Source of Truth。
- [ ] `skill-registry.json` 是 generated low-churn discovery manifest。
- [ ] Registry 与 Skill tree 同 commit。
- [ ] Registry 不包含 timestamp/current commit SHA。
- [ ] Registry v1 不枚举 references/templates/examples。
- [ ] Cloud MCP latest/pinned exact-SHA 读取。
- [ ] 第一版没有 KV/R2 publish。
- [ ] 中等 Skill 数量继续 full scan，不维护增量 Registry DB。

---

# 3. Generator

- [ ] `generate-skill-registry.ps1`。
- [ ] PowerShell 5.1 / 7。
- [ ] 默认/Check 无写入。
- [ ] Apply 只写 registry。
- [ ] 扫描两个 Skill roots。
- [ ] 全量重建，不 patch old JSON。
- [ ] duplicate id 阻断。
- [ ] name/description/version 校验。
- [ ] POSIX repo-relative `entry`。
- [ ] deterministic UTF-8/LF/final newline。
- [ ] 不递归维护 deep-file list。

---

# 4. Registry Schema

必须只有 v1 discovery 字段：

- [ ] `schemaVersion`。
- [ ] fixed roots/source roots contract。
- [ ] `skills[]`。
- [ ] `id`。
- [ ] `plugin`。
- [ ] `name`。
- [ ] `description`。
- [ ] `version`。
- [ ] `entry`。

明确没有：

- [ ] `references`。
- [ ] templates/examples list。
- [ ] 正文副本。
- [ ] Cloudflare-specific fields。

---

# 5. `release-ai-plugins` 主脚本

- [ ] Registry 加入严格写入白名单。
- [ ] 所有 changed Skill version 先完成。
- [ ] DryRun 不写 registry。
- [ ] 多 Skill Apply 后只调用 generator Apply 一次。
- [ ] Final validation 只需最终 generator Check 一次。
- [ ] generator failure 阻断 release。
- [ ] 不复制 generator 算法进主脚本。
- [ ] 原 manifest/marketplace/changelog/README gate 不回退。

---

# 6. Skill 文档

- [ ] `SKILL.md` description 增加 registry/MCP 触发词。
- [ ] 核心职责增加 registry。
- [ ] 强制顺序增加集中 registry 阶段。
- [ ] stale registry 为禁止完成条件。
- [ ] README 增加 standalone Check。
- [ ] release-contract 增加 minimal registry + high-frequency maintenance 契约。
- [ ] `release-ai-plugins` 自身 version 合理升级。

---

# 7. Change Scenarios

- [ ] 修改 Skill -> version/registry 一致。
- [ ] 新增 Skill -> entry 出现。
- [ ] 删除 Skill -> entry 消失。
- [ ] 重命名 -> old 消失/new 出现。
- [ ] reference/template/example 高频变化不建立第二份文件列表索引。
- [ ] 手工修改 registry -> Check 拒绝。
- [ ] 多 Skill batch -> generator Apply invocation == 1。

---

# 8. CI

- [ ] 读取现有 workflow 后选择最小接入点。
- [ ] 轻量/path-scoped/read-only gate。
- [ ] stale fail。
- [ ] PR 可检查时优先 PR gate，dev push 保留保险。
- [ ] 不 Apply/commit/push。
- [ ] 不需要 Cloudflare/Vercel secrets。
- [ ] 错误提示带修复命令。

---

# 9. Testing

- [ ] deterministic/encoding/frontmatter/duplicate。
- [ ] add/delete/rename。
- [ ] deep-file low-churn regression。
- [ ] DryRun 零写入。
- [ ] multi-Skill one Apply + final Check。
- [ ] existing release regression。
- [ ] CI stale test。
- [ ] Cloud MCP exact-commit consumer。
- [ ] search->load optional snapshot pin contract。

---

# 10. Cloud MCP Boundary

- [ ] list/search 只需 registry。
- [ ] list/search 返回 sourceCommitSha。
- [ ] load_skill 可选使用 sourceCommitSha pin。
- [ ] load_skill 通过 entry 读取同 SHA SKILL.md。
- [ ] related files 由 Skill 内容按需同 SHA 读取。
- [ ] missing/invalid registry 不静默 fallback 全树扫描。
- [ ] Skill-only push 不要求 Worker redeploy。

---

# 11. Growth Guardrails

不得：

- [ ] 增量 Registry DB/event log。
- [ ] KV/R2 publish。
- [ ] CI bot 自动补 registry。
- [ ] vector/embedding pipeline。
- [ ] deep-file registry mirror。
- [ ] per-Skill generator full scan loop。
- [ ] 为 registry 重写现有工具链语言。

只在真实 generator time、registry size、MCP GitHub request/P95 指标证明需要时进一步优化。

---

# 12. 交付证据

最终实施 Agent 应提供：

```text
1. changed files
2. generator Check
3. generator Apply + final Check
4. deterministic/no-diff evidence
5. multi-Skill one-generation evidence
6. release DryRun
7. release Apply/regression
8. CI stale/pass
9. representative minimal registry entry
10. git diff --check
11. any unverified governance item
```

不得仅以“脚本执行成功”声称完成。
