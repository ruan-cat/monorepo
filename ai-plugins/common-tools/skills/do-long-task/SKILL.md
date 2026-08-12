---
name: do-long-task
description: >-
  当复杂开发、修复、重构、迁移、验证或 OpenSpec change 需要跨 checkpoint 持续推进、上下文恢复，
  或需要把进度与失败记录严格存放在具体 OpenSpec change 或 archive 目录内时使用；当用户要求生成
  Claude Code `/goal`、Codex `/goal` 或 do-long-task 长任务提示词时也使用。不要用于一次性短改、
  问答、简单格式化、changeset、发版日志或纯计划讨论。 Use when a complex development, fix, refactor,
  migration, verification, or OpenSpec change must be advanced across resumable checkpoints, recovered after
  context loss, or executed with durable progress and failure notes that stay inside the concrete OpenSpec change
  or archive directory. Also use when the user asks to generate a Claude Code `/goal`, Codex `/goal`, or
  do-long-task prompt. Do not use for short one-off edits, Q&A, simple formatting, changesets, release notes, or
  pure planning.
user-invocable: true
metadata:
  version: "1.4.0"
---

# do-long-task

这是一个面向长任务执行的入口 skill。它不负责替你决定“大任务做什么”，而是负责把已经确定的长任务稳定推进到底。

## 提示词生成模式

当用户要求“生成 Claude Code `/goal` 或 Codex `/goal` 提示词”“生成长任务执行提示词”“用 do-long-task 写 1500 字以内提示词”时，进入提示词生成模式。

提示词生成模式只做一件事：输出一段可复制给 Claude Code `/goal` 或 Codex `/goal` 使用的长任务执行提示词。不要开始执行该长任务。

生成提示词时：

- 不修改 OpenSpec 工件。
- 不创建或更新 `agent-progress.md` / `agent-findings.md`。
- 不运行测试、lint、typecheck 或 validate 命令。
- 不把聊天 checklist 当任务源。
- 默认把最终提示词控制在 1500 字以内；如果用户指定更短或更长的字数限制，以用户指定为准。
- 如果用户没有提供 `openspec/changes/<change-name>` 或 `tasks.md` 路径，不要臆造路径；输出带 `<change-name>` 的占位模板，并列出需要用户补齐的占位符。

提示词必须保留 do-long-task 的核心纪律：读取 OpenSpec 工件、只使用 `tasks.md` 作为唯一任务源、小步推进、动态补全遗漏任务、严格定位 `agent-progress.md` / `agent-findings.md`、维护进度与失败记录、验证后再勾选完成、遇到真正阻塞才暂停。

详细模板、占位符策略和裁剪规则见 `references/codex-goal-prompt.md`。按 `AGENT_LONGTASK.md` 的读取路由只加载相关 reference，不要无脑读取全部长文。

## 协作声明

- 需要协作的全局技能是 `openspec`。执行 OpenSpec change 时，先使用 `openspec` 理解 `proposal.md`、`design.md`、`specs/` 和 `tasks.md` 的工件链。
- 业务项目内如果存在项目级 OpenSpec 技能，必须先发现并读取，再执行 change。按项目根目录优先检查 `.claude/skills`、`.codex/skills`、`.agents/skills`、`.agent/skills` 中与 `openspec` 相关的技能入口；只读取当前任务需要的技能与 reference，不把外部分发 skill 的默认规则置于项目规则之上。
- 当检测到当前任务位于 `openspec/changes/<change>` 下时，必须以当前 OpenSpec 工件链为准，`tasks.md` 是唯一可执行任务源。
- 长任务执行中发现遗漏任务时，先更新当前 change 的 `tasks.md`，再继续执行。
- 不得只把遗漏任务写在聊天 checklist、`agent-progress.md` 或子代理报告里。

## 固定产物位置门禁

执行模式下，必须先确定唯一的 OpenSpec change 根目录，再创建或更新 `agent-progress.md` / `agent-findings.md`。

规范位置只有两类：

- 正在执行的 change：`openspec/changes/<change-name>/agent-progress.md` 与 `openspec/changes/<change-name>/agent-findings.md`
- 已归档的 change：`openspec/changes/archive/**/<change-name>/agent-progress.md` 与 `openspec/changes/archive/**/<change-name>/agent-findings.md`

确定 change 根目录时，按优先级判定：

1. 用户明确给出的 `openspec/changes/<change-name>`、`openspec/changes/<change-name>/tasks.md` 或 archive 下的具体 change 目录。
2. 当前工作目录位于某个 `openspec/changes/<change-name>` 或 `openspec/changes/archive/**/<change-name>` 内。
3. 扫描到唯一一个与用户目标、`tasks.md` 标题或当前 checkpoint 明确匹配的 change 目录。

