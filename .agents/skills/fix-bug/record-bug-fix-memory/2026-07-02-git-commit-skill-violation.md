## 现象

AI agent 在执行 git-commit 分门别类拆分时，连续出现三次技能执行错误：

1. **提交类型 emoji 错误**：`style` 类型使用了 💅，但 `git-commit` 技能 `commit-types.ts` 规定 `style` 的 emoji 为 🌈
2. **publish 发版不完整**：未按 `release-ai-plugins` 技能要求先同步 6 个 marketplace/plugin.json 版本文件，就提交了 CHANGELOG
3. **反复 reset 补救**：发现问题后反复 `git reset --soft HEAD~N` 重提交，导致提交过程混乱，最终推送时远端已有更新，触发 rebase 冲突
4. **rebase 冲突处理**：远端在提交期间推送了新版本，导致 rebase 时 7 个文件全部冲突，需批量解决

## 根因

- **未查阅技能来源优先级**：`git-commit` 技能明确规定 Emoji 和 Type 必须查阅 `commit-types.ts` 中的定义，而非凭记忆或猜测选取 emoji
- **publish 流程不完整**：`release-ai-plugins` 技能要求「先同步双平台 marketplace 和双插件 manifest」，即 6 个版本文件，但 agent 只更新了 CHANGELOG，遗漏了版本文件同步
- **git 操作缺乏预规划**：先提交 3 个提交，发现问题后反复 reset，而不是一次性规划正确后再执行
- **未先拉取远端**：提交前未 `git fetch` 确认远端状态，导致 push 被拒后才处理 rebase

## 关键误导点

- **💅 不是 style 的 emoji**：agent 误以为 💅（nail polish）是合适的 style emoji，实际上 commit-types.ts 规定 `style` 是 🌈（rainbow），表示代码格式化
- **publish 不仅是 changelog**：agent 误以为 publish 提交就是写 changelog，实际上 publish 是版本号同步 + changelog 的组合，必须覆盖所有版本文件
- **rebase 冲突的假象**：看到 7 个文件冲突时以为合并会很复杂，但实际上所有冲突都是同一模式（HEAD=7.5.0 vs 我的=7.6.0），批量 checkout --theirs 即可解决

## 修复

1. **回退所有提交**：`git reset --soft HEAD~3` 撤销错误提交，保留变更内容
2. **同步版本文件**：按 `release-ai-plugins` 技能要求，更新 6 个版本文件（.claude-plugin/marketplace.json、.cursor-plugin/marketplace.json、common-tools/.claude-plugin/plugin.json、common-tools/.cursor-plugin/plugin.json、dev-skills/.claude-plugin/plugin.json、dev-skills/.cursor-plugin/plugin.json）从 7.5.0 → 7.6.0
3. **重新按正确类型提交**：
   - `publish(ai-plugins)` 📢：6 个版本文件 + CHANGELOG
   - `feat(init-simple-memorix)!` ✨：SKILL.md v2.0.0 + 5 个新增模板
   - `style(init-simple-memorix)` 🌈：5 个项目级模板缩进统一
4. **处理远端更新**：`git stash` 无关文件 → `git pull --rebase origin dev` → 批量 checkout --theirs 解决 7 文件冲突 → `git rebase --continue` → `git push` → `git stash pop` 恢复无关文件

## 验证

- `git log --oneline --graph` 确认线性历史无 merge commit
- 6 个版本文件全部确认 `7.6.0`
- 3 个提交全部使用正确的 emoji 和 type
- `origin/dev` 已 fast-forward 推送成功

## 教训

1. **执行 git-commit 前必须先查阅 commit-types.ts**：禁止凭记忆选 emoji，必须通过 `commit-types.ts` 或远程 raw 确认映射关系
2. **publish 提交必须先同步所有版本文件**：release-ai-plugins 技能要求 6 个文件（2 marketplace + 4 plugin.json），缺一不可
3. **git 操作不要反复 reset**：先规划好拆分方案，确认 emoji/type/scope 全部正确后再执行提交，避免补救式 reset
4. **提交前拉取远端**：`git fetch origin` 确认远端状态，避免 push 被拒后再处理 rebase
5. **stash 无关文件再 rebase**：本地有未提交文件时，先 stash 再 rebase，避免无关文件干扰冲突处理
