---
name: pr-ruancat-repo
description: >-
  用于对 ruan-cat 相关仓库执行批量 Pull Request、跨仓库同步改动、为多个已克隆本地仓库规划 PR
  策略、选择本地 git/Bash 与 GitHub API/MCP 混合执行方式的场景。触发关键词包括“批量 PR”
  “多仓库同步改动”“对 ruan-cat 的仓库发 PR”“pr-ruancat-repo”。
user-invocable: true
metadata:
  version: "1.0.0"
---

# PR ruan-cat Repo

批量对多个固定仓库发起统一内容 PR 的技能。

核心策略：`SKILL.md` 只保留入口、决策骨架与强制边界；仓库清单、复杂度评估、混合执行策略、脚本模板、输出模板等细则全部放在 `references/`，便于长期维护。

## 首要原则（CRITICAL）

在本技能中，**统一 PR 内容必须先调用 `git-commit` 技能协助生成 `commitMessage`**，再基于该 `commitMessage` 派生 `prTitle` 与 `prBody`。  
不要跳过 `git-commit` 技能直接手写提交文案。

在真正选择 PR 手段前，**必须先评估目标仓库复杂度，并主动向用户索要已经克隆到本地的 GitHub 仓库路径**。本地仓库能显著提升规模识别、依赖判断、分支状态确认与批量修改效率。

默认优先考虑 **本地 Bash 循环 + GitHub API/MCP** 的混合模式：本地负责批量检查、修改、提交与推送；远程 GitHub API/MCP 负责 PR 查询、创建、状态汇总与必要的远程元数据读取。

对于**简单批量 PR 场景**（所有目标仓库有本地路径、变更内容统一、无需仓库级定制、用户确认 `gh` CLI 可用），优先使用**脚本自动化模式**——生成可本地执行的一次性 TypeScript 脚本（`batch-pr.ts`），替代 AI 逐仓库调用 `gh` CLI / GitHub MCP，可减少约 80–90% 的 token 消耗。

## 快速入口

- 目标仓库清单：[references/target-repos.md](references/target-repos.md)
- 执行规范、PR 策略与输出模板：[references/workflow-and-template.md](references/workflow-and-template.md)
- 脚本自动化模式模板：[references/batch-pr-script.ts](references/batch-pr-script.ts)

## 工作流程

### 阶段 1：任务归一化（主 Agent）

1. 读取用户目标，拆成"本次统一改动意图"的一句话描述。
2. 主动向用户索要已经克隆到本地的目标仓库路径；若用户暂时无法提供，再退回远程仓库元数据识别。
3. 读取 `references/target-repos.md`，获得默认仓库集合。
4. 合并用户输入约束：
   - 若用户指定仓库白名单：取交集。
   - 若用户指定排除仓库：从集合中剔除。
   - 若用户未指定：使用全部启用仓库。
5. 按 `references/workflow-and-template.md` 的复杂度评估规则，给每个仓库标记复杂度与建议执行模式。
6. 输出"本次执行清单"（仓库列表 + 本地路径可用性 + 复杂度 + 来源分支候选名），作为后续调度输入。

### 阶段 2α：统一内容生成（协调者 Agent）

由协调者一次性产出并冻结以下 4 项，避免仓库间语义漂移：

1. `prTitle`：PR 标题
2. `prBody`：PR 正文（Markdown）
3. `commitMessage`：commit 信息（必须遵循 `git-commit` 规范）
4. `sourceBranch`：来源分支（所有仓库一致）

约束：

- `commitMessage` 与 `prTitle` 必须语义一致（标题可由 commit 摘要派生）。
- 未明确要求时，正文聚焦"做了什么 + 为什么做 + 如何验证"，避免仓库特化内容。

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
2. `prBody` 必须覆盖 commit 的"改动内容 + 原因 + 验证方式"。
3. 不允许出现 PR 标题与 commit 含义相冲突的情况。

### 批量仓库场景约束

1. 一次批量任务只生成一份统一 `commitMessage`，由所有子代理复用。
2. 不允许子代理私自改写 commit 文案；若仓库差异导致不适配，子代理应返回失败原因，由主 Agent 决策是否拆分任务。

## 阶段 2β：范围探索（主 Agent）

在统一内容冻结后、进入执行阶段前，必须先对目标仓库做范围探索，产出结构化的范围分析数据。