如果无法唯一确定 change 根目录，不要在当前目录、仓库根目录、`openspec/changes/` 顶层、`openspec/changes/archive/` 顶层、普通报告目录或 skill 目录中创建这两个文件；先提示用户补齐 change 路径。

## 错位文件检查与迁移

执行模式每次启动、恢复、上下文压缩后、创建固定产物前，以及完成前，都要检查工作区内是否已有错位文件。可使用 `rg --files -g agent-progress.md -g agent-findings.md` 或等价文件搜索。

对每个命中的 `agent-progress.md` / `agent-findings.md`：

1. 判断路径是否位于规范 active change 根目录或 archive change 根目录。
2. 若路径不规范，立即警告用户：列出相对路径、为什么不规范、准备迁移到哪个 change 目录、归属证据是什么。
3. 若当前任务已唯一确定 active change，把错位内容迁移或合并到该 change 根目录对应文件；目标文件已存在时，追加一个 `## Migrated from <relative-path> on <YYYY-MM-DD>` 小节，保留原文和迁移原因。
4. 若内容属于已归档任务，且能唯一识别 archive 下的具体 change 目录，把内容迁移或合并到 `openspec/changes/archive/**/<change-name>/` 的对应文件。
5. 若存在多个候选 change、无法从内容识别归属，或迁移可能覆盖已有记录，停止并询问用户；不要猜测、不要把多个长任务继续累积到同一个文件。
6. 迁移后回读目标文件确认内容存在，再删除错位源文件；不能确认时保留源文件并记录风险到目标 `agent-findings.md` 或当前汇报。

不要把迁移理解为“整理到 reports”。这两个文件是 OpenSpec change 的附属状态文件，只能跟随具体 active change 或 archive change。

## 什么时候用

- 需要跨多个步骤持续推进的开发、修复、重构、迁移或验收任务。
- 任务会经历上下文压缩、会话中断、测试失败、恢复续跑。
- 任务必须把计划、进度、发现、失败和验证写入文件，而不能依赖聊天记忆。
- 任务已经有明确的唯一主任务源，通常是 OpenSpec 的 `tasks.md`。

## 什么时候不要用

- 单文件小改动或一次性格式化。
- 只是在回答问题、解释方案，或者还在做需求探索。
- 写 `changeset`、提交信息、更新日志这类短任务。
- 不需要 checkpoint、恢复续跑、失败记录的简单操作。

## 先读什么

开始前先读这些文件，再动手：

1. `AGENT_LONGTASK.md`（如果存在）
2. 按 `AGENT_LONGTASK.md` 读取路由选中的 `references/*.md`
3. 当前 skill 的 `SKILL.md`
4. 业务项目内 `.claude/skills`、`.codex/skills`、`.agents/skills`、`.agent/skills` 中与 OpenSpec 相关的项目级技能
5. 当前 OpenSpec change 的 `proposal.md`
6. 当前 OpenSpec change 的 `design.md`
7. 当前 OpenSpec change 的 `specs/*/spec.md`
8. 当前 OpenSpec change 的 `tasks.md`
9. 先扫描并处理错位的 `agent-progress.md` / `agent-findings.md`
10. change 根目录的 `agent-progress.md`
11. change 根目录的 `agent-findings.md`

如果这些文件里有缺失，就先补齐，再继续。

## 核心纪律

- 任务源只用一份。若项目使用 OpenSpec，就以 `openspec/changes/<change-name>/tasks.md` 为唯一任务清单。
- 不要再创建第二套任务系统，也不要把聊天里的临时 checklist 当主任务源。
- 每次只处理一个明确的 task 或一个明确 checkpoint。
- 不要跳过未完成任务。
- 不要把未验证的内容标记为完成。
- 代码修改后必须做相关验证。
- OpenSpec 工件链必须完整维护：先读 `proposal.md`、`design.md`、`specs/*/spec.md`、`tasks.md`，再动手；发现遗漏任务先扩展 `tasks.md`；改变用户可见行为先同步 `specs/*/spec.md`；改变技术路线先同步 `design.md`。
- 过程报告、进度文档、调研文档若需要保存在当前 OpenSpec change 内，必须放入 `tasks.md` 或项目 OpenSpec 规范明确指定的子目录，并使用 `YYYY-MM-DD-*.md` 命名；不得在 change 根目录散放 markdown。
- change 根目录只保留 OpenSpec 核心工件、`agent-progress.md`、`agent-findings.md` 以及项目规范明确允许的根级文件；不要把阶段报告、验证报告、调研记录直接写到根目录。
- `agent-progress.md` 固定在 change 根目录，不能移动、改名或日期化；只记录 checkpoint、当前 task、核心进度、验证摘要和下一步，不承载超长执行流水。
- `agent-findings.md` 固定在 change 根目录，不能移动、改名或日期化；只记录核心痛点、风险、失败索引、禁止重复路径和待办入口，不承载完整长报告。
- 新建、读取、写入这两个文件前必须先通过位置门禁；若发现仓库根目录、普通 reports 目录、skill 目录或多个任务共用的错位文件，先警告并迁移到具体 active/archive change，再继续执行。
- 当 `agent-progress.md` 或 `agent-findings.md` 过长时，先压缩为摘要和索引；详细日志、证据或调研内容迁入 `tasks.md` 指定的日期化子目录或证据文件。
- 不要每个小步骤都问用户是否继续，除非遇到真正阻塞。
- 只有遇到权限问题、破坏性风险、需求冲突、产品决策问题，或连续 3 次同类失败时，才暂停并请求用户介入。

