---
name: record-bug-fix-memory
description: 当用户要求在 bug 已经定位并修复后，记录排错经验、事故结论、AI 记忆更新、复盘摘要或本地 MCP 记忆时使用。这个技能只负责沉淀"发生了什么、为什么会发生、如何修好、以后要记住什么"，不要把它用于实际修复 bug。
---

# 记录 Bug 修复记忆

## 概述

使用这个技能，把已经完成的排错结果沉淀成可复用的长期记忆。

目标是保存根因、有效修复路径、错误假设和验证证据，让后续 agent 不再重复同样的弯路。

核心原则：记录决策链，不记录流水账。

## 何时使用

在以下场景使用这个技能：

- 用户要求更新 AI 记忆文档、记录经验教训、补充事故记录、编写复盘摘要。
- bug 已经完成复现，且有效修复路径已经明确。
- 这条经验是仓库特有知识，应该对未来 agent 可见。
- 需要把结论同步到本地 MCP 记忆，例如 Memorix。

以下情况不要使用这个技能：

- bug 还在调查中，根因没有确认。
- 用户要求的是修复实现，而不是经验沉淀。
- 你手里只有猜测、片段证据或临时绕过方案。

## 前置输入

开始写记忆前，必须能回答下面六个问题：

1. 对用户来说，表面现象是什么？
2. 实际根因是什么？
3. 哪个错误假设或误导信号浪费了时间？
4. 最终是哪一个具体改动修好了问题？
5. 用什么验证证明修复成立？
6. 这条记忆应该写到哪里？

如果有任何一个问题答不上来，先完成排错，不要提前写记忆。

## 写到哪里

