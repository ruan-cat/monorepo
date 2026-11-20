# Claude Code `/goal` 与 Codex `/goal` 提示词

本文件用于生成或执行 Claude Code `/goal` 与 Codex `/goal` 长任务提示词。

## 提示词生成模式

当用户要求生成长任务执行提示词时，只生成可复制的 `/goal` 提示词，不执行任务。

生成提示词前先判定工件族。同级 `spec.md`、`plan.md`、`handoff.md` 用文末的简易包模板。OpenSpec change 用下面的 OpenSpec 模板。无法确定时不要把其中一种模板套到另一种路径上；输出对应占位符。

生成提示词时：

- 不修改 OpenSpec 工件，也不修改简易包三文件。
- 不创建或更新 `agent-progress.md` / `agent-findings.md`。
- 不运行测试、lint、typecheck 或 validate。
- 不开始处理 task。
- 不把聊天 checklist 当主任务源。

## 输入来源优先级

1. 用户明确给出的简易任务包目录，或同级 `spec.md`、`plan.md`、`handoff.md`。
2. 用户明确给出的 `openspec/changes/<change-name>` 或 `tasks.md` 路径。
3. 当前打开文件、项目上下文或用户描述中能唯一确定的工件族和路径。
4. 无法确定时使用占位符，不要臆造路径。OpenSpec 用 `<change-name>`；简易包用 `<task-package>`。

## OpenSpec 占位与必留要素

下面到简易包模板之前，只适用于 OpenSpec。用户要的是简易包时，跳过本节。

缺少 OpenSpec 路径时，输出占位模板并列出待补齐项：

- `<change-name>`
- `openspec/changes/<change-name>/tasks.md`
- `<验证命令>` 或项目实际测试命令
- 是否需要 `/opsx:verify <change-name>` 或其他 strict validate 命令

## 提示词必须保留的要素

- 以 `/goal` 开头。
- 明确目标是持续完成当前 OpenSpec change 的未完成任务。
- 要求先读 `AGENT_LONGTASK.md`、相关 `references/*.md`、`proposal.md`、`design.md`、`specs/`、`tasks.md`、`agent-progress.md`、`agent-findings.md`。
- 要求先发现并读取业务项目内与 OpenSpec 相关的项目级 skills；项目规则优先。
- 声明 `tasks.md` 是唯一任务源。
- 要求每次只处理一个 task 或 checkpoint。
- 发现遗漏任务时先补写 `tasks.md`；涉及用户可见行为先同步 `specs/`；涉及技术路线先同步 `design.md`。
- 要求先确定唯一 active/archive change 根目录，再创建或维护 `agent-progress.md` 和 `agent-findings.md`。
- 要求启动、恢复、上下文压缩后和完成前扫描错位的 `agent-progress.md` / `agent-findings.md`，警告用户并迁移或合并到具体 active/archive change。
- 要求 `proposal.md`、`design.md`、`tasks.md`、`specs/*/spec.md`、`agent-progress.md`、`agent-findings.md` 不移动、不改名、不日期化。
- 要求过程报告、进度文档、调研文档只能放到 `tasks.md` 或项目 OpenSpec 规范定义的日期化子目录，禁止 change 根目录散放 markdown。
- 要求 `agent-progress.md` / `agent-findings.md` 只做摘要索引，过长时压缩并把详情移到指定证据文件。
- 要求验证通过后才能勾选 `[x]`。
- 写明停止条件：全部完成、验证阻塞、连续 3 次同类失败、权限/破坏性/需求冲突。

## 1500 字内裁剪策略

为了让提示词适合直接粘贴到 Claude Code `/goal` 或 Codex `/goal`，优先保留可执行纪律，删掉解释性背景。

裁剪顺序：

1. 删除“为什么这样做”的解释。
2. 合并重复的读取文件、验证和停止条件。
3. 删除工具职责说明、长篇背景和历史约定。
4. 保留路径、唯一任务源、动态补全、进度文件、失败记录、验证后完成。
5. 保留项目级 OpenSpec skill、固定工件位置门禁、错位迁移、固定工件不可移动、过程文档落点、根目录无散落 markdown、progress/findings 摘要索引纪律。

如果用户指定 800 字、1000 字等更短限制，继续压缩表达，但不要删掉唯一任务源、验证和停止条件。

## 1500 字以内提示词模板

