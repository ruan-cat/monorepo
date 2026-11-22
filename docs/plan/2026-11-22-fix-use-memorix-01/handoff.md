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

- 包状态：未开始
- 当前 Task：Task 1
- 执行者：尚未接手。规划会话不实现。
- 阻塞：无
- 核对时间：2026-11-22 01:17 CST

### 仓库基线

- 分支：`dev`
- HEAD：`5423716a337b105fde264a896db90a8c177aed63`
- 跟踪：`dev...origin/dev`
- 暂存区：规划时 `git status --short` 的第一列没有暂存标记
- 规划时 dirty：`AGENTS.md`、`ai-plugins/common-tools/skills/init-ai-md/SKILL.md`、该技能下多份 templates、`docs/prompts/release-ai-plugins/02.md`
- 本任务包当时尚未入库

### 文件哈希

算法 SHA256。实施前必须重算。对不上就先改正本栏，再判断依赖门。哈希变化本身不构成停止；依赖门只看旧句是否还在。

| 文件                                                                             | SHA256                                                             |
| :------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| `ai-plugins/common-tools/skills/use-memorix/SKILL.md`                            | `6074F0A59A75EA4F0AD2E2BB620664C930BE77270C13F78F7310B34CD3CF8C6A` |
| `ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md` | `5D440682E5F764D10625037F5A184784F6489982D8324E51A3F8D9352EB4D957` |
| `ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md`     | `B03BB6AE7E86DA669258E2474EDDCB7F6F668369118BE2AB90138F8628E73695` |

重算命令：

```powershell
Get-FileHash -Algorithm SHA256 ai-plugins\common-tools\skills\use-memorix\SKILL.md, ai-plugins\common-tools\skills\use-memorix\references\session-and-reasoning.md, ai-plugins\common-tools\skills\use-memorix\references\memory-operations.md
```

接手时重跑下面的预检。结果与上面不一致，先改正这一栏，再判断依赖门是否仍成立。

### 证据

- 规划会话只创建了本目录三份文件。
- 尚未修改三份技能文件。
- 尚未运行 Task 4 的验收搜索。

### 执行者下一条命令

接手的预检就是下面这一组，按顺序跑完。跑完后先改易腐栏，再做 Task 1。在 `D:\code\ruan-cat\monorepo` 运行：

```powershell
git status --short --branch
git rev-parse HEAD
git branch --show-current
rg -n "已有则复用，不重复启动|项目绑定硬门" ai-plugins/common-tools/skills/use-memorix -g "*.md"
```

预检通过后，从 `plan.md` Task 1 开始。