- 仓库级、可复用的规则：写到根级 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md`
- 跨会话的本地记忆：写到 Memorix，类型用 `gotcha`、`decision` 或 `problem-solution`
- 包级 prompts、plans、reports：只有用户明确要求时才写进去

默认规则：只要这条经验会影响整个仓库里的未来 agent，就优先写入三个根级 AI 记忆文档，不要埋进包级备注里。

## 记录什么

每条记忆至少要覆盖这六件事：

1. 问题现象：从用户视角看，哪里坏了
2. 根因：真正出错的地方
3. 关键线索：哪条信号把问题从假象拉回真实根因
4. 有效修复：真正解决问题的改动
5. 验证方式：证明修复成功的证据
6. 后续约束：未来 agent 必须先检查什么、避免什么

## 记忆模板

使用简洁、面向未来复用的结构：

- `问题现象：...`
- `根因：...`
- `关键误导点：...`
- `有效修复：...`
- `验证方式：...`
- `后续约束：...`

这些句子应该帮助未来 agent 快速做对事，而不是复述完整排错过程。

## 仓库级经验库

当用户要求"补充 AI 记忆"时，不要只写当次 bug 的表面结论。先检查这次问题是否落在仓库已有事故模式里，再把对应经验合并写入记忆。

### 本 monorepo 的 Git 状态与 Cursor「幽灵修改」（2026-03）

- **问题现象**：提交或处理完成后，`git status` 仍显示某文件为已修改（`M`），但 **`git diff` / `git diff HEAD` 无输出**；或侧栏/编辑器仍显示红绿 diff，与命令行不一致。用户易误判为「Git 坏了」或「仓库损坏」。
- **实际根因（多因叠加，需交叉验证）**：
  1. **索引与状态缓存**：全局启用 `core.fsmonitor`、`core.untrackedCache` 时，偶发出现「stat 认为变了、内容未变」；或对某文件执行 `git add` 后刷新索引，状态即恢复干净。
  2. **编辑器 / Cursor**：Diff 视图默认 **`diffEditor.maxComputationTime`** 约 5s，大仓库或大文件上 diff 算不完会导致**界面与真实 Git 状态脱节**（侧栏仍显示有改动）。
  3. **钩子与格式化**：`lint-staged` + Prettier 若在提交过程中改写文件，会产生**新的真实 diff**，需再次暂存/提交，勿与「幽灵」混淆。
  4. **误判 `git ls-files -v` 首字母**：在 Git 2.50+ 中 `-t` 下 **`H` 表示 cached（已缓存）**，勿与「assume-unchanged」混淆；空 diff 时勿仅凭首字母下结论。
- **关键线索**：`git hash-object <文件>` 与 `git rev-parse HEAD:<路径>` 若一致，则**工作区内容与最后一次提交一致**，问题在 UI 或索引缓存，而非内容丢失。
- **关键误导点**：以为「无 diff 却有 modified」一定是 CRLF；本案例中也可能是 **索引未刷新** 或 **IDE 未刷新**，需先区分命令行真值与 UI。
- **有效修复**：
  1. 命令行：对可疑文件执行 **`git add <路径>`** 或 **`git update-index --refresh`**，再 **`git status`**。
  2. 本仓库已在 **`.vscode/settings.json`** 增加：`diffEditor.maxComputationTime` 为 `0`、`git.ignoreLimitWarning`、`editor.colorDecoratorsLimit`（见提交 `1071cd6` 附近），减轻 Cursor/VS Code 侧假阳性。
  3. 排查时可临时：`git -c core.fsmonitor=false -c core.untrackedCache=false status` 对照。
- **验证方式**：修复后 **`git status` 干净**；**`git diff` 与 `git diff HEAD` 均为空**；需要时 **`git push` 后再次 `status`**，确认无配置文件被再次标改。
- **后续约束**：遇到「只有本仓库、别仓库没有」时，优先查 **本仓库 `.vscode/settings.json`**、**`.gitattributes`（eol=lf）** 与用户 **全局 `~/.gitconfig`**（fsmonitor、autocrlf），再怀疑 Git 安装损坏。

### Windows CRLF 残留导致「循环幽灵 modified」（2026-03）

- **问题现象**：`git status` 反复显示某文件 `modified`，但 `git diff` / `git diff HEAD` 无任何输出；`git add` 后暂时干净，下次打开 IDE 或系统事件触碰文件后又恢复 `modified`，形成循环，无论执行多少次 `git add` 都无法根治。
- **实际根因**：磁盘文件是 **CRLF 行尾**（物理大小较大），git blob 存的是 **LF**（较小），`.gitattributes` 明确要求 `eol=lf`。Git 校验 stat 缓存时同时比对 **mtime + size**：CRLF 文件比 LF blob 多 N 字节（每行多一个 `\r`），只要 mtime 一变（IDE 打开、杀毒扫描、系统事件），stat 必然 miss → 强制重新 hash。重新 hash 时 Git 先归一化 CRLF→LF 再计算，结果与 blob 一致 → diff 为空、文件「干净」；但 **Windows 上 Git 不总是把这次「重检后为干净」的结果回写 stat 缓存**，下次 `git status` 再次 miss，陷入死循环。
- **关键诊断信号**：运行 `git ls-files --eol <文件>`，看到 `i/lf  w/crlf  attr/text eol=lf` 即可确诊——index (blob) 是 LF，工作区是 CRLF，gitattributes 要求 LF。三个 hash（`git hash-object`、`git rev-parse :path`、`git rev-parse HEAD:path`）完全一致是正常的（hash 算时归一化过），**不能用 hash 相等否定 CRLF 残留**。
- **关键误导点**：三个 blob hash 完全一致 → 误以为内容无差异、问题在 IDE；`git diff` 为空 → 误以为 `assume-unchanged` 或 fsmonitor 问题。真正的关键是**物理文件大小**：CRLF 文件比 blob 大（差值 = 行数），只要 size 不同，stat miss 就永远无法靠缓存命中绕过。
- **有效修复**：
  1. 用 `git ls-files --eol | Select-String "w/crlf"` 列出所有受影响文件（本次 63 个）。
  2. 用 PowerShell 逐字节将这些文件从 CRLF 转换为 LF（不依赖 `git checkout`，因为 `git add --renormalize` 已刷新 stat 缓存后 checkout 会认为文件未变而跳过）。
  3. 执行 `git add --renormalize .` 刷新 index stat 缓存，使磁盘 LF 文件的 size 与 blob size 完全一致。
- **为何 `git checkout -- .` 无效**：`git add --renormalize .` 把 stat 缓存更新为 CRLF 文件的 size 后，`git checkout` 比对 stat 认为文件「未改变」，直接跳过写入，所以磁盘文件维持 CRLF 不变。必须先直接改磁盘字节，再刷新缓存。
- **验证方式**：`git ls-files --eol | Select-String "w/crlf"` 输出为空；`git status` 显示 `nothing to commit, working tree clean`；用 PowerShell 读文件字节确认 CRLF 计数为 0、文件大小与 blob size 一致。
- **后续约束**：遇到「反复幽灵 modified 且 diff 为空」时，**第一步先执行 `git ls-files --eol <文件>`**，看 `w/` 字段是否为 `crlf`；若是，则走 CRLF 字节转换流程，而不是反复 `git add` 或排查 IDE。本仓库 `.gitattributes` 已配置 `*.* text eol=lf`，CRLF 文件是历史遗留（可能来源于 Git 系统配置 `core.autocrlf=true` 曾短暂生效时的 checkout）。

新增事故记录时，可继续追加 `### {模块/包名} 的 {事故简述}` 小节，仍沿用下列字段：

