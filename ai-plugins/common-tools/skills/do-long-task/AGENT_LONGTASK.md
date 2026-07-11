# 长任务执行入口

这是 `do-long-task` skill 的详细入口文件。它只承载总纲、路由和不可丢失的核心纪律；长篇细则按场景拆到 `references/`，需要时再读取，避免每次把全部规范塞进上下文。

## 核心纪律

- 长任务靠文件恢复，不靠聊天记忆。
- OpenSpec 场景只以 `openspec/changes/<change-name>/tasks.md` 为唯一任务源。
- 不创建第二套任务列表，不把聊天 checklist、子代理报告或临时计划当主任务源。
- 每次只处理一个 task 或一个明确 checkpoint。
- 发现遗漏任务时，先判断是否属于当前 change；属于则先补写 `tasks.md`，再继续执行。
- 改变用户可见行为时先同步 `specs/`；改变技术路线时先同步 `design.md`。
- 业务项目内若存在项目级 OpenSpec skills，先按项目根目录优先读取相关入口，再执行当前 change；项目规则优先于外部分发 skill 默认规则。
- OpenSpec 核心工件固定为 `proposal.md`、`design.md`、`tasks.md`、`specs/*/spec.md`；不得移动、重命名或日期化。
- `agent-progress.md` 与 `agent-findings.md` 固定在 change 根目录；不得移动、重命名或日期化。
- 进度和验证结果写入根目录 `agent-progress.md`，只保留 checkpoint、当前状态、验证摘要和证据索引。
- 失败路径、风险、已排除方案和连续失败写入根目录 `agent-findings.md`，只保留核心痛点、禁止重复路径和索引。
- 过程报告、进度文档、调研文档若要保存在 change 内，必须先由 `tasks.md` 或项目 OpenSpec 规范定义子目录，并使用 `YYYY-MM-DD-*.md` 命名；禁止在 change 根目录散放 markdown。
- 当 `agent-progress.md` 或 `agent-findings.md` 过长时，压缩为当前状态、核心痛点、待办和索引；详情放入已定义的日期化证据文件。
- 只有实现完成、验收满足、验证通过或替代验证已记录，且没有未解决 CRITICAL 问题时，才能勾选 `[x]`。
- 只有遇到权限问题、破坏性风险、需求冲突、产品决策问题，或连续 3 次同类失败时，才暂停请求用户介入。

## 读取路由

先读本文件，再按任务场景读取对应 reference。不要无脑读取全部 reference。

| 场景                                                               | 读取文件                                 |
| ------------------------------------------------------------------ | ---------------------------------------- |
| 启动、恢复或推进长任务                                             | `references/execution-discipline.md`     |
| OpenSpec `tasks.md` 缺漏、动态补任务、设计/规格同步                | `references/openspec-task-source.md`     |
| 子代理参与探索、编辑、复核或提出补全候选                           | `references/subagent-collaboration.md`   |
| 验证失败、连续失败、完成勾选、BLOCKED 判断                         | `references/verification-and-failure.md` |
| 用户要求生成 Claude Code `/goal` 或 Codex `/goal` 长任务执行提示词 | `references/codex-goal-prompt.md`        |

## 启动检查

执行长任务前读取：

1. 当前 skill 的 `SKILL.md`。
2. 本文件 `AGENT_LONGTASK.md`。
3. 按场景选中的 `references/*.md`。
4. 业务项目内 `.claude/skills`、`.codex/skills`、`.agents/skills`、`.agent/skills` 中与 OpenSpec 相关的项目级 skill。
5. 当前 OpenSpec change 的 `proposal.md`、`design.md`、`specs/`、`tasks.md`。
6. `agent-progress.md` 和 `agent-findings.md`；不存在时先创建在 change 根目录。

恢复中断或上下文压缩后的任务时，先读 `agent-progress.md` 最近 checkpoint，再读 `tasks.md` 当前状态，不凭聊天记忆继续。

## 执行模式

执行模式用于真正推进长任务。

1. 选定 `tasks.md` 中一个未完成 task。
2. 理清该 task 的验收标准、修改范围、依赖关系和验证命令。
3. 做最小可验证改动。
4. 运行相关测试、lint、typecheck、OpenSpec validate 或替代验证。
5. 把进度、文件变化和验证结果写入 `agent-progress.md`。
6. 把失败路径、风险和不能重复走的方案写入 `agent-findings.md`。
7. 若需要保存过程报告、调研记录或证据文档，先确认落点由 `tasks.md` 或项目 OpenSpec 规范定义，且文件名为 `YYYY-MM-DD-*.md`。
8. 满足完成条件后，才把 task 勾选为 `[x]`。
9. 进入下一个 task 前，重新读取文件状态。

## 提示词生成模式

提示词生成模式用于帮用户生成 Claude Code `/goal` 或 Codex `/goal` prompt，不执行任务。

- 只输出可复制的 `/goal` 提示词。
- 不修改 OpenSpec 工件。
- 不创建或更新 `agent-progress.md` / `agent-findings.md`。
- 不运行测试、lint、typecheck 或 validate。
- 默认控制在 1500 字以内；用户指定更短或更长时，以用户要求为准。
- 缺少 change 路径时，使用 `<change-name>`、`<验证命令>` 等占位符，不臆造路径。

详细模板和裁剪规则见 `references/codex-goal-prompt.md`。

## 文件职责

- 唯一主任务源：`openspec/changes/<change-name>/tasks.md`
- 固定核心工件：`proposal.md`、`design.md`、`tasks.md`、`specs/*/spec.md`
- 目标和验收来源：`proposal.md`、`design.md`、`specs/`
- 执行状态摘要：change 根目录 `agent-progress.md`
- 发现、失败和风险摘要：change 根目录 `agent-findings.md`
- 过程报告和证据详情：`tasks.md` 或项目 OpenSpec 规范定义的日期化子目录
- 长任务规则入口：`AGENT_LONGTASK.md`
- 详细规则：`references/*.md`

## 不要做

- 不要同时维护 `task_plan.md`、`.agent/tasks.json`、Ralph task list、Superpowers implementation plan 或聊天 checklist 作为第二任务源。
- 不要因为代码写完就勾选 task。
- 不要伪造验证通过。
- 不要无记录地重复同一失败路径。
- 不要让子代理直接修改主任务源，除非主代理明确分配了写入范围。
- 不要为了压缩提示词删掉唯一任务源、验证后完成、失败记录和停止条件。
- 不要移动、重命名或日期化 `proposal.md`、`design.md`、`tasks.md`、`specs/*/spec.md`、`agent-progress.md`、`agent-findings.md`。
- 不要把阶段报告、验证报告、调研记录或长流水直接写到 change 根目录。
- 不要把超长执行流水塞进 `agent-progress.md` 或 `agent-findings.md`；它们只做摘要索引。

## 完成前总检查

完成或汇报前确认：

- `tasks.md` 中相关 task 状态与实际实现一致。
- `agent-progress.md` 已记录本轮进展和验证结果。
- `agent-findings.md` 已记录重要发现、失败尝试和剩余风险。
- change 根目录没有散落的新增 markdown 过程文档。
- 核心工件和固定产物未移动、未改名、未日期化。
- `agent-progress.md` / `agent-findings.md` 没有变成超长流水，只保留摘要和索引。
- 相关验证命令已经运行，或替代验证和剩余风险已写明。
- 没有未解决的 CRITICAL 问题。
- 若只是生成 `/goal` 提示词，没有执行任务或修改 OpenSpec 工件。
