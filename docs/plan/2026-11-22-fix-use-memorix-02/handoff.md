# 2026-11-22 use-memorix 无活动会话说法与分轮交接

本文件是状态和证据。任务只以 `plan.md` 为准。合同只以 `spec.md` 为准。

## 耐久栏

### 授权门

- 允许修改 `plan.md` 列出的两份技能 Markdown，以及本文件的易腐栏、`plan.md` 的勾选。
- 允许在命中 `plan.md` 第 4 节停止条件时停下。
- 不允许提交、推送、暂存、切换分支、创建 worktree。
- 不允许运行 `skills add`，不允许改全局或用户目录里的 `use-memorix` 副本。
- 不允许调用 Memorix 的 start、store、resolve、end，也不允许做归档。
- 不允许修改 `docs/plan/2026-11-22-fix-use-memorix-01/`。

### 依赖门

- 执行仓库是 `D:\code\ruan-cat\monorepo`。
- 当前分支保持为接手复核时看到的分支。规划时看到的是 `dev`。
- 本包不依赖 01 先完成。01 未落地时，在现有平台事实和现有 `start` 规则旁边追加。01 已落地时，接在项目绑定硬门后面追加，并且不恢复 01 删掉的旧句。

### 禁止动作

- 不恢复、不暂存、不提交仓库里已有的他人改动。规划时这些改动包括 `AGENTS.md`、`init-ai-md` 及其 templates、`docs/prompts/release-ai-plugins/02.md`，以及未入库的 `docs/plan/2026-11-22-fix-use-memorix-01/`。
- 不新建 OpenSpec 文件、`agent-progress.md`、`agent-findings.md`。
- 不把本包改写成亲自存储记忆或亲自处理归档。

### 回滚

未提交。回滚只针对本任务改过的两份技能文件，使用针对这两个路径的 `git checkout -- <path>`。不对其它 dirty 路径执行 checkout。回滚前把命令写进易腐栏。

### 后续不在本包

技能源改完后，由用户决定何时用既有的 `skills add` 覆盖全局副本。01 包的项目绑定硬门由 01 的执行会话负责。

## 易腐栏

### 执行状态

- 包状态：未开始
- 当前 Task：Task 1
- 执行者：尚未接手。规划会话不实现。
- 阻塞：无
- 核对时间：2026-11-22 01:18 CST

### 仓库基线

- 分支：`dev`
- HEAD：`5423716a337b105fde264a896db90a8c177aed63`
- 跟踪：`dev...origin/dev`
- 规划时 dirty：`AGENTS.md`、`ai-plugins/common-tools/skills/init-ai-md/SKILL.md`、该技能下多份 templates、`docs/prompts/release-ai-plugins/02.md`
- 规划时 `docs/plan/2026-11-22-fix-use-memorix-01/` 尚未入库
- 规划时两份技能文件都还含「已有则复用，不重复启动」，还没有「项目绑定硬门」
- index：本包三份文件当时未暂存。两份技能文件当时无本包 diff
- 文件哈希：实施前必须重算。规划时未计算 `SKILL.md` 与 `session-and-reasoning.md`

接手时重跑下面的预检。结果与上面不一致，先改正这一栏，再判断依赖门是否仍成立。

### 证据

- 规划会话只创建了本目录三份文件。
- 尚未修改两份技能文件。
- 尚未运行 Task 3 的验收。

### 执行者下一条命令

在 `D:\code\ruan-cat\monorepo` 运行：

```powershell
git status --short --branch
git rev-parse HEAD
git branch --show-current
rg -n "已有则复用，不重复启动|项目绑定硬门|收尾时没有活动会话" ai-plugins/common-tools/skills/use-memorix -g "*.md"
```

预检通过后，从 `plan.md` Task 1 开始。
