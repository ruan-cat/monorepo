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
- 业务项目内 `.claude/skills`、`.codex/skills`、`.agents/skills`、`.agent/skills` 中与 OpenSpec 相关的项目级 skill
- `proposal.md`
- `design.md`
- `specs/*/spec.md`
- `tasks.md`
- 工作区内全部 `agent-progress.md` / `agent-findings.md` 的位置扫描结果
- change 根目录的 `agent-progress.md`
- change 根目录的 `agent-findings.md`

刷新后，先确认 `agent-progress.md` / `agent-findings.md` 位于具体 active/archive change 根目录；若发现错位文件，先警告并迁移或合并，再在规范位置的 `agent-progress.md` 写入当前状态确认。

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
6. 把结果写进规范 change 根目录的 `agent-progress.md`。
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

## 位置门禁与错位迁移

在读取、创建、更新状态文件前，先得到唯一 `changeRoot`：

- active change：`openspec/changes/<change-name>`
- archived change：`openspec/changes/archive/**/<change-name>`

`changeRoot` 必须来自用户显式路径、当前目录所属的 OpenSpec change，或扫描后唯一匹配的 `tasks.md`。无法唯一确定时，不创建状态文件，先向用户索要 change 路径。

搜索现有 `agent-progress.md` / `agent-findings.md` 时，任何不在具体 active/archive change 根目录下的命中都是错位文件。处理方式：

1. 警告用户并说明错位路径。
2. 能确定 active/archive 归属时，迁移或合并到 `changeRoot`。
3. 目标文件已存在时追加迁移小节，不覆盖原记录。
4. 迁移后回读目标文件，再删除源文件。
5. 无法确定归属时停止询问；不要把内容塞进仓库根目录或单一全局文件。

## 固定产物与压缩纪律

以下文件是固定产物，位置和名称不能被优化、移动、重命名或日期化：

- OpenSpec 核心工件：`proposal.md`、`design.md`、`tasks.md`、`specs/*/spec.md`
- do-long-task 固定产物：具体 active/archive change 根目录的 `agent-progress.md`、`agent-findings.md`

`agent-progress.md` 和 `agent-findings.md` 不是长流水容器。它们只保留：

- 当前状态。
- 当前 task 或 checkpoint。
- 核心痛点和已知风险。
- 待办入口。
- 验证、报告、调研和失败详情的索引。

当这两个文件变长时，先压缩为当前状态、核心痛点、待办和索引；把完整日志、证据、调研记录放到 `tasks.md` 或项目 OpenSpec 规范指定的日期化证据文件。不得通过移动固定产物、改名为日期文件或在根目录新建报告来“整理”长流水。

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
