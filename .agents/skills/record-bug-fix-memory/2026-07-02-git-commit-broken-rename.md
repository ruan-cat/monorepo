# 2026-07-02 AI Agent 将文件移动误拆为删除+新增两个提交

## 1. 问题现象

AI agent 在执行 `git-commit` 时分门别类拆分提交，将 `.claude/skills/` → `.agents/skills/` 的 17 个文件移动操作误判为两件独立的事：

- 提交 A：`🔪 delete` — 从 `.claude/skills/` 删除（其实际意图是迁移）
- 提交 B（待做）：新增到 `.agents/skills/`

结果：git 无法识别 rename，`git log --follow` 和 `git blame` 以为文件被删除再新建，历史链路中断。

## 2. 实际根因

AI agent 在生成 git 提交策略时，仅按「文件类型 / 修改类型」维度拆分，未检查暂存区与未追踪文件之间是否存在 **rename 语义**。

关键缺失：`git status --short` 同时出现 `D`（删除）和 `??`（未追踪新增）且文件名相同仅路径不同时，agent 应自动识别为文件移动，并合并为一个 rename 提交，而非拆成两个独立提交。

## 3. 关键误导点

- **`git diff --cached --stat` 输出**：只显示 17 files changed, 2997 deletions(-)，agent 误以为这就是一个独立的「删除」动作。
- **未追踪文件 `??` 被忽略**：`.agents/` 目录在 `git status --short` 中出现在最后一行，agent 未将它与同批次出现的 `D` 行做交叉比对。
- **UI 格式暗示**：git status 输出的 `D` 和 `??` 没有明确的「rename」标记（和 `git mv` 不同），导致 agent 没有触发 rename 识别逻辑。

## 4. 有效修复

1. `git reset --soft HEAD~1` 撤销误拆的删除提交
2. `git add .agents/` 将新增目录一并暂存
3. 重新提交，git 自动识别为 rename：
   ```plain
   rename {.claude => .agents}/skills/... (100%)
   ```
4. 17 个文件全部 100% similarity，零新增零删除

修正后的提交：`🦄 refactor(skills): 将局部技能从 .claude/skills/ 迁移至 .agents/skills/`

## 5. 验证方式

- `git diff --cached --stat` 输出显示 `{.claude => .agents}/skills/...` rename 格式，而非 delete + create
- `git log --oneline` 只有 1 个 rename 提交，无独立 delete 提交
- `git log --follow -- .agents/skills/package-linter/SKILL.md` 仍可追溯到文件在 `.claude/skills/` 时期的完整历史

## 6. 后续约束

### 6.1. git-commit 技能层面

- 在「分门别类拆分提交规范」中补充**文件移动检测**：暂存区 `D` + 未追踪 `??` 文件名相同路径不同 → 合并为一个 rename 提交
- 在步骤 1「检查暂存区与工作树状态」中增加：对比 `git status --short` 中的 `D` 行和 `??` 行，寻找路径仅前缀不同的同名文件对

### 6.2. Agent 行为层面

- 执行 `git add` 之前，必须先过一遍 `git status --short` 输出，将 `D` 行中的 basename 与 `??` 行中的 basename 做交叉比对
- 若比对命中（同名文件，不同父目录），必须视为文件移动，不得拆成两个提交
- 拆分提交时，「删除」和「新增」必须成对评估，不得单独出现

### 6.3. 破局检查点

- 看到 `git diff --cached --stat` 中有大量纯删除行 → 立即检查是否存在对应的 `??` 未追踪新增
- 优先使用 `git add`（而非 `git rm`）暂存删除 + 新增，让 git 自动判定 rename
