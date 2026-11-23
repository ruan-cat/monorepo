# 2026-11-23 use-memorix CLI 存储命令交接

本文件是状态和证据。任务只以 `plan.md` 为准。合同只以 `spec.md` 为准。

## 耐久栏

### 授权门

- 允许修改 `plan.md` 第 1 节列出的三个路径，以及本文件的易腐栏、`plan.md` 的勾选。
- 允许在预检时运行 `memorix --version`、`memorix memory store --help`、`memorix remember --help`。这三条只读。
- 不允许提交、推送、暂存、切换分支、创建 worktree。
- 不允许运行 `skills add` 或 `skills update`，不允许改全局或用户目录里的技能副本。
- 不允许调用 Memorix 的 store、resolve、session start、session end，也不允许做归档。
- 不允许修改 Memorix CLI 仓库，也不允许修改官方 `memorix-memory`。

### 依赖门

- 执行仓库是 `D:\code\ruan-cat\monorepo`。
- 当前分支保持为接手复核时看到的分支。规划时看到的是 `dev`。
- 本包不依赖 CLI 帮助补丁先合并。帮助还没列出 `--topic-key` 时，用 spec 的未列出变体。已经列出时，用已列出变体。两种都不改存储命令本身。

### 禁止动作

- 不恢复、不暂存、不提交仓库里已有的他人改动。规划时这些改动是 `openspec/changes/slim-four-skill-descriptions/` 的删除，以及 `openspec/changes/archive/2026-11-23-slim-four-skill-descriptions/` 的未跟踪文件。
- 不新建 OpenSpec 文件、`agent-progress.md`、`agent-findings.md`。
- 不把观察编号或用户主目录写进技能正文。

### 回滚

未提交。回滚只针对本任务改过的三个路径，使用针对这三个路径的 `git checkout -- <path>`。不对其它 dirty 路径执行 checkout。回滚前把命令写进易腐栏。

### 后续不在本包

技能源改完后，由用户决定何时用既有的 `skills add` 覆盖全局副本。CLI 帮助补丁由 Memorix 仓库的另一个 PR 负责。

## 易腐栏

### 执行状态

- 包状态：已闭环
- 当前 Task：无
- 遗留项：无
- 核对时间：2026-11-23 15:00 CST
- 分支 `dev`，HEAD `3855e1f0f8d6ade4673b3594bcac86b848e7731e`，本包改动未提交

### 本包完成的改动

1. `ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md`：路由表存储行换成带 `--cwd`、`--entity`、`--type`、`--title`、`--topic-key`、`--text` 的完整命令。`topicKey` 约定改为 `--topic-key` upsert。CLI 兜底第 1、2 条换成帮助未列出 `--topic-key` 的变体。只读示例之前写入存储命令和两条附注。失败表追加「帮助里看不到主题键」，原有四行仍在。第 3 条「本次走 CLI 兜底」和只读示例三行保持原样。
2. `ai-plugins/common-tools/skills/use-memorix/SKILL.md`：`metadata.version` 改为 `3.0.2`。运行时事实来源第 2 条后追加「主题键更新不从 `memorix remember --help` 推断」。第 1、3、4、5 条和 `description` 未改。
3. `ai-plugins/skill-registry.json`：`use-memorix` 的 `version` 改为 `3.0.2`。该条目的 `description`、`plugin`、`entry` 未改。

帮助依据：`memorix` `1.10.3` 的 `memorix memory store --help` 没有 `--topic-key`，所以使用未列出变体。

本包不拥有：项目绑定硬门、无活动会话说法、用户级检索策略。

### 证据

- 两处版本都是 `3.0.2`。
- 技能正文写明 `memorix remember` 不转发 `--entity` 和 `--topic-key`，并写明指错项目会插入新记录。
- 本目录没有 `agent-progress.md` 或 `agent-findings.md`。四份 `plan.md` 的任务定义未改。

### 执行者下一条命令

无。本包已闭环。
