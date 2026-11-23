# 2026-11-22 use-memorix [retrieval] 说明交接

本文件是状态和证据。任务只以 `plan.md` 为准。合同只以 `spec.md` 为准。

## 耐久栏

### 授权门

- 允许修改 `plan.md` 点名的那一份 reference，以及本文件的易腐栏、`plan.md` 的执行状态。
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

技能源改完后，由用户决定何时用既有的 `skills add` 覆盖已安装副本。`ruan-cat/common` 的黄金集和 mirror 已另案写入，不要在本包重做。

## 易腐栏

### 执行状态

- 包状态：未开始
- 当前 Task：Task 1
- 执行者：尚未接手。规划会话不实现。
- 阻塞：无
- 核对时间：2026-11-23 12:56 CST

### 仓库基线

- 分支：`dev`
- HEAD：`38465ef49d9c31608d5264f8db94679b3eced323`
- 跟踪：`dev...origin/dev`，与 origin 对齐
- 本次 dirty：未跟踪 `openspec/changes/slim-four-skill-descriptions/`。不碰它
- 2026-11-22 核对时的 HEAD 是 `04c8b5988640aba9f06ac27dd06a06408aab8f8c`，当时 dirty 是 `docs/prompts/index.md`
- 本任务包已随 `38465ef4` 入库。reference 仍未改

### 文件哈希

算法 SHA256。实施前必须重算。对不上就先改正本栏，再判断依赖门。哈希变化本身不构成停止；依赖门只看插入点是否还在。

| 文件                                                                                | SHA256                                                             |
| :---------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| `ai-plugins/common-tools/skills/use-memorix/references/retrieval-and-golden-set.md` | `E1DA39FC293ECD3BDCEBB6A06743EFA4C2AD51B59F435CB4F6E9EE73839F8C93` |

重算命令：

```powershell
Get-FileHash -Algorithm SHA256 ai-plugins\common-tools\skills\use-memorix\references\retrieval-and-golden-set.md
```

### 证据

- 规划会话只创建了本目录三份文件。
- 2026-11-23 重算哈希，与上栏相同。reference 里仍没有 `用户级检索策略`，依赖门的插入点还在。包保持未开始。

### 执行者下一条命令

```powershell
git status --short --branch
rg -n "用户级检索策略|判定顺序" ai-plugins/common-tools/skills/use-memorix/references/retrieval-and-golden-set.md
```
