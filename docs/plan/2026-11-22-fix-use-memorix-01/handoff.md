# 2026-11-22 use-memorix 项目绑定硬门交接

本文件是状态和证据。任务只以 `plan.md` 为准。合同只以 `spec.md` 为准。

## 耐久栏

### 授权门

- 允许修改 `plan.md` 列出的三份技能 Markdown，以及本文件的易腐栏、`plan.md` 的执行状态。
- 允许在发现 `spec.md` 第 4 节原文已经变化时停止。
- 不允许提交、推送、暂存、切换分支、创建 worktree。
- 不允许运行 `skills add`，不允许改全局或用户目录里的 `use-memorix` 副本。
- 不允许改 `通用提示词.md`。
- 不允许调用 Memorix 的 start、store、resolve、end，也不允许移动 6422、6423、6424。

### 依赖门

- 执行仓库是 `D:\code\ruan-cat\monorepo`。
- 当前分支保持为接手复核时看到的分支。规划时看到的是 `dev`。
- 三份技能文件在执行前仍含 `spec.md` 记录的旧句。旧句消失或文件被别人改过时，停止并在易腐栏记录差异。

### 禁止动作

- 不恢复、不暂存、不提交仓库里已有的他人改动。规划时这些改动包括 `AGENTS.md`、`init-ai-md` 及其 templates、`docs/prompts/release-ai-plugins/02.md`。
- 不新建 OpenSpec 文件、`agent-progress.md`、`agent-findings.md`。
- 不把本包改写成实现会话亲自安装技能或亲自重写那三条记忆。

### 回滚

未提交。回滚只针对本任务改过的三份技能文件，使用针对这三个路径的 `git checkout -- <path>`。不对其它 dirty 路径执行 checkout。回滚前把命令写进易腐栏。

### 后续不在本包

技能源改完后，由用户决定何时用既有的 `skills add` 覆盖全局副本。`通用提示词.md` 的 `<!-- mem,7 -->` 仍写着「有就复用，不要再 `session_start`」，那是下一张单，不是本包的 Task。

## 易腐栏

### 执行状态

- 包状态：已闭环
- 当前 Task：无
- 遗留项：无
- 核对时间：2026-11-23 15:00 CST
- 分支 `dev`，HEAD `3855e1f0f8d6ade4673b3594bcac86b848e7731e`，本包改动未提交

### 本包完成的改动

1. `ai-plugins/common-tools/skills/use-memorix/SKILL.md`：平台事实整段换成项目绑定硬门 7 步。活动会话存在不能跳过 MCP 根目录核对；不一致时先确认，再把当前工作区绝对路径传给 `projectRoot`。
2. `ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md`：`start` 那一条换成同一套 7 步。「恢复会话只读不写」、`end`、handoff 原句保留。
3. `ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md`：读取路径第 1 步改为先执行本文件「项目绑定硬门」。写入路径标题下、四字段表之前写入硬门 7 步。四字段表和写入前确认要求仍在。

本包不拥有：无活动会话的追加段、CLI 存储命令、版本号 `3.0.2`、用户级检索策略。

### 证据

- 技能 Markdown 中搜索「已有则复用，不重复启动」为零命中。
- 上述三份文件都含「项目绑定硬门」和 `projectRoot`。
- 四份 `plan.md` 的任务定义未改。本目录仍只有 `spec.md`、`plan.md`、`handoff.md`。

### 执行者下一条命令

无。本包已闭环。
