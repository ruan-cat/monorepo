---
name: do-long-task
description: >-
  当复杂开发、修复、重构、迁移、验证或 OpenSpec change 需要跨可恢复 checkpoint 持续推进、
  需要在上下文丢失后恢复，或需要把进度与失败记录写入持久文件时使用；
  当用户要求生成 Claude Code `/goal`、Codex `/goal` 或 do-long-task 长任务提示词时也使用。
  不要用于一次性短改、问答、简单格式化、changeset、发版日志或纯计划讨论。
  Use when a complex development, fix, refactor, migration, verification, or OpenSpec change must be advanced
  across resumable checkpoints, recovered after context loss, or executed with durable progress and failure notes;
  also use when the user asks to generate a Claude Code `/goal`, Codex `/goal`, or do-long-task prompt.
  Do not use for short one-off edits, Q&A, simple formatting, changesets, release notes, or pure planning.
user-invocable: true
metadata:
  version: "1.3.2"
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

提示词必须保留 do-long-task 的核心纪律：读取 OpenSpec 工件、只使用 `tasks.md` 作为唯一任务源、小步推进、动态补全遗漏任务、维护进度与失败记录、验证后再勾选完成、遇到真正阻塞才暂停。

详细模板、占位符策略和裁剪规则见 `references/codex-goal-prompt.md`。按 `AGENT_LONGTASK.md` 的读取路由只加载相关 reference，不要无脑读取全部长文。

## 协作声明

- 需要协作的全局技能是 `openspec`。执行 OpenSpec change 时，先使用 `openspec` 理解 `proposal.md`、`design.md`、`specs/` 和 `tasks.md` 的工件链。
- 业务项目内如果存在项目级 OpenSpec 技能，必须先发现并读取，再执行 change。按项目根目录优先检查 `.claude/skills`、`.codex/skills`、`.agents/skills`、`.agent/skills` 中与 `openspec` 相关的技能入口；只读取当前任务需要的技能与 reference，不把外部分发 skill 的默认规则置于项目规则之上。
- 当检测到当前任务位于 `openspec/changes/<change>` 下时，必须以当前 OpenSpec 工件链为准，`tasks.md` 是唯一可执行任务源。
- 长任务执行中发现遗漏任务时，先更新当前 change 的 `tasks.md`，再继续执行。
- 不得只把遗漏任务写在聊天 checklist、`agent-progress.md` 或子代理报告里。

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
9. change 根目录的 `agent-progress.md`
10. change 根目录的 `agent-findings.md`

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
- 当 `agent-progress.md` 或 `agent-findings.md` 过长时，先压缩为摘要和索引；详细日志、证据或调研内容迁入 `tasks.md` 指定的日期化子目录或证据文件。
- 不要每个小步骤都问用户是否继续，除非遇到真正阻塞。
- 只有遇到权限问题、破坏性风险、需求冲突、产品决策问题，或连续 3 次同类失败时，才暂停并请求用户介入。

## 标准推进方式

1. 开始前刷新文件状态。
2. 选定一个 task。
3. 理清该 task 的验收标准和验证命令。
4. 核对本轮是否需要同步 `design.md`、`specs/*/spec.md` 或补写 `tasks.md`，先维护工件链再实现。
5. 如需生成过程报告、进度文档或调研文档，先确认 `tasks.md` 或项目 OpenSpec 规范已经定义落点和命名规则。
6. 只做最小可验证改动。
7. 运行相关测试、lint、typecheck、OpenSpec validate 或其他必要验证。
8. 把 checkpoint、文件变化和验证摘要写进根目录 `agent-progress.md`。
9. 把失败索引、风险和不能重复走的路径写进根目录 `agent-findings.md`。
10. 只有满足验收标准才把 task 勾为完成。
11. 再进入下一个 task 前，重新读取文件状态。

## 完成前检查

在标记完成前，确认下面几项都成立：

- 代码已经实现。
- task 的验收标准已经满足。
- 相关验证命令已经通过，或者已经明确记录无法自动验证的替代方式。
- `agent-progress.md` 已记录本轮进展和验证结果。
- `agent-findings.md` 已记录重要发现、失败尝试或剩余风险。
- 新增 markdown 文档没有散落在 change 根目录；所有过程报告、进度文档、调研文档都位于 `tasks.md` 或项目 OpenSpec 规范定义的日期化子目录或证据文件中。
- `agent-progress.md` 和 `agent-findings.md` 仍在 change 根目录，未移动、未改名、未日期化，且只保留摘要、checkpoint、索引和核心风险。
- 没有未解决的 CRITICAL 问题。

## 你要记住的事

- 长任务靠文件，不靠聊天记忆。
- 只保留一个任务源。
- 小步推进。
- 每步都要能恢复。
- 先验证，再完成。
