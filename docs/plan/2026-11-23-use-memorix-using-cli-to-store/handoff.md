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

- 包状态：未开始
- 当前 Task：Task 1
- 执行者：尚未接手。规划会话不实现。
- 阻塞：无
- 核对时间：2026-11-23 14:05 CST

### 仓库基线

- 分支：`dev`
- HEAD：`9857e8e1a3f8964f18074692820f5c386a06eb84`
- 跟踪：`dev...origin/dev`
- 规划时 dirty：`openspec/changes/slim-four-skill-descriptions/` 下五份文件显示为删除；`openspec/changes/archive/2026-11-23-slim-four-skill-descriptions/` 未跟踪
- 规划时 `use-memorix` 的 `metadata.version` 与注册表版本都是 `3.0.1`
- 规划时 `memory-operations.md` 的存储兜底仍是 `memorix memory store ...`，CLI 兜底仍写参数以 `--help` 为准
- 规划时本机 `memorix --version` 为 `1.10.3`。`memorix memory store --help` 的动作总览没有 `--topic-key`
- index：本包三份文件当时未暂存。写集三处当时无本包 diff
- 文件哈希：实施前必须重算。规划时未计算三份技能文件

接手时重跑下面的预检。结果与上面不一致，先改正这一栏，再判断依赖门是否仍成立。

### 证据

- 规划会话只创建了本目录三份文件。
- 尚未修改写集三处。
- 尚未运行 Task 1 到 Task 4 的验收。

### 执行者下一条命令

在 `D:\code\ruan-cat\monorepo` 运行：

```powershell
git status --short --branch
git rev-parse HEAD
git branch --show-current
memorix --version
memorix memory store --help
rg -n "memory store \.\.\.|topic-key|--help" ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md
```

预检通过后，从 `plan.md` Task 1 开始。帮助里是否已经出现 `--topic-key`，决定 Task 1 用哪一版第 2 条。
