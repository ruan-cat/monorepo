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

- 包状态：已闭环
- 当前 Task：无
- 遗留项：无
- 核对时间：2026-11-23 15:00 CST
- 分支 `dev`，HEAD `3855e1f0f8d6ade4673b3594bcac86b848e7731e`，本包改动未提交

### 本包完成的改动

1. `ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md`：在「读写分区」之后新增 `## 收尾时没有活动会话`，7 条顺序未改。失败分支表追加 `0 active` 一行，原有四行仍在。`start` 规则保持 01 的项目绑定硬门，没有把旧句写回去。
2. `ai-plugins/common-tools/skills/use-memorix/SKILL.md`：在项目绑定硬门之后追加无活动会话说明。含「只确认要不要新建会话」和「不是索引错误，也不是归档失败」。硬门段落仍在。

本包不拥有：项目绑定硬门的替换、`memory-operations.md`、`retention-and-archive.md`、版本号、用户级检索策略。

### 证据

- 会话文件含标题「收尾时没有活动会话」，以及活动会话数量、不得声称被关掉、这一轮只确认要不要新建会话、三样证据缺一就写「本对话没有活动会话」。
- `memory-operations.md` 的现有 diff 属于 01 和 CLI 存储包，不含本包句子。
- 四份 `plan.md` 的任务定义未改。

### 执行者下一条命令

无。本包已闭环。
