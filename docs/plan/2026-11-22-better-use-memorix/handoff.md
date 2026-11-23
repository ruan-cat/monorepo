# 2026-11-22 use-memorix [retrieval] 说明交接

本文件是状态和证据。任务只以 `plan.md` 为准。合同只以 `spec.md` 为准。

## 耐久栏

### 授权门

- 允许修改 `plan.md` 点名的那一份 reference，Task 4 点名的两个 common Markdown，以及本文件的易腐栏、`plan.md` 的执行状态。
- 不允许提交、推送、暂存、切换分支、创建 worktree。
- 不允许运行 `skills add`，不允许改已安装的 `use-memorix` 副本。
- 不允许改 `SKILL.md`、会话参考、记忆参考，也不允许改 01、02 两个任务包。
- 不允许改本机 memorix 配置，不允许在本包里初始化黄金集。

### 依赖门

- 执行仓库是 `D:\code\ruan-cat\monorepo`。
- 当前分支保持为接手复核时看到的分支。规划时看到的是 `dev`。
- 目标 reference 在执行前仍是「动作表后面直接是判定顺序」，且没有 `用户级检索策略`。这段已经有了，就停止，不要再插一次。

### 禁止动作

- 不恢复、不暂存、不提交仓库里已有的他人改动。规划时 dirty 只有 `docs/prompts/index.md`。
- 不新建 OpenSpec 文件、`agent-progress.md`、`agent-findings.md`。
- 不把本包改写成亲自安装技能或亲自改本机 toml。

### 回滚

未提交。回滚只针对那一份 reference，使用针对该路径的 `git checkout -- <path>`。不对其它 dirty 路径执行 checkout。

### 后续不在本包

技能源改完后，由用户决定何时用既有的 `skills add` 覆盖已安装副本。`ruan-cat/common` 的黄金集和 mirror 已另案写入，不要在本包重做。Task 4 只回写 common 的两句现行说明，不代替 `skills add`。

## 易腐栏

### 执行状态

- 包状态：已闭环
- 当前 Task：无
- 遗留项：无
- 核对时间：2026-11-23 15:00 CST
- monorepo 分支 `dev`，HEAD `3855e1f0f8d6ade4673b3594bcac86b848e7731e`。reference 改动未提交，不编 SHA。

### 本包完成的改动

1. `ai-plugins/common-tools/skills/use-memorix/references/retrieval-and-golden-set.md`：在 Embedding 动作表和「判定顺序（不要跳步）」之间插入一次 `### 用户级检索策略`。正文含 `cjk = "vector"`、`ascii = "hybrid"`，并写明改这两个字段前要先确认。判定顺序五条未改。
2. `D:\store\WorkBuddy\2026-6-30-common\docs\memorix\index.md`：现行入口里 embedding 那一行的主题末尾写明源文件已有这段，已安装副本要等用户另行 `skills add`。
3. `D:\store\WorkBuddy\2026-6-30-common\docs\memorix\2026-10-13-about-embedding-mode\handoff.md`：「压缩后接着做」第 1 条改为同一事实，并写明这次 reference 改动未提交。

本包不拥有：`SKILL.md`、会话参考、记忆参考、版本号、01 与 02 两个任务包。`cases.json` 与 mirror 无本包 diff。

### 证据

- `### 用户级检索策略` 在该 reference 中只出现一次。
- common 两处都能搜到「用户级检索策略」，并写了已安装副本尚未更新。
- 四份 `plan.md` 的任务定义未改。

### 执行者下一条命令

无。本包已闭环。