### 探索目标

对每个目标仓库执行以下扫描，生成 `scopeAnalysis` JSON：

```json
{
	"scopeAnalysis": {
		"repos": [
			{
				"repo": "ruan-cat/notes",
				"localPath": "D:/code/ruan-cat/notes",
				"status": "in-scope",
				"affectedFiles": [
					".github/workflows/ci.yaml",
					".github/workflows/vercel-deploy-tool.yaml"
				],
				"fileCount": 2,
				"observations": [
					"包含 release 工作流，需保留 registry-url"
				],
				"currentValues": ["22.14.0", "22.14.0"]
			}
		],
		"excludedRepos": [
			{
				"repo": "ruan-cat/mall-nuxt",
				"reason": "未在本地克隆"
			}
		],
		"totalFiles": 22,
		"totalOccurrences": 23,
		"specialPatterns": [
			"release 工作流需保留 registry-url",
			"lts/* 版本需要替换为具体版本号"
		],
		"transformations": [
			{
				"description": "替换所有 setup-node 的 node-version 为 24.18.0",
				"glob": ".github/workflows/*.{yml,yaml}",
				"search": "node-version:\\s*\\S+",
				"replace": "node-version: 24.18.0"
			}
		]
	}
}
```

### 探索步骤

1. **验证本地路径**：检查每个仓库的 `localPath` 是否存在。不存在则加入 `excludedRepos`。
2. **扫描目标文件**：根据任务类型扫描相关目录。例如 `.github/workflows/*.{yml,yaml}` 查找 `setup-node` 配置。
3. **grep 搜索**：使用 `grep -R -n` 查找目标模式，记录匹配文件路径和行号。
4. **计数与归类**：统计受影响文件数、匹配次数、当前值分布。
5. **识别特殊模式**：发现不同仓库的差异（如 release 文件有额外字段、部分仓库使用不同版本号、引号格式不一致）。
6. **归纳转换规则**：将探索结果抽象为 `transformations[]` 规则（见下方数据契约），供脚本使用。每条规则必须包含人类可读的 `description`、精确的 `glob`、安全的 `search` 正则和最小改动的 `replace`。
7. **汇总输出**：产出完整的 `scopeAnalysis` JSON。

### 排除原则

- 本地未克隆：加入 `excludedRepos`，原因标注"未克隆"
- 已克隆但无目标文件：加入 `excludedRepos`，原因标注"已克隆，但无目标文件"
- 权限不足或无法读取：加入 `excludedRepos`，原因标注"权限不足/读取失败"

## 阶段 2γ：设计规格生成（主 Agent）

基于阶段 2α 的统一内容和阶段 2β 的范围探索结果，生成完整的设计规格文档 `spec.md`。

### spec.md 结构

```markdown
# YYYY-MM-DD <仓库名> <任务名> 设计规格

## 1. 背景与目标

### 1.1 背景

{从阶段 2α 的统一内容中提取：为什么要做这次批量改动}

### 1.2 当前状态扫描

{从阶段 2β 的范围探索中提取：当前版本分布、扫描命令、扫描结论}

### 1.3 目标

{本次批量改动要达成的具体目标}

## 2. 改动范围

### 2.1 目标仓库

| 序号 | 仓库 | 本地路径 | 涉及文件数 |
| :--: | :--- | :------- | :--------: |
| ...  | ...  | ...      | ...        |

### 2.2 未包含的仓库

{本地未克隆或没有目标文件的仓库及原因}

### 2.3 涉及的文件

{具体的文件路径列表，含每个仓库的当前值/预期值/备注}

## 3. 替换策略

### 3.1 统一规则

{对所有仓库一致的替换规则}

### 3.2 特殊处理

{需要特殊处理的仓库或文件，例如 release 工作流保留 registry-url}

### 3.3 转换规则（pr-transform.json）

{从 scopeAnalysis.transformations[] 派生的 JSON 规则及说明}

## 4. 范围探索数据契约

{scopeAnalysis JSON 的完整内容或摘要}

## 5. 执行模式

推荐使用**脚本自动化模式**（生成 `batch-pr.ts` 由用户本地执行）。

## 6. 分支策略

- 来源分支：{sourceBranch}
- 目标分支探测：dev > main > master

## 7. Commit 与 PR 文案

### 7.1 Commit Message

{commitMessage}

### 7.2 PR 标题

{prTitle}

### 7.3 PR 正文

{prBody}

## 8. 验证方式

### 8.1 替换验证

{例如 grep 命令}

### 8.2 语法验证

{例如 YAML 语法检查方式}

### 8.3 PR 状态验证

{PR URL、状态汇总}

### 8.4 执行命令示例

{dry-run 和实际执行命令}

## 9. PR 合并与分支清理

### 9.1 合并命令

{`npx tsx batch-pr.ts merge` 等}

### 9.2 合并流程

{扫描 PR → rebase 合并 → 删除分支 → 验证 → 生成 merge-summary.md}

### 9.3 分支清理原则

{必须删除本次来源分支，不得删除默认分支和 GitHub Pages 源分支}

### 9.4 合并后状态

| 仓库 | PR | 目标分支 | 分支删除 |
| :--- | --- | :--- | :------: |
| ...  | ... | ...  | ...      |

## 10. 风险与回滚

| 序号 | 风险 | 影响 | 应对措施 |
| :--: | :--- | :--- | :------- |
| ...  | ...  | ...  | ...      |

## 11. 验收标准

- [ ] 验收项 1
- [ ] 验收项 2
```

