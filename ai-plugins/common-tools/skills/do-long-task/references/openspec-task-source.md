# OpenSpec 任务源与动态补全

本文件用于处理 OpenSpec change、唯一任务源和执行中发现的遗漏任务。

## 唯一主任务源

OpenSpec 长任务的唯一主任务源是：

```txt
openspec/changes/<change-name>/tasks.md
```

禁止把以下内容作为主任务源：

- `task_plan.md`
- `.agent/tasks.json`
- Ralph task list
- Superpowers implementation plan
- 聊天中的临时 checklist
- 子代理报告

聊天 checklist 和子代理报告只能作为线索，必须由主代理去重、合并、排序后写回 `tasks.md`。

## `tasks.md` 任务粒度

每个 task 应尽量包含：

- task id。
- 目标。
- 修改范围。
- 验收标准。
- 验证命令。
- 依赖关系。
- 状态。

每次只能处理一个 task 或一个明确 checkpoint。

## 动态任务补全

动态补全不是创建新计划，而是把执行中发现的遗漏任务回写到当前 OpenSpec change 的唯一任务源。

发现缺口时，先判断是否属于当前 `openspec/changes/<change-name>` 范围：

- 属于当前 change：先补写 `tasks.md`，再继续执行。
- 不属于当前 change：写入 no-go，或建议新建 OpenSpec change。
- 改变用户可观察行为：先同步 `specs/`，再补写 `tasks.md`。
- 改变技术路线：先同步 `design.md`，再补写 `tasks.md`。

必须在以下时机重新读取 `tasks.md`、`agent-progress.md`、`agent-findings.md`：

- 每次启动。
- 上下文压缩后恢复。
- 开始新的 OpenSpec task 前。
- 完成 checkpoint 后。
- 连续失败 2 次后。
- 准备勾选 `[x]` 前。

## 动态补全记录要求

`agent-progress.md` 必须记录：

- 为什么补任务。
- 补到了 `tasks.md` 的哪个位置。
- 本轮运行了哪些验证。
- 验证通过、失败或替代验证的结果。

`agent-findings.md` 必须记录：

- 风险。
- 阻断。
- 失败路径。
- 不得误判的证据边界。

只有同时满足以下条件，才能把补全后相关 task 勾选为 `[x]`：

- 实现完成。
- 验收标准满足。
- 验证通过，或替代验证已明确记录。
- OpenSpec strict validate 通过。
- 没有未解决的 CRITICAL 残留。

## OpenSpec 的定位

OpenSpec 负责 change 的规格、设计、任务拆分、验收验证和归档，是长任务的文件记忆来源。

执行 OpenSpec change 时，目标和验收来源优先级为：

1. `proposal.md`
2. `design.md`
3. `specs/`
4. `tasks.md`
5. `agent-progress.md`
6. `agent-findings.md`

如果 `agent-progress.md` 或 `agent-findings.md` 不存在，先创建。恢复任务时，先读取 `agent-progress.md` 最近 checkpoint，再读取 `tasks.md`。

## 多任务源风险

各工具可能各有任务源：

- OpenSpec 有 `tasks.md`。
- PageAI Ralph 有 `.agent/tasks.json` 和 `.agent/tasks/TASK-{ID}.json`。
- Superpowers 有 implementation plan。
- Codex `/goal` 自身也可能形成 checkpoint。

关键决策：只保留 OpenSpec `tasks.md` 作为主任务源，不同时维护另一套任务系统。