- 问题现象 / 实际根因 / 关键线索 / 关键误导点 / 有效修复 / 验证方式 / 后续约束

## 写入经验时必须保留的额外信息

如果这次 bug 与仓库已有事故模式相似，写记忆时不要遗漏下面这些额外信息：

- 这次问题是否打破了某个"用户已确认稳定"的基线
- 是否存在"不要乱改"的配置
- 首个可信信号来自哪里，是终端日志、浏览器 console、网络请求，还是构建输出
- 这次修复属于哪一类：依赖实例统一、废弃 API 清理、导入路径修正、类型断言补齐、构建配置兜底、依赖入口兼容、模板层覆盖、样式层补齐、还是启动前置准备
- 这次是否存在误导性很强的假象
- 最终验证是否基于 fresh 进程、fresh 日志和 fresh 页面，而不是历史缓存

## 验证证据写法

未来写事故记录时，优先记录可重复验证的证据，而不是模糊措辞。

- 好的写法：`pnpm exec tsc --noEmit 输出中相关错误为 0`
- 好的写法：`fresh dev.stderr 为空`
- 好的写法：`修复文件均无类型错误输出`
- 好的写法：`pnpm install 后依赖版本一致，peer dependency 无冲突`
- 不好的写法：`应该没问题了`
- 不好的写法：`看起来像是好了`

## 不要写成什么

把根级 AI 记忆经验吸收到技能里，不等于把技能写成修复手册。下面这些内容不应该成为这个技能的主体：

- 大段命令执行流水
- 与当前仓库无关的泛化 debug 理论
- 逐条罗列所有试错过程
- 把某一次临时绕过方案包装成永久规则
- 用"必须执行这些命令"代替"应该记录哪些结论"

## 记录流程

1. 先确认 bug 已经理解清楚并且修复完成。
2. 把结果压缩成 4 到 6 条高信号事实。
3. 选对记忆落点。
4. 如果是仓库级经验，就更新根级 AI 记忆文档。
5. 用同样的结论更新 Memorix，并选对记忆类型。
6. 回读一遍文本，删掉瞬时噪音、猜测和低价值命令历史。
7. 如果用户还要求提交 commit，把提交动作交给单独的 git 工作流处理。

## 好记忆的特征

- 解释清楚"为什么会坏"，而不是只写跑了什么命令
- 明确指出第一条可信线索，说明它如何打破错误假设
- 用可复用的方式描述最终修复
- 写出未来 agent 可以重复执行的验证动作
- 让下一次排错明显更短

## 常见错误

- 根因还没确认，就开始写猜测性结论
- 写成很长的 debug 日记，而不是可复用结论
- 仓库级经验写到了错误的位置
- 没把导致绕路的错误假设写出来
- 把修复说明和记忆沉淀混在一起
- 忘了同步本地 MCP 记忆

## 边界

这个技能只负责记忆沉淀和总结。

它不能替代调试、实现、测试和修复工作流。如果 bug 还没修好，先使用合适的调试或实现技能，等结果稳定后再回到这个技能做经验沉淀。
