# 2026-11-22 use-memorix 项目绑定硬门执行计划

任务源只使用本文件。合同以 `spec.md` 为准。各 Task 的完成标记只写在该 Task 下的「执行状态」一行。当前状态、证据、阻塞和下一条命令只写同目录 `handoff.md`。

## Global Constraints

- 仓库：`D:\code\ruan-cat\monorepo`。只在当前分支工作，不新建 worktree，不切换分支。
- 只改这三个文件的指定段落：
  - `ai-plugins/common-tools/skills/use-memorix/SKILL.md`
  - `ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md`
  - `ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md`
- 判定文字以 `spec.md` 第 4 节的 7 步为准。
- `spec.md` 第 3 节的非目标全部有效。发现范围外的同类句子时，记到 `handoff.md` 后停止，不自行扩大修改。
- 本目录的 `spec.md` 不改。`plan.md` 只改 Task 的执行状态。`handoff.md` 只改易腐栏和 Task 证据。
- 不 `git add`，不 `git commit`，不 `git push`。

## Task 1：复核原文还在

执行状态：未开始

修改范围：不改文件。

步骤：

1. 在仓库根运行 `git status --short --branch`、`git rev-parse HEAD`、`git branch --show-current`。
2. 读 `SKILL.md` 平台事实、`session-and-reasoning.md` 的 `start` 规则、`memory-operations.md` 的读取路径和写入路径。
3. 确认平台事实和 `start` 规则仍含「已有则复用，不重复启动」。确认写入路径还没有「项目绑定硬门」。

验收：三处原文与 `spec.md` 第 4 节引用的原文一致。不一致时，把差异写进 `handoff.md` 并停止。

验证命令：

```powershell
rg -n "已有则复用，不重复启动|项目绑定硬门" ai-plugins/common-tools/skills/use-memorix -g "*.md"
```

## Task 2：替换平台事实和启动规则

执行状态：未开始

修改范围：`SKILL.md` 的平台事实整句；`session-and-reasoning.md` 第 15 行那一条。

步骤：

1. 用 `spec.md` 第 4 节的 7 步替换这两处。
2. 保留 `session-and-reasoning.md` 里「恢复会话只读不写」和 `end`、handoff 的原句。
3. 两处都写明：活动会话存在不能跳过 MCP 根目录核对；不一致时先确认，再把当前工作区绝对路径传给 `projectRoot`。

验收：两处不再含「已有则复用，不重复启动」。两处都含「项目绑定硬门」和 `projectRoot`。

验证命令：

```powershell
rg -n "已有则复用，不重复启动|项目绑定硬门|projectRoot" ai-plugins/common-tools/skills/use-memorix/SKILL.md ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md
```

## Task 3：把硬门放进写入路径

执行状态：未开始

修改范围：`memory-operations.md` 的读取路径第 1 步和写入路径开头。

步骤：

1. 读取路径第 1 步改为：先执行本文件「项目绑定硬门」，再看 handoff 和记忆条目。
2. 在「写入路径」标题下、四字段表之前，写入「项目绑定硬门」7 步。
3. 保留四字段表、topicKey、进度字段、秘密禁写、展示后确认、resolve 规则和失败分支。

验收：store 之前的文字要求 CLI 项目 id 与 MCP 根目录同时等于当前工作区。原有四字段和确认要求仍在。

验证命令：

```powershell
rg -n "项目绑定硬门|entityName|写入前展示" ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md
```

## Task 4：收口核对

执行状态：未开始

修改范围：不改技能正文。只回写 `plan.md` 的执行状态和 `handoff.md` 的易腐栏。

步骤：

1. 全技能 Markdown 搜索旧句，确认零命中。
2. 运行 `git diff --stat` 和 `git diff -- ai-plugins/common-tools/skills/use-memorix/SKILL.md ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md`。
3. 确认 diff 只有这三份技能文件的指定段落，加上本任务包被执行会话改过的状态栏。
4. 确认没有调用 Memorix 写入工具。

验收：满足 `spec.md` 第 5 节。未提交。

验证命令：

```powershell
rg -n "已有则复用，不重复启动" ai-plugins/common-tools/skills/use-memorix -g "*.md"
git diff --stat
```
