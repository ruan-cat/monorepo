---
name: pr-ruancat-repo
description: >-
  用于对 ruan-cat 相关仓库执行批量 Pull Request、跨仓库同步改动、为多个已克隆本地仓库规划 PR
  策略、选择本地 git/Bash 与 GitHub API/MCP 混合执行方式的场景。触发关键词包括“批量 PR”
  “多仓库同步改动”“对 ruan-cat 的仓库发 PR”“pr-ruancat-repo”。
user-invocable: true
metadata:
  version: "0.4.0"
---

# PR ruan-cat Repo

批量对多个固定仓库发起统一内容 PR 的技能。

核心策略：`SKILL.md` 只保留入口、决策骨架与强制边界；仓库清单、复杂度评估、混合执行策略、输出模板等细则全部放在 `references/`，便于长期维护。

## 首要原则（CRITICAL）

在本技能中，**统一 PR 内容必须先调用 `git-commit` 技能协助生成 `commitMessage`**，再基于该 `commitMessage` 派生 `prTitle` 与 `prBody`。  
不要跳过 `git-commit` 技能直接手写提交文案。

在真正选择 PR 手段前，**必须先评估目标仓库复杂度，并主动向用户索要已经克隆到本地的 GitHub 仓库路径**。本地仓库能显著提升规模识别、依赖判断、分支状态确认与批量修改效率。

默认优先考虑 **本地 Bash 循环 + GitHub API/MCP** 的混合模式：本地负责批量检查、修改、提交与推送；远程 GitHub API/MCP 负责 PR 查询、创建、状态汇总与必要的远程元数据读取。

## 快速入口

- 目标仓库清单：[references/target-repos.md](references/target-repos.md)
- 执行规范、PR 策略与输出模板：[references/workflow-and-template.md](references/workflow-and-template.md)

## 工作流程

### 阶段 1：任务归一化（主 Agent）

1. 读取用户目标，拆成“本次统一改动意图”的一句话描述。
2. 主动向用户索要已经克隆到本地的目标仓库路径；若用户暂时无法提供，再退回远程仓库元数据识别。
3. 读取 `references/target-repos.md`，获得默认仓库集合。
4. 合并用户输入约束：
   - 若用户指定仓库白名单：取交集。
   - 若用户指定排除仓库：从集合中剔除。
   - 若用户未指定：使用全部启用仓库。
5. 按 `references/workflow-and-template.md` 的复杂度评估规则，给每个仓库标记复杂度与建议执行模式。
6. 输出“本次执行清单”（仓库列表 + 本地路径可用性 + 复杂度 + 来源分支候选名），作为后续调度输入。

### 阶段 2：统一内容生成（协调者 Agent）

由协调者一次性产出并冻结以下 4 项，避免仓库间语义漂移：

1. `prTitle`：PR 标题
2. `prBody`：PR 正文（Markdown）
3. `commitMessage`：commit 信息（必须遵循 `git-commit` 规范）
4. `sourceBranch`：来源分支（所有仓库一致）

约束：

- `commitMessage` 与 `prTitle` 必须语义一致（标题可由 commit 摘要派生）。
- 未明确要求时，正文聚焦“做了什么 + 为什么做 + 如何验证”，避免仓库特化内容。

## git-commit 使用规范（必须执行）

`pr-ruancat-repo` 在生成统一内容时，必须显式复用 `git-commit` 技能来生成 `commitMessage`，禁止凭经验手写。

### 调用时机

1. 在阶段 2 开始时先读取 `git-commit` 技能规则。
2. 先产出 `commitMessage`，再派生 `prTitle` 与 `prBody`，确保三者语义一致。

### 生成要求

1. 提交信息必须是中文。
2. 必须使用 Conventional Commits + Emoji：
   - 普通：`<emoji> type(scope): summary`
   - 破坏性：`<emoji> type(scope)!: summary`
3. `emoji` 与 `type` 必须以 `commit-types.ts` 为准，不得自造类型。
4. 若为破坏性变更，正文必须追加：
   - `BREAKING CHANGE: <迁移说明>`

### 语义一致性规则

1. `prTitle` 默认从 `commitMessage` 的标题行派生（可去掉 emoji）。
2. `prBody` 必须覆盖 commit 的“改动内容 + 原因 + 验证方式”。
3. 不允许出现 PR 标题与 commit 含义相冲突的情况。

### 批量仓库场景约束

1. 一次批量任务只生成一份统一 `commitMessage`，由所有子代理复用。
2. 不允许子代理私自改写 commit 文案；若仓库差异导致不适配，子代理应返回失败原因，由主 Agent 决策是否拆分任务。

### 阶段 3：并发调度（主 Agent -> 多子 Agent）