## 状态文件 harness 控制

`agent-progress.md` 与 `agent-findings.md` 是交接状态文件，不是事件日志、聊天转储或原始输出仓库。违反以下写入契约会制造上下文噪音：

### `agent-progress.md`：覆盖式快照

- 每次 checkpoint 或 task 边界更新当前快照；修改现有状态，不按命令或对话逐条追加。
- 快照只保留：当前 checkpoint、当前 task、状态、最近验证摘要、阻塞点、下一步和证据索引。
- 默认软上限为 40 行；超过后必须先合并重复内容、删除过期状态，再继续写入。不得用空行或大段日志规避上限。
- 只保留最近 3 个证据索引；完整命令输出必须留在命令结果、`tasks.md` 已指定的日期化证据文件或其他项目规定位置。

### `agent-findings.md`：去重后的持久发现

- 每条发现必须回答：结论是什么、证据在哪里、状态是什么、后续动作是什么。
- 状态只使用 `active`、`superseded`、`resolved`；新证据推翻旧判断时更新或删除旧条目，不重复追加同一发现。
- 只保留会改变后续 agent 决策的根因、风险、失败索引、禁止重复路径和待办入口；不记录聊天摘要、完整 traceback、重复版本树或普通成功日志。
- 默认软上限为 80 行或 20 条有效发现；达到任一上限时先压缩、合并或移除已解决条目。

### 写入前门禁

写入前逐项检查：

1. 下一位 agent 是否会因为这条信息采取不同动作？不会则不写。
2. 是否有证据索引或明确状态？没有则先验证或标记为待验证，不写成结论。
3. 是否已经存在同义条目？存在则更新原条目，不新增重复条目。
4. 是否属于任务清单？属于则写入 `tasks.md`，不要把它藏进状态文件。

每个 checkpoint 结束时，必须覆盖更新 `agent-progress.md`，并对 `agent-findings.md` 做一次去重和过期条目清理；这两个文件都不允许演变成长期流水账。

## 标准推进方式

1. 开始前刷新文件状态。
2. 确定唯一 change 根目录，并扫描、警告、迁移错位的 `agent-progress.md` / `agent-findings.md`。
3. 选定一个 task。
4. 理清该 task 的验收标准和验证命令。
5. 核对本轮是否需要同步 `design.md`、`specs/*/spec.md` 或补写 `tasks.md`，先维护工件链再实现。
6. 如需生成过程报告、进度文档或调研文档，先确认 `tasks.md` 或项目 OpenSpec 规范已经定义落点和命名规则。
7. 只做最小可验证改动。
8. 运行相关测试、lint、typecheck、OpenSpec validate 或其他必要验证。
9. 把 checkpoint、文件变化和验证摘要写进规范 change 根目录的 `agent-progress.md`。
10. 把失败索引、风险和不能重复走的路径写进规范 change 根目录的 `agent-findings.md`。
11. 只有满足验收标准才把 task 勾为完成。
12. 再进入下一个 task 前，重新读取文件状态。

## 完成前检查

在标记完成前，确认下面几项都成立：

- 代码已经实现。
- task 的验收标准已经满足。
- 相关验证命令已经通过，或者已经明确记录无法自动验证的替代方式。
- `agent-progress.md` 已记录本轮进展和验证结果。
- `agent-findings.md` 已记录重要发现、失败尝试或剩余风险。
- 新增 markdown 文档没有散落在 change 根目录；所有过程报告、进度文档、调研文档都位于 `tasks.md` 或项目 OpenSpec 规范定义的日期化子目录或证据文件中。
- `agent-progress.md` 和 `agent-findings.md` 仍在 change 根目录，未移动、未改名、未日期化，且只保留摘要、checkpoint、索引和核心风险。
- 工作区不存在错位的 `agent-progress.md` / `agent-findings.md`；若曾发现错位文件，已警告、迁移到唯一 active/archive change，并回读确认。
- 没有未解决的 CRITICAL 问题。

## 你要记住的事

- 长任务靠文件，不靠聊天记忆。
- 只保留一个任务源。
- 小步推进。
- 每步都要能恢复。
- 先验证，再完成。