### 生成要求

- spec.md 必须存放在本次任务的输出目录（与 `batch-pr.ts` 同目录）。
- spec.md 的"替换策略"和"验证方式"必须直接从 `scopeAnalysis.transformations[]` 派生。
- spec.md 的"风险与回滚"必须覆盖 `scopeAnalysis` 中发现的特殊模式。
- spec.md 的"验收标准"必须与 `transformations[]` 一一对应。
- `spec.md` 是 AI 生成脚本和用户审查的桥梁——用户可通过审查 spec.md 来确认 AI 的理解是否正确。

## 脚本自动化模式（Script Automation Mode）

脚本自动化模式是本技能 v0.5.0 引入的**低 token 消耗执行方案**，旨在将简单的批量 PR 操作从 AI 实时编排转为本地一次性脚本执行。

该模式在阶段 2β（范围探索）和阶段 2γ（设计规格生成）完成后触发。范围探索提供的 `scopeAnalysis` 数据（含 `transformations[]` 规则）直接驱动脚本生成，确保脚本具备**精准的文件内容变换能力**而非仅整文件拷贝。

### 适用条件

以下条件**全部满足**时，必须优先选择脚本自动化模式：

1. **所有目标仓库均在本地有克隆**（用户已提供本地路径映射）。
2. **变更内容高度统一**——所有仓库的修改语义一致（例如：同一配置文件、同一文案更新、同一依赖升级）。
3. **用户确认 `gh` CLI 已安装并已认证**（`gh auth status` 通过）。
4. **用户明确同意或未反对脚本执行方案**（询问后获许可）。
5. **复杂度分级为 low 或 medium**（非 high 复杂度仓库）。

以下场景**不适合**脚本自动化模式，应退回子代理调度：

- 不同仓库需要不同的文件修改或不同的 commit 内容。
- 某个仓库需要手动构建验证或感知上下文（如 monorepo 包依赖变更）。
- 用户没有提供完整的本地路径，或部分仓库只能远程操作。
- 用户本地没有 `gh` CLI 或 Node.js 18+。

### 收益量化

| 指标            | 子代理模式（18 仓库） | 脚本自动化模式 | 节省幅度 |
| :-------------- | :------------------- | :------------- | :------- |
| AI 工具调用次数 | 90–180 次            | 0 次（执行阶段）| ~100%    |
| AI token 消耗   | 80k–150k             | 5k–15k         | ~80–90%  |
| 用户等待时间    | 10–30 min（AI 执行） | 1–3 min（本地）| ~90%     |
| 可重复执行      | 需重新调度           | 可随意重跑     | —        |

### 产出物清单

当选择脚本自动化模式时，AI 在阶段 3a 一次性生成以下文件，**全部放在 `batch-pr-<YYYY-MM-DD>/` 工作目录中**（目录名不可省略）：

