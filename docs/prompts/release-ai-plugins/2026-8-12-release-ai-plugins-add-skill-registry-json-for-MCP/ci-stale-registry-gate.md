# CI Stale Registry Gate 规格

## 1. 目标

保证任何进入 `dev` 的 Skill tree 都满足：

```text
current Skill tree
==
committed ai-plugins/skill-registry.json
```

CI 的职责是**阻止 stale registry 合入/进入 dev**，不是自动修复仓库。

---

# 2. 当前仓库 CI 背景

实施 Agent 必须先读取当前：

```text
.github/workflows/ci.yaml
```

以及其他 workflow，判断：

- 是否已有适合加入轻量检查的 job。
- 是否需要独立 workflow。
- 当前 CI 是否只在 push/dev 运行。
- 仓库是否已有 PR checks 约定。

不要根据本提示词假定 workflow 状态永久不变。

---

# 3. 推荐策略

优先设计一个轻量 registry check，不必启动完整 monorepo build。

推荐逻辑：

```text
checkout
  ↓
run PowerShell registry generator -Check
  ↓
PASS / FAIL
```

如果现有 CI 已能廉价复用 PowerShell，则可加入现有 workflow；否则推荐独立：

```text
.github/workflows/ai-plugins-skill-registry-check.yml
```

具体文件名不是协议的一部分，可按仓库规范调整。

---

# 4. Trigger 范围

至少关注：

```text
ai-plugins/common-tools/skills/**
ai-plugins/dev-skills/skills/**
ai-plugins/skill-registry.json
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
```

还应考虑 generator 依赖的 parsing/helper 文件。

推荐在：

```text
pull_request
push: dev
```

都执行，如果仓库当前 PR CI 策略允许。

原因：

- PR 阶段提前阻断。
- dev push 再做最终保险。

---

# 5. CI 不应写文件

CI 只能：

```powershell
generate-skill-registry.ps1 -Check
```

禁止：

```powershell
generate-skill-registry.ps1 -Apply
git add
git commit
git push
```

不需要：

```text
contents: write
```

权限保持只读。

---

# 6. 为什么不能 Bot Auto-Fix

不要采用：

```text
commit A: Skill changes
  ↓
CI bot
  ↓
commit B: registry changes
```

问题：

- commit A 本身不是自洽 snapshot。
- 云 MCP 可能在 A/B 之间读取不完整状态。
- 需要 workflow 写权限。
- 可能产生递归触发。
- PR history 噪声增加。
- release artifact 与开发者提交边界不清晰。

正确：

```text
Skill + Registry
same commit
```

---

# 7. CI 环境 PowerShell

GitHub hosted Linux runner 通常使用 `pwsh`。

实施 Agent 应根据 runner 实际能力调用：

```powershell
pwsh -NoProfile -File .../generate-skill-registry.ps1 -Check
```

同时 generator 本身仍需兼容 Windows PowerShell 5.1，便于本地 Windows 工作流。

不要为了 CI 再实现一份 Bash/Node registry generator。

---

# 8. 错误输出

CI 失败必须告诉开发者怎么修。

示例：

```text
Skill registry is stale.
Run locally:
  powershell -NoProfile -ExecutionPolicy Bypass -File ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1 -Apply
Then include ai-plugins/skill-registry.json in the same commit as the Skill changes.
```

如果 schema/metadata 错误，应输出具体 Skill/path。

---

# 9. Stale Check 不等于完整 Release Check

CI registry gate 只回答：

```text
Registry 是否是当前 Skill tree 的 canonical output？
```

它不能替代 `release-ai-plugins` 的：

- version bump 规则。
- marketplace consistency。
- CHANGELOG。
- README gate。
- Codex smoke test。

因此 registry CI 是新增的 narrow gate，不要把 release script 全部塞进每次 path-scoped CI。

---

# 10. Generator 自身变化

当：

```text
generate-skill-registry.ps1
```

发生修改，即使 Skill tree 没改，CI 也必须运行 Check。

原因：generator 新规则可能使 committed registry 变 stale。

如果 generator schema 行为修改，implementation PR 必须同时提交对应的新 registry。

---

# 11. Registry 手工修改

如果只有：

```text
ai-plugins/skill-registry.json
```

被人工编辑，而 source skills 没变，CI 仍运行 Check，并应把非 canonical 修改拒绝。

这保证 registry 不能成为人工第二真源。

---

# 12. Path Filter 与安全

Path filter 只是减少不相关 CI 运行，不是安全边界。

如果实现方式简单，也可以让 registry Check 每次 PR 都运行；该脚本应足够轻量。

不要为了节省几秒构建过度设计复杂 path-diff 脚本。

---

# 13. PR Required Check

如果仓库使用 branch protection，建议最终将 registry check 设为 `dev` 的 required status check。

但不要在本实现中假定具有管理员权限；如果无法配置 branch protection，应记录为部署/治理后续动作，而不是伪称完成。

---

# 14. CI 安全权限

Registry check 不需要：

- GitHub Token write permission。
- Cloudflare credentials。
- marketplace credentials。
- Vercel credentials。

应尽量运行在最小权限上下文。

---

# 15. Definition of Done

- [ ] Skill tree change 会触发 registry check。
- [ ] generator change 会触发 registry check。
- [ ] registry change 会触发 registry check。
- [ ] CI 只运行 Check，无 Apply。
- [ ] 无自动 commit/push。
- [ ] stale 返回非零退出。
- [ ] 错误信息包含修复命令。
- [ ] registry gate 与完整 release gate 职责分离。
- [ ] dev/PR 策略与仓库当前 CI 结构兼容。
