# 长任务执行入口

这是 `do-long-task` skill 的详细入口文件。它只承载总纲、路由和不可丢失的核心纪律；长篇细则按场景拆到 `references/`，需要时再读取，避免每次把全部规范塞进上下文。

## 核心纪律

- 长任务靠文件恢复，不靠聊天记忆。
- OpenSpec 场景只以 `openspec/changes/<change-name>/tasks.md` 为唯一任务源。
- 不创建第二套任务列表，不把聊天 checklist、子代理报告或临时计划当主任务源。
- 每次只处理一个 task 或一个明确 checkpoint。
- 发现遗漏任务时，先判断是否属于当前 change；属于则先补写 `tasks.md`，再继续执行。
- 改变用户可见行为时先同步 `specs/`；改变技术路线时先同步 `design.md`。
- 进度和验证结果写入 `agent-progress.md`。
- 失败路径、风险、已排除方案和连续失败写入 `agent-findings.md`。
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
4. 当前 OpenSpec change 的 `proposal.md`、`design.md`、`specs/`、`tasks.md`。
5. `agent-progress.md` 和 `agent-findings.md`；不存在时先创建。

恢复中断或上下文压缩后的任务时，先读 `agent-progress.md` 最近 checkpoint，再读 `tasks.md` 当前状态，不凭聊天记忆继续。

## 执行模式

执行模式用于真正推进长任务。

1. 选定 `tasks.md` 中一个未完成 task。
2. 理清该 task 的验收标准、修改范围、依赖关系和验证命令。
3. 做最小可验证改动。
4. 运行相关测试、lint、typecheck、OpenSpec validate 或替代验证。
5. 把进度、文件变化和验证结果写入 `agent-progress.md`。
6. 把失败路径、风险和不能重复走的方案写入 `agent-findings.md`。
7. 满足完成条件后，才把 task 勾选为 `[x]`。
8. 进入下一个 task 前，重新读取文件状态。

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
- 目标和验收来源：`proposal.md`、`design.md`、`specs/`
- 执行状态：`agent-progress.md`
- 发现、失败和风险：`agent-findings.md`
- 长任务规则入口：`AGENT_LONGTASK.md`
- 详细规则：`references/*.md`

## 不要做

- 不要同时维护 `task_plan.md`、`.agent/tasks.json`、Ralph task list、Superpowers implementation plan 或聊天 checklist 作为第二任务源。
- 不要因为代码写完就勾选 task。
- 不要伪造验证通过。
- 不要无记录地重复同一失败路径。
- 不要让子代理直接修改主任务源，除非主代理明确分配了写入范围。
- 不要为了压缩提示词删掉唯一任务源、验证后完成、失败记录和停止条件。

## 完成前总检查

完成或汇报前确认：

- `tasks.md` 中相关 task 状态与实际实现一致。
- `agent-progress.md` 已记录本轮进展和验证结果。
- `agent-findings.md` 已记录重要发现、失败尝试和剩余风险。
- 相关验证命令已经运行，或替代验证和剩余风险已写明。
- 没有未解决的 CRITICAL 问题。
- 若只是生成 `/goal` 提示词，没有执行任务或修改 OpenSpec 工件。