| 文件                     | 用途                           | 生成者 |
| :----------------------- | :----------------------------- | :----- |
| `pr-config.json`         | 仓库清单 + 本地路径 + PR 元数据 | AI     |
| `pr-body.md`             | PR 正文（Markdown，默认）       | AI     |
| `commit-message.txt`     | git commit 信息（纯文本，默认） | AI     |
| `spec.md`                | 完整设计规格文档               | AI     |
| `pr-transform.json`      | 文件内容转换规则（如有）       | AI     |
| `batch-pr.ts`            | 可执行的 TypeScript 脚本       | AI     |
| `README.md`              | 使用说明与执行指引             | AI     |
| `changes/<repo_safe>/*`  | 跨仓库共享的待修改文件（可选） | AI     |
| `commit-message--<repo_safe>.txt` | **per-repo 差异化** commit（可选） | AI |
| `pr-body--<repo_safe>.md`         | **per-repo 差异化** PR 正文（可选） | AI |

用户只需执行 `npx tsx batch-pr.ts`，脚本会自动完成所有仓库的 git 操作 + PR 创建，并输出 `execution-summary.md`。

### 与子代理模式的对比

```
┌─ 子代理模式（v0.4.0 默认） ─────────────────────┐
│  AI → 18× sub-agent → ~90 tool calls → 报告      │
│  Token 消耗: 高                                    │
│  容错: AI 可实时调整                               │
│  适用: 所有场景                                    │
└──────────────────────────────────────────────────┘

┌─ 脚本自动化模式（v0.5.0 新增） ──────────────────┐
│  AI → 1× 生成脚本 → 用户本地执行 → AI 读取报告    │
│  Token 消耗: 低                                    │
│  容错: 脚本内建错误处理 + 可重跑                   │
│  适用: 简单统一变更 + 全部本地路径                  │
└──────────────────────────────────────────────────┘
```

### 阶段 3a：脚本生成（主 Agent）

当阶段 2 完成且「脚本自动化模式」的适用条件全部满足时，按以下步骤生成产出物：

1. **创建强制工作目录**：**必须**在工作目录或当前项目根目录下创建 `batch-pr-<YYYY-MM-DD>/` 目录。AI 生成的所有产物文件全部写入该目录。用户后续在此目录中执行脚本。

2. **生成 `pr-config.json`**：包含仓库列表、本地路径、来源分支名、PR 标题。格式如下：
2. **生成 `pr-config.json`**：包含仓库列表、本地路径、来源分支名、PR 标题。格式如下：

   ```json
   {
   	"repos": [
   		{
   			"repo": "ruan-cat/notes",
   			"localPath": "D:/code/ruan-cat/notes",
   			"sourceBranch": "feat/update-vitepress-config"
   		}
   	],
   	"prTitle": "docs: 统一更新 Vitepress 配置",
   	"sourceBranch": "feat/update-vitepress-config"
   }
   ```

3. **生成 `pr-body.md`**：面向用户的 PR 正文 Markdown。聚焦"改动了什么 + 为什么改 + 如何验证"。正文中建议包含：

   ```markdown
   ## 改动内容

   - 列出具体变更点

   ## 改动原因

   - 说明业务或技术背景

   ## 验证方式

   - 构建、测试或人工检查步骤
   ```

4. **生成 `commit-message.txt`**：从阶段 2 冻结的 `commitMessage` 写入纯文本文件，**不带 Emoji**（`gh` CLI 创建的 PR 标题会独立使用 emoji，commit 内容保持干净）。例如：`feat(config): update vitepress base path configuration`。

5. **生成 `batch-pr.ts`**：以 `references/batch-pr-script.ts` 为参考模板，根据本次任务的实际情况生成**定制化**的 TypeScript 脚本：
   - 必须将 `pr-config.json` 中的仓库列表直接嵌入脚本（或用读取 `pr-config.json` 的方式）。
   - 必须硬编码 `prTitle` 和 `sourceBranch`。
   - 默认使用脚本自身所在目录作为工作目录（通过 `import.meta.url` 解析），确保用户从任意目录执行都不会读错配置。
   - 可选包含 `--workdir <path>` 参数支持，用于覆盖默认工作目录。
   - 必须包含健壮的错误处理：工作树不干净、推送被拒绝、PR 已存在等场景应优雅跳过并记录原因。
   - 必须支持 `--dry-run` 参数用于预览。
   - 必须在执行完成后写入 `execution-summary.md`。
   - 必须集成阶段 2β 产出的 `transformations[]` 规则，使脚本具备 inline 搜索替换能力而非仅整文件拷贝。转换规则以 `pr-transform.json` 文件形式与脚本同目录存放。
   - 必须支持 per-repo 差异化文件（`commit-message--<repo_safe>.txt`、`pr-body--<repo_safe>.md`），读取优先级：per-repo 文件 > 通用文件。
   - 建议内建任务相关残留改动的自动清理：若工作树中的未提交文件全部被 `transformations[]` 规则覆盖，可安全 `git reset --hard HEAD` 后重跑；否则保留跳过行为，避免覆盖用户真实改动。