对每个仓库启动一个子 Agent，并发执行。每个子 Agent 严格执行同一协议：

1. 接收统一输入：`prTitle`、`prBody`、`commitMessage`、`sourceBranch`。
2. 校验仓库可访问（本地路径、远程存在性、权限）。
3. 按复杂度与本地路径可用性选择执行模式：
   - 简单远程元数据任务：可使用 GitHub API/MCP 远程完成。
   - 需要批量文件修改或验证：优先使用本地 git/Bash 循环执行，再用 GitHub API/MCP 创建 PR。
   - 高复杂度仓库：先本地检查构建系统、分支、依赖与脚本，再决定是否拆分 PR。
4. 目标分支决策（分支探测）：

```plain
若存在 dev   -> target = dev
否则若存在 main -> target = main
否则若存在 master -> target = master
否则 -> 标记失败并返回（无法确定目标分支）
```

5. 发起 PR（GitHub API/MCP；必要时配合本地 git commit/push）。
6. 返回标准结果对象：
   - `repo`
   - `localPath`
   - `executionMode`
   - `complexity`
   - `targetBranch`
   - `status` (`success` | `failed`)
   - `prUrl`（成功时）
   - `reason`（失败时）

### 阶段 4：结果汇总（主 Agent）

1. 聚合所有子 Agent 结果，不因单仓库失败中断全局流程。
2. 按“成功在前，失败在后”输出报告。
3. 汇总模板使用 `references/workflow-and-template.md`。
4. 额外输出：
   - 成功数 / 失败数
   - 失败仓库重试建议（权限问题、分支不存在、仓库不可达）

### 阶段 5：收尾与可追溯性

1. 回显本次统一输入（标题、来源分支、commit 摘要）供用户复核。
2. 若用户要求二次执行（重试失败仓库），只对失败仓库重跑阶段 3。
3. 合并 PR 时优先保持线性历史：
   - GitHub PR 页面优先使用 rebase 合并。
   - 本地合并优先使用不产生额外合并节点的方式，例如 `git merge --ff-only`。
4. PR 完成并确认已合并后，及时删除远程来源分支与本地来源分支。
5. 若用户要求扩容/缩容默认仓库，提示修改 `references/target-repos.md`。

## 子代理调度规范（必须遵守）

### 调度粒度

- 一仓库一子代理，避免多仓库状态互相污染。
- 子代理之间不得共享可变状态；统一内容由主 Agent 只读广播。

### 并发策略

- 默认“全并发”。
- 若遇到平台限流或权限风控，降级为“小批并发”（例如每批 2-3 个仓库）。

### 幂等与重复执行

- 若仓库已存在同源分支到同目标分支的未合并 PR：
  - 默认返回“已存在”并附现有 PR 链接；
  - 不重复创建新的 PR（除非用户明确要求新建）。

## 数据契约（主 Agent 与子 Agent 之间）

### 输入契约

```json
{
	"repo": "owner/name",
	"prTitle": "string",
	"prBody": "string",
	"commitMessage": "string",
	"sourceBranch": "string"
}
```

### 输出契约

```json
{
	"repo": "owner/name",
	"localPath": "string | null",
	"executionMode": "remote-api|local-git|hybrid",
	"complexity": "low|medium|high",
	"targetBranch": "dev|main|master|unknown",
	"status": "success|failed",
	"prUrl": "string | null",
	"reason": "string | null"
}
```

## 强制要求

- 必须先评估目标仓库复杂度，再决定 PR 执行手段。
- 必须主动向用户索要本地已克隆仓库路径；无法获取时才降级为远程识别。
- 可以混合使用本地 git/Bash 与 GitHub API/MCP；不要把 `gh` CLI 作为唯一手段。
- 批量跨仓库 PR 的默认高效模式是本地 Bash 循环 + 远程 GitHub API/MCP。
- 来源分支名在所有仓库保持一致。
- 单仓库失败不影响整体任务，继续处理剩余仓库。
- 分支合并优先保持线性历史，避免产生额外 merge commit。
- PR 合并完成后必须及时清理远程来源分支与本地来源分支。
- 若用户要求“增删目标仓库”，只更新 `references/target-repos.md`，不在 `SKILL.md` 内硬编码。
- 每次执行前必须先读取 `references/target-repos.md` 与 `references/workflow-and-template.md`。
- 每次执行前必须先读取 `git-commit` 技能与 `commit-types.ts`，再生成 `commitMessage`。

## 维护规则

- **新增/移除仓库**：改 `references/target-repos.md`
- **调整执行规范或报告结构**：改 `references/workflow-and-template.md`
- **本文件仅保留入口与流程，不重复维护仓库明细**
