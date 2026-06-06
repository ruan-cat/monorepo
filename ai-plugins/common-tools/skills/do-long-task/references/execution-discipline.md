# 长任务执行纪律

本文件用于启动、恢复和持续推进长任务。

## 适用场景

- 长时间、多步骤的开发、修复、重构、迁移、验收。
- 会遇到上下文压缩、中断恢复、测试失败和反复修复的任务。
- 需要把计划、进度、发现、失败和验证结果持续写入文件的任务。
- 使用 OpenSpec change 作为任务载体的场景。

## 不适用场景

- 单文件小改动。
- 一次性问答或纯解释。
- 仍在需求探索、方案脑暴，尚未进入执行。
- 写 changeset、提交信息、简短报告、一次性格式化。
- 不需要 checkpoint、恢复续跑或失败记录的操作。

## Fresh Context Discipline

通过“文件状态刷新”模拟 fresh context。必须在以下时机重新读取文件状态：

- 启动长任务时。
- 上下文压缩后。
- 会话中断恢复后。
- 每开始一个新的 OpenSpec task 前。
- 每完成一个 checkpoint 后。
- 连续失败 2 次以上时。
- 准备标记任务完成前。

必须读取：

- `AGENT_LONGTASK.md`
- 当前 task 需要的 `references/*.md`
- 当前 skill 的 `SKILL.md`
- `proposal.md`
- `design.md`
- `specs/`
- `tasks.md`
- `agent-progress.md`
- `agent-findings.md`

刷新后，在 `agent-progress.md` 写入当前状态确认。

## 单一任务生命周期

每个 task 必须经历以下状态：

1. Pending：任务在 `tasks.md` 中未勾选。
2. Selected：选中当前 task，并在 `agent-progress.md` 写明选择原因。
3. Understood：已读取相关 proposal/design/specs，并确认验收标准。
4. Implementing：正在修改代码，必要时使用 TDD、系统化调试或子代理。
5. Verifying：正在运行 task-level 和 change-level 验证。
6. Failed：验证失败，失败原因写入 `agent-findings.md`。
7. Completed：验证通过，`tasks.md` 勾选为 `[x]`，`agent-progress.md` 记录证据。

## 标准推进方式

1. 开始前刷新文件状态。
2. 选定一个 task。
3. 理清验收标准、修改范围、依赖关系和验证命令。
4. 只做最小可验证改动。
5. 运行相关测试、lint、typecheck、OpenSpec validate 或替代验证。
6. 把结果写进 `agent-progress.md`。
7. 只有满足验收标准才把 task 勾为完成。
8. 再进入下一个 task 前，重新读取文件状态。

## 状态文件

`agent-progress.md` 用于记录执行进度：

- 当前正在处理的 task。
- 已完成的 task。
- 本轮修改了哪些文件。
- 运行了哪些验证命令。
- 测试结果。
- 当前 checkpoint。
- 下一步建议。

`agent-findings.md` 用于记录长期发现：

- 代码结构发现。
- 关键设计决策。
- 坑点。
- 失败尝试。
- 已排除的方案。
- 不能重复走的错误路径。
- 需要用户决策的问题。

## 文件和 Git 持久化

以下事件后必须更新文件：

- 开始任务。
- 完成 task。
- 完成 checkpoint。
- 验证失败。
- 发现重要事实。
- 改变方案。
- 暂停前。
- BLOCKED 前。
- 完成 change 前。

如果项目使用 git 且用户允许本地 commit，每个稳定 checkpoint 后可创建本地 commit。提交前必须执行：

```bash
git status
git diff
```

不要提交或回滚用户未授权的改动。