6. **生成 `pr-transform.json`（如有转换规则）**：从 `scopeAnalysis.transformations[]` 写入独立 JSON 文件，格式如下：

   ```json
   {
   	"transformations": [
   		{
   			"description": "替换所有 setup-node 的 node-version 为 24.18.0",
   			"glob": ".github/workflows/*.{yml,yaml}",
   			"search": "node-version:\\s*\\S+",
   			"replace": "node-version: 24.18.0"
   		}
   	]
   }
   ```

7. **生成 per-repo 差异化文件（可选）**：当某仓库需要与其他仓库不同的 commit 或 PR 正文时，按以下命名规则额外生成覆盖文件：

   ```
   commit-message--<repo_safe>.txt   # 例如：commit-message--ruan-cat__notes.txt
   pr-body--<repo_safe>.md            # 例如：pr-body--ruan-cat__notes.md
   ```

   其中 `<repo_safe>` 为 repo 标识中的 `/` 替换为 `__`。脚本读取时**优先使用 per-repo 文件**，不存在时回退到通用文件。

8. **生成待修改文件（可选）**：在 `changes/` 子目录下以 `<repo_safe>` 格式组织待拷贝文件：

   ```
   changes/ruan-cat__notes/    # per-repo 优先
   changes/ruan-cat__monorepo/ # per-repo 优先
   ```

   脚本执行顺序为：inline 转换 → per-repo changes 拷贝 → 通用 changes 拷贝。

9. **验证产出物**：
   - 确保所有文件在同一目录下。
   - 确保 `pr-config.json` 中的路径**均为有效绝对路径**。
   - 对 `batch-pr.ts` 做**语法快速检查**（如 `npx tsx --eval 'import "./batch-pr.ts"'` 或直接 `npx tsc --noEmit batch-pr.ts`），确保无误。

### 阶段 3b：用户本地执行

生成脚本后，主 Agent 向用户输出清晰的执行指引：

1. 告知用户产物所在目录（`batch-pr-<YYYY-MM-DD>/`）。
2. 建议的执行命令（脚本默认读取自身所在目录的配置）：
   - `cd batch-pr-<YYYY-MM-DD> && npx tsx batch-pr.ts --dry-run`（先预览效果）
   - `cd batch-pr-<YYYY-MM-DD> && npx tsx batch-pr.ts`（实际执行）
   - 或从其他目录通过 `--workdir` 指定：`npx tsx /path/to/batch-pr.ts --workdir ./batch-pr-<YYYY-MM-DD>`
   - 合并模式：`npx tsx batch-pr.ts merge --dry-run` 预览，`npx tsx batch-pr.ts merge` 实际合并
3. 告知用户预期结果：脚本执行后将生成 `execution-summary.md` 汇总报告；合并模式生成 `merge-summary.md`。
4. 请用户执行完毕后反馈 `execution-summary.md` 内容，或告知执行结果。

**在用户执行期间，AI Agent 不消耗 token**——这是脚本自动化模式的核心收益。

### 阶段 3c：结果收集与清理

用户执行完毕后，读取 `execution-summary.md`（或由用户粘贴/提供其内容），进入阶段 4 结果汇总。

**工作目录清理**：用户确认结果满意后，可删除 `batch-pr-<YYYY-MM-DD>/` 临时工作目录以释放空间。脚本产的 `execution-summary.md` 建议留存归档。

---

### 阶段 3（传统）：并发调度（主 Agent -> 多子 Agent）

当**不适合使用脚本自动化模式**（条件不满足或用户拒绝）时，回落到此传统模式。阶段 2β 的范围探索数据（`scopeAnalysis`）仍可为子代理提供参考。

> **决策点**：进入此阶段前，必须明确选择"脚本模式"或"子代理模式"。如果选择了脚本模式（阶段 3a→3b→3c），则**跳过此阶段**。

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