```markdown
/goal 执行 OpenSpec change：`openspec/changes/<change-name>/tasks.md`。

目标：
持续完成 `tasks.md` 中所有未完成任务，直到全部 checkbox 变成 `[x]`，关键验收有测试或明确验证记录，并在 `agent-progress.md` 写最终总结。

开始前先读取：

1. `AGENT_LONGTASK.md`
2. `references/execution-discipline.md`
3. `references/openspec-task-source.md`
4. `references/verification-and-failure.md`
5. 当前 change 的 `proposal.md`、`design.md`、`specs/`、`tasks.md`、`agent-progress.md`、`agent-findings.md`

若业务项目内存在与 OpenSpec 相关的项目级 skills，先读并以项目规则为准。

执行规则：

- 只以 `tasks.md` 为唯一任务源，不创建第二套任务列表，不依赖聊天 checklist。
- 每次只处理一个 task 或 checkpoint；开始前确认验收标准、修改范围和验证命令。
- 发现遗漏任务时，先补写 `tasks.md` 再继续；若改变用户可见行为，先同步 `specs/`；若改变技术路线，先同步 `design.md`。
- 先确定唯一 active/archive change 根目录；`agent-progress.md` / `agent-findings.md` 只能位于该目录。
- 启动、恢复和完成前扫描工作区内的 `agent-progress.md` / `agent-findings.md`；发现仓库根目录、reports、skill 目录等错位文件时，先警告并迁移/合并到对应 active/archive change，无法唯一归属就暂停询问。
- 不移动、不重命名、不日期化 `proposal.md`、`design.md`、`tasks.md`、`specs/*/spec.md`、`agent-progress.md`、`agent-findings.md`。
- change 根目录禁止散放过程报告、进度文档、调研或验证报告；需要保存时，先由 `tasks.md` 或项目规范定义子目录，文件名用 `YYYY-MM-DD-*.md`。
- `agent-progress.md` 写进展、验证和 checkpoint；`agent-findings.md` 写失败路径、风险、已排除方案和连续失败。
- `agent-progress.md` / `agent-findings.md` 只做摘要索引；过长时压缩为当前状态、核心痛点、待办和索引，详情放到指定证据文件。
- 修改后运行相关测试、lint、typecheck 或 `<验证命令>`。
- 只有实现完成、验收满足、验证通过或替代验证已记录、且没有 CRITICAL 残留时，才能把 task 勾选为 `[x]`。
- 连续 3 次同类失败、权限问题、破坏性风险或需求冲突时停止并输出 BLOCKED 报告。

停止条件：
全部任务完成并验证通过；或无法继续且已记录阻塞原因、失败证据和下一步建议。
```

## 执行 Claude Code `/goal` 与 Codex `/goal` 时的最低要求

启动 `/goal` 时，应要求 Claude Code 或 Codex：

1. 先读取本 skill 入口和相关 reference，再读取业务项目内与 OpenSpec 相关的项目级 skills。
2. 再确定唯一 active/archive change 根目录，扫描并处理错位的 `agent-progress.md` / `agent-findings.md`，然后读取当前 OpenSpec change 的 `proposal.md`、`design.md`、`specs/*/spec.md`、`tasks.md`、`agent-progress.md`、`agent-findings.md`。
3. 持续执行 `tasks.md` 中未完成的任务，并把遗漏任务、规格变化或设计变化先写回对应 OpenSpec 工件。
4. 不移动、不重命名、不日期化 OpenSpec 核心工件和 do-long-task 固定产物。
5. 过程报告、进度文档、调研文档只放到 `tasks.md` 或项目规范定义的日期化子目录。
6. 每完成一个阶段，就更新规范 change 根目录的 `agent-progress.md`；失败、风险和不可重复路径写入同目录 `agent-findings.md`。
7. 只有实现完成、验收满足、验证通过或替代验证已记录，且没有 CRITICAL 残留时，才能把 checkbox 改为 `[x]`。
8. 直到所有任务完成、验证通过，或遇到真正阻塞才停止。

## 简易任务包模板

缺少任务包路径时，使用 `<task-package>`，并列出待补齐项：任务包目录、`plan.md`、`handoff.md`、`<验证命令>`。不要改写成 OpenSpec 占位模板。

简易包提示词必须保留：

- 以 `/goal` 开头。
- 先读 `handoff.md`、`spec.md`、`plan.md` 和 `references/simple-task-package.md`。
- `plan.md` 是唯一任务源，`handoff.md` 是唯一状态和证据文件。
- 不创建 `agent-progress.md`、`agent-findings.md`、`tasks.md` 或 OpenSpec change。
- 一次只做一个 Task；遗漏任务先补进 `plan.md`；验收或冻结合同变化先改 `spec.md`。
- handoff 里的门未满足就停止。
- 接手先重跑 handoff 写明的预检。易腐栏与仓库不一致时先原位改正，再做 Task。
- 验证证据写入 handoff 后再标记 Task 完成。
- 停止条件与 OpenSpec 相同：全部完成、验证阻塞、连续 3 次同类失败、权限、破坏性风险或需求冲突。

```markdown
/goal 执行简易任务包：`<task-package>`。

目标：
按 `plan.md` 做完未完成 Task。`spec.md` 是合同，`handoff.md` 记录状态、门禁和证据。

开始前先读取：

1. `references/simple-task-package.md`
2. `<task-package>/handoff.md`
3. `<task-package>/spec.md`
4. `<task-package>/plan.md`

执行规则：

- 只以 `plan.md` 为任务源。不创建第二份清单，不把 handoff 或聊天 checklist 当任务源。
- 先看 handoff 的状态、门禁和下一条命令，并重跑它写明的预检。HEAD、dirty、SHA 或哈希对不上时，先原位改正易腐栏，再做 Task。门未满足就停止。
- 一次只做 handoff 指向的一个 Task；没有指向时做第一个未完成 Task。
- 遗漏工作先补进 `plan.md`。验收或冻结合同变了，先改 `spec.md` 再改 `plan.md`。
- 不创建 `agent-progress.md`、`agent-findings.md` 或 OpenSpec change。三份文件不改名、不日期化。
- 验证命令是 `<验证命令>`。证据写入 handoff 已有栏位后，才能把该 Task 标成完成。
- 暂停前更新 handoff 的当前 Task、证据、阻塞和下一条命令。
- 连续 3 次同类失败、权限问题、破坏性风险或需求冲突时停止，并在 handoff 写明原因。

停止条件：
计划中的 Task 都已完成且 handoff 有证据；或无法继续且 handoff 已写明阻塞和下一条命令。
```
