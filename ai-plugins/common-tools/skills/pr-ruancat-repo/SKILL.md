---
name: pr-ruancat-repo
description: >-
  对 ruan-cat 相关仓库执行批量 Pull Request 的技能。用于“批量 PR”“多仓库同步改动”
  “对 ruan-cat 的仓库发 PR”“pr-ruancat-repo”等场景。技能会统一生成 PR 信息，
  再按仓库并发发起 PR，最后输出汇总报告。目标仓库与维护策略统一放在 references 文件中。
user-invocable: true
metadata:
  version: "0.3.2"
---

# PR ruan-cat Repo

批量对多个固定仓库发起统一内容 PR 的技能。  
核心策略：`SKILL.md` 只保留流程，仓库清单与模板全部拆到 `references/`，便于长期维护。

## 首要原则（CRITICAL）

在本技能中，**统一 PR 内容必须先调用 `git-commit` 技能协助生成 `commitMessage`**，再基于该 `commitMessage` 派生 `prTitle` 与 `prBody`。  
不要跳过 `git-commit` 技能直接手写提交文案。

## 快速入口

- 目标仓库清单：`[references/target-repos.md](references/target-repos.md)`
- 执行规范与输出模板：`[references/workflow-and-template.md](references/workflow-and-template.md)`

## 工作流程

### 阶段 1：任务归一化（主 Agent）

1. 读取用户目标，拆成“本次统一改动意图”的一句话描述。
2. 读取 `references/target-repos.md`，获得默认仓库集合。
3. 合并用户输入约束：
   - 若用户指定仓库白名单：取交集。
   - 若用户指定排除仓库：从集合中剔除。
   - 若用户未指定：使用全部启用仓库。
4. 输出“本次执行清单”（仓库列表 + 来源分支候选名），作为后续调度输入。

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
2. 校验仓库可访问（存在性 + 权限）。
3. 目标分支决策（分支探测）：

```plain
若存在 dev   -> target = dev
否则若存在 main -> target = main
否则若存在 master -> target = master
否则 -> 标记失败并返回（无法确定目标分支）
```

4. 发起 PR（GitHub MCP）。
5. 返回标准结果对象：
   - `repo`
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
3. 若用户要求扩容/缩容默认仓库，提示修改 `references/target-repos.md`。

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
	"targetBranch": "dev|main|master|unknown",
	"status": "success|failed",
	"prUrl": "string | null",
	"reason": "string | null"
}
```

## 强制要求

- 必须通过 GitHub MCP 工具执行，不用 `gh` CLI 作为唯一手段。
- 来源分支名在所有仓库保持一致。
- 单仓库失败不影响整体任务，继续处理剩余仓库。
- 若用户要求“增删目标仓库”，只更新 `references/target-repos.md`，不在 `SKILL.md` 内硬编码。
- 每次执行前必须先读取 `references/target-repos.md` 与 `references/workflow-and-template.md`。
- 每次执行前必须先读取 `git-commit` 技能与 `commit-types.ts`，再生成 `commitMessage`。

## 维护规则

- **新增/移除仓库**：改 `references/target-repos.md`
- **调整执行规范或报告结构**：改 `references/workflow-and-template.md`
- **本文件仅保留入口与流程，不重复维护仓库明细**