1. 聚合所有仓库的执行结果（来自脚本模式或子代理模式）。
2. 不因单仓库失败中断全局流程。
3. 按"成功在前，失败在后"输出报告。
4. 汇总模板使用 `references/workflow-and-template.md`。
5. 额外输出：
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

- 默认"全并发"。
- 若遇到平台限流或权限风控，降级为"小批并发"（例如每批 2-3 个仓库）。

### 幂等与重复执行

- 若仓库已存在同源分支到同目标分支的未合并 PR：
  - 默认返回"已存在"并附现有 PR 链接；
  - 不重复创建新的 PR（除非用户明确要求新建）。

## 数据契约

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
	"executionMode": "remote-api|local-git|hybrid|script-auto",
	"complexity": "low|medium|high",
	"targetBranch": "dev|main|master|unknown",
	"status": "success|failed",
	"prUrl": "string | null",
	"reason": "string | null"
}
```

### 范围探索契约（scopeAnalysis）

```json
{
	"scopeAnalysis": {
		"repos": [
			{
				"repo": "owner/name",
				"localPath": "absolute/path",
				"status": "in-scope|excluded",
				"excludeReason": "string | null",
				"affectedFiles": ["path/to/file.yml"],
				"fileCount": 3,
				"observations": ["特殊模式说明"],
				"currentValues": ["22.14.0"]
			}
		],
		"excludedRepos": [
			{
				"repo": "owner/name",
				"reason": "未克隆 / 无目标文件 / 权限不足"
			}
		],
		"totalFiles": 22,
		"totalOccurrences": 23,
		"specialPatterns": ["release 工作流需保留 registry-url"],
		"transformations": [
			{
				"description": "描述转换目的",
				"glob": ".github/workflows/*.{yml,yaml}",
				"search": "搜索正则",
				"replace": "替换字符串"
			}
		]
	}
}
```

### 转换规则契约（pr-transform.json）

```json
{
	"transformations": [
		{
			"description": "人类可读的描述",
			"glob": "匹配文件的 glob 模式",
			"search": "搜索正则（不含 / 定界符）",
			"replace": "替换字符串（支持 $1 捕获组引用）"
		}
	]
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
- 若用户要求"增删目标仓库"，只更新 `references/target-repos.md`，不在 `SKILL.md` 内硬编码。
- 每次执行前必须先读取 `references/target-repos.md` 与 `references/workflow-and-template.md`。
- 每次执行前必须先读取 `git-commit` 技能与 `commit-types.ts`，再生成 `commitMessage`。
- 在**阶段 2β（范围探索）**完成前，禁止直接进入脚本生成或子代理调度。必须先扫描目标仓库的文件结构，确认范围。
- 在**阶段 2γ（设计规格生成）**完成前，禁止生成 `batch-pr.ts`。脚本必须依据 spec.md 中定义的转换规则生成。
- **脚本自动化模式要求**：生成 `batch-pr.ts` 时必须参考 `references/batch-pr-script.ts`，确保脚本包含 `--dry-run` 支持、`--workdir` 参数、优雅错误处理、`execution-summary.md` 输出及清晰的执行日志。
- **脚本自动化模式要求**：产出物**必须**放在 `batch-pr-<YYYY-MM-DD>/` 强制工作目录中，不允许散落在项目根目录。
- **脚本自动化模式要求**：生成 `pr-config.json` 时，所有 `localPath` 必须是已验证存在的**绝对路径**，且必须使用正斜杠（`/`）而非反斜杠（`\`）。
- **脚本自动化模式要求**：生成 `commit-message.txt` 时**不允许包含 Emoji 字符**，保持纯文本格式以便 shell 命令直接引用。
- **脚本自动化模式要求**：如果阶段 2β 产出了 `transformations[]` 规则，必须生成 `pr-transform.json` 文件，不能仅依赖 `changes/` 整文件拷贝。转换规则优先于整文件拷贝执行。

## 维护规则

- **新增/移除仓库**：改 `references/target-repos.md`
- **调整执行规范或报告结构**：改 `references/workflow-and-template.md`
- **更新脚本模板或自动化执行规范**：改 `references/batch-pr-script.ts`
- **本文件仅保留入口与流程，不重复维护仓库明细**
