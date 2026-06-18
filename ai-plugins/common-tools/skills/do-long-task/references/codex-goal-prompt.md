# Claude Code `/goal` 与 Codex `/goal` 提示词

本文件用于生成或执行 Claude Code `/goal` 与 Codex `/goal` 长任务提示词。

## 提示词生成模式

当用户要求生成长任务执行提示词时，只生成可复制的 `/goal` 提示词，不执行任务。

生成提示词时：

- 不修改 OpenSpec 工件。
- 不创建或更新 `agent-progress.md` / `agent-findings.md`。
- 不运行测试、lint、typecheck 或 validate。
- 不开始处理 task。
- 不把聊天 checklist 当主任务源。

## 输入来源优先级

1. 用户明确给出的 `openspec/changes/<change-name>` 或 `tasks.md` 路径。
2. 当前打开文件、项目上下文或用户描述中能确定的 change 名称。
3. 无法确定时，使用 `<change-name>`、`<验证命令>` 等占位符，不要臆造路径。

缺少 OpenSpec 路径时，输出占位模板并列出待补齐项：

- `<change-name>`
- `openspec/changes/<change-name>/tasks.md`
- `<验证命令>` 或项目实际测试命令
- 是否需要 `/opsx:verify <change-name>` 或其他 strict validate 命令

## 提示词必须保留的要素

- 以 `/goal` 开头。
- 明确目标是持续完成当前 OpenSpec change 的未完成任务。
- 要求先读 `AGENT_LONGTASK.md`、相关 `references/*.md`、`proposal.md`、`design.md`、`specs/`、`tasks.md`、`agent-progress.md`、`agent-findings.md`。
- 声明 `tasks.md` 是唯一任务源。
- 要求每次只处理一个 task 或 checkpoint。
- 发现遗漏任务时先补写 `tasks.md`；涉及用户可见行为先同步 `specs/`；涉及技术路线先同步 `design.md`。
- 要求持续维护 `agent-progress.md` 和 `agent-findings.md`。
- 要求验证通过后才能勾选 `[x]`。
- 写明停止条件：全部完成、验证阻塞、连续 3 次同类失败、权限/破坏性/需求冲突。

## 1500 字内裁剪策略

为了让提示词适合直接粘贴到 Claude Code `/goal` 或 Codex `/goal`，优先保留可执行纪律，删掉解释性背景。

裁剪顺序：

1. 删除“为什么这样做”的解释。
2. 合并重复的读取文件、验证和停止条件。
3. 删除工具职责说明、长篇背景和历史约定。
4. 保留路径、唯一任务源、动态补全、进度文件、失败记录、验证后完成。

如果用户指定 800 字、1000 字等更短限制，继续压缩表达，但不要删掉唯一任务源、验证和停止条件。

## 1500 字以内提示词模板

```markdown
/goal 执行 OpenSpec change：`openspec/changes/<change-name>/tasks.md`。

目标：
持续完成 `tasks.md` 中所有未完成任务，直到全部 checkbox 变成 `[x]`，关键验收场景有测试或明确验证记录，并在 `agent-progress.md` 写入最终总结。

开始前先读取：

1. `ai-plugins/common-tools/skills/do-long-task/AGENT_LONGTASK.md`
2. `ai-plugins/common-tools/skills/do-long-task/references/execution-discipline.md`
3. `ai-plugins/common-tools/skills/do-long-task/references/openspec-task-source.md`
4. `ai-plugins/common-tools/skills/do-long-task/references/verification-and-failure.md`
5. `openspec/changes/<change-name>/proposal.md`
6. `openspec/changes/<change-name>/design.md`
7. `openspec/changes/<change-name>/specs/`
8. `openspec/changes/<change-name>/tasks.md`
9. `openspec/changes/<change-name>/agent-progress.md`
10. `openspec/changes/<change-name>/agent-findings.md`

执行规则：

- 只以 `tasks.md` 为唯一任务源，不创建第二套任务列表，不依赖聊天 checklist。
- 每次只处理一个 task 或一个明确 checkpoint。
- 开始 task 前确认验收标准、修改范围和验证命令。
- 发现遗漏任务时，先补写 `tasks.md` 再继续；若改变用户可见行为，先同步 `specs/`；若改变技术路线，先同步 `design.md`。
- 重要进展、验证结果和 checkpoint 写入 `agent-progress.md`。
- 失败路径、风险、已排除方案和连续失败写入 `agent-findings.md`。
- 修改后运行相关测试、lint、typecheck 或 `<验证命令>`。
- 只有实现完成、验收满足、验证通过或替代验证已记录、且没有 CRITICAL 残留时，才能把 task 勾选为 `[x]`。
- 连续 3 次同类失败、权限问题、破坏性风险或需求冲突时停止并输出 BLOCKED 报告。

停止条件：
全部任务完成并验证通过；或无法继续且已记录阻塞原因、失败证据和下一步建议。
```

## 执行 Claude Code `/goal` 与 Codex `/goal` 时的最低要求

启动 `/goal` 时，应要求 Claude Code 或 Codex：

1. 先读取本 skill 入口和相关 reference。
2. 再读取当前 OpenSpec change 的 `proposal.md`、`design.md`、`specs/`、`tasks.md`。
3. 持续执行 `tasks.md` 中未完成的任务。
4. 每完成一个任务，就把对应 checkbox 改为 `[x]`。
5. 每完成一个阶段，就更新进度日志。
6. 直到所有任务完成、验证通过，或遇到真正阻塞才停止。
