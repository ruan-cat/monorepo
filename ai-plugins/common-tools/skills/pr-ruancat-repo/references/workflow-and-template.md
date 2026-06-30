# 执行规范与输出模板

## A. 执行规范

### A1. 仓库复杂度评估与执行模式选择

在统一生成 PR 内容之前，先判断每个目标仓库的复杂度。复杂度评估会决定后续使用远程 API、本地 git，还是混合策略。

#### 主动获取本地仓库路径

开始执行前，先向用户索要已经克隆到本地的 GitHub 仓库路径，优先收集以下信息：

1. `owner/name` 与本地绝对路径的映射。
2. 本地仓库当前分支与远程地址。
3. 用户希望复用的本地工作区，或是否允许新建临时工作区。

如果用户无法提供本地路径，才降级为只使用远程 GitHub API/MCP 做仓库规模识别。降级时必须在汇总报告中说明“未使用本地路径”的原因。

#### 复杂度分级

| 复杂度 | 典型特征                                                          | 默认执行模式                                    |
| :----- | :---------------------------------------------------------------- | :---------------------------------------------- |
| low    | 单文件或少量文档/配置变更；无需安装依赖；无需跑构建               | `script-auto`（优先）或 `remote-api` / `hybrid` |
| medium | 多文件改动；需要本地搜索、格式化、简单测试或跨目录调整            | `script-auto`（条件满足时）或 `hybrid`          |
| high   | monorepo、多包、多语言、生成产物、复杂 CI、需要拆分提交或人工判断 | `local-git` 预检后再 `hybrid`                   |

#### 复杂度识别信号

优先从本地仓库读取：

- 仓库体量：文件数、包管理器、workspace 配置、构建配置。
- 变更范围：是否跨多个包、多个应用、多个文档站。
- 验证成本：是否需要 `install`、`test`、`typecheck`、`build`、文档构建。
- 分支状态：目标分支是否存在、来源分支是否已存在、是否有未合并 PR。
- 权限风险：是否能 push 分支、是否有保护分支或 required checks。

本地路径缺失时，从 GitHub API/MCP 获取仓库元数据、默认分支、分支列表、开放 PR、最近提交与文件树摘要，给出保守复杂度结论。

### A2. PR 执行策略

#### 默认推荐：本地 Bash 循环 + GitHub API/MCP 混合模式

批量跨仓库 PR 的最高效默认模式是混合执行：

1. 本地 Bash 循环负责：
   - 遍历本地仓库路径。
   - 检查远程地址与目标仓库是否匹配。
   - 拉取目标分支并创建统一来源分支。
   - 执行文件修改、格式化、最小验证。
   - 使用统一 `commitMessage` 提交并 push 来源分支。
2. GitHub API/MCP 负责：
   - 查询是否已有同源分支到同目标分支的开放 PR。
   - 创建 PR 或复用现有 PR。
   - 读取 PR URL、状态、目标分支、检查结果。
   - 汇总成功、失败、跳过与清理状态。

这个模式避免每个仓库都由远程 API 逐文件读写，也避免只靠本地命令遗漏远程 PR 状态。

#### 执行模式选择

| 模式          | 何时使用                                                     | 关键约束                                                         |
| :------------ | :----------------------------------------------------------- | :--------------------------------------------------------------- |
| `script-auto` | **v0.5.0 新增**。所有仓库有本地路径、变更统一、`gh` CLI 可用 | 不适合 high 复杂度或仓库间差异大的场景；生成脚本后用户需自行执行 |
| `remote-api`  | 只需读取远程信息、创建 PR、改极少量简单文件，且无需本地验证  | 不适合复杂文件修改或需要运行项目脚本的场景                       |
| `local-git`   | 高复杂度仓库需要先在本地完成检查、修改、验证、提交           | 仍需通过 GitHub API/MCP 汇总 PR 状态                             |
| `hybrid`      | 默认模式；本地负责改动和 push，远程 API/MCP 负责 PR 编排     | 批量跨仓库 PR 首选                                               |

#### 混合模式最小流程

1. 为每个仓库确认 `repo`、`localPath`、`targetBranch`、`sourceBranch`。
2. 本地确认工作树状态，避免覆盖用户未提交改动。
3. 从目标分支更新本地基线。
4. 创建或重置本次来源分支，执行统一修改。
5. 运行与变更风险匹配的最小验证。
6. 使用统一 `commitMessage` 提交。
7. push 来源分支。
8. 用 GitHub API/MCP 查询或创建 PR。
9. 记录 PR URL、执行模式、验证结果与失败原因。

#### 脚本自动化模式流程（`script-auto`）

当 `SKILL.md`「脚本自动化模式」的适用条件全部满足时采用此模式，AI 生成产物后由用户本地执行，AI 不再参与中间执行过程。

**AI 端（阶段 3a）**：

1. 生成 `pr-config.json`——包含 repo 列表、本地路径、来源分支、PR 标题。
2. 生成 `pr-body.md`——统一 PR 正文，聚焦"做了什么 + 为什么做 + 如何验证"。
3. 生成 `commit-message.txt`——纯文本 commit 信息，**不带 Emoji**，与阶段 2 冻结的 `commitMessage` 语义一致。
4. 生成 `pr-transform.json`——从 `scopeAnalysis.transformations[]` 写入转换规则。
5. 生成 `batch-pr.ts`——自包含的 TypeScript 脚本，参考 `references/batch-pr-script.ts`。
6. 生成 `spec.md`——完整设计规格，便于用户审阅。
7. 生成 `README.md`——使用说明与执行指引，降低用户执行门槛。
8. （可选）生成 `changes/` 目录下的待修改文件。
9. 对 `batch-pr.ts` 做语法快速检查（`npx tsc --noEmit --module ES2022 batch-pr.ts`）。

**用户端（阶段 3b）**：

1. `cd <产物目录>`
2. `npx tsx batch-pr.ts --dry-run`（预览）
3. `npx tsx batch-pr.ts`（实际执行）
4. 脚本自动输出 `execution-summary.md`

**AI 端（阶段 3c）**：

1. 读取 `execution-summary.md`。
2. 进入阶段 4 结果汇总。

**脚本应内建的行为**：

- 若 `gh auth status` 失败：立即终止并提示用户认证。
- 若仓库本地路径不存在：跳过该仓库并记录原因。
- 若工作树不干净：跳过并提示用户先提交/stash。
- 若目标分支不存在：跳过并记录失败。
- 若已存在同源分支开放 PR：跳过并复用现有 URL。
- 若 push 被拒绝：记录错误原因，继续处理后续仓库。
- 最终汇总所有仓库状态到 `execution-summary.md`。

### A3. 协调者阶段（统一内容）

每次任务先统一生成以下 4 项，再分发到各仓库 Agent：

1. `prTitle`：PR 标题
2. `prBody`：PR 正文（Markdown）
3. `commitMessage`：commit 信息（遵循 git-commit 规范）
4. `sourceBranch`：来源分支名（所有仓库一致）

执行清单（协调者）：

- [ ] 先读取 `git-commit` 技能文档
- [ ] 先读取 `commit-types.ts`（确认 emoji/type）
- [ ] 先生成 `commitMessage`，再派生 `prTitle`
- [ ] 生成 `prBody`（覆盖改动内容、原因、验证方式）
- [ ] 冻结统一内容，不允许子 Agent 私自改写

### A4. 子 Agent 阶段（单仓库）

对每个仓库执行：

1. 校验仓库可访问（本地路径存在、远程仓库存在且有权限）
2. 标记复杂度（`low` / `medium` / `high`）
3. 选择执行模式（`remote-api` / `local-git` / `hybrid`）
4. 决策目标分支（`dev > main > master`）
5. 按执行模式完成修改、提交、push 与 PR 创建
6. 返回结果（成功/失败 + URL/错误原因）

### A5. 分支合并与清理策略

合并策略优先保持线性提交历史：

1. GitHub PR 页面优先使用 rebase merge。
2. 本地合并优先使用 `git merge --ff-only`。
3. 不主动使用会产生额外 merge commit 的合并方式，除非用户明确要求。
4. 如果目标仓库保护规则不允许 rebase 或 fast-forward，记录原因并交给用户确认。

PR 合并完成后，及时清理分支：

1. 删除远程来源分支，例如 `origin/<sourceBranch>`。
2. 删除本地来源分支。
3. 回到目标分支并拉取最新状态。
4. 在汇总报告中记录远程分支与本地分支的清理状态。

### A6. 故障处理

- 某仓库失败：记录失败原因，继续下一个仓库
- 所有仓库结束后统一汇总，不因单点失败中断整体流程
- 本地路径不可用：降级为远程识别，或标记为需要用户补充路径
- 工作树不干净：不得覆盖用户改动，标记失败并说明阻塞文件
- 已存在开放 PR：复用现有 PR 链接，不重复创建
- 分支无法清理：记录失败原因，不隐瞒残留分支

### A7. 范围探索工作流

在阶段 2β 执行，用于替代"靠经验猜测"的粗放评估，产出精确的文件级别数据。

#### 探索范围的决定因素

| 任务类型 | 目标目录 | 匹配模式 |
|:---------|:---------|:---------|
| 配置文件变更 | `.github/workflows/`、`*.config.*` | `node-version`、`name:` |
| 依赖版本升级 | `package.json` | `"dependencies"`、`"devDependencies"` |
| 文档模板统一 | `*.md`、`docs/` | 关键字匹配 |
| 环境变量调整 | `.env*`、`*.yaml` | `VITE_*`、`API_*` |

#### 探索步骤（每仓库）

1. **验证本地路径** → 不存在则排除
2. **扫描目标目录** → 使用 glob 匹配 `targetGlob`
3. **grep 搜索** → 查找 `search` 模式，记录匹配行号
4. **归类** → 将匹配结果按文件分组，统计总数
5. **识别特殊模式** → 比较不同仓库的匹配结果差异，标记需要特殊处理的仓库
6. **输出** → 更新 `scopeAnalysis` 数据结构

#### 探索产出物格式

见 SKILL.md「阶段 2β」节的 `scopeAnalysis` JSON 契约。

### A8. 设计规格生成规范

在阶段 2γ 执行，将探索结果转化为可审阅、可追溯的设计文档。

#### spec.md 生成原则

1. **事实驱动**：所有数据从 `scopeAnalysis` 派生，不得凭空编造文件数量和路径。
2. **用户可审阅**：spec.md 是用户确认的内容——用户看了觉得没问题，AI 才往下做。
3. **可追溯**：spec.md 中的每条替换策略必须关联到对应的 `transformations[]` 规则。
4. **验收绑定**：验收标准与 `transformations[]` 规则一一对应，一条规则对应一个验收项。

#### 转换规则设计指南

`transformations[]` 是连接「设计」和「执行」的核心数据。设计时应遵循：

1. **一条规则一个原子操作**：不要将多个语义不同的替换写进一条规则。
2. **search 正则要精确**：避免过于宽泛的匹配导致误改。使用明确的边界如 `node-version:\s*\S+` 而非 `node.*24`。
3. **replace 保持上下文**：只替换目标值，不改变周围结构。
4. **glob 范围越小越好**：优先匹配具体文件模式而非 `**/*`。

### A10. 临时工作目录规范与 per-repo 差异化

脚本自动化模式使用 `batch-pr-<YYYY-MM-DD>/` 作为强制工作目录，所有产物全部写入此目录。

#### 目录结构

```
batch-pr-<YYYY-MM-DD>/
├── batch-pr.ts                # 定制化可执行脚本
├── pr-config.json             # 仓库清单
├── pr-body.md                 # PR 正文（默认）
├── commit-message.txt         # commit 信息（默认）
├── pr-transform.json          # 转换规则（可选）
├── spec.md                    # 设计规格（仅审阅）
├── README.md                  # 使用说明与执行指引
├── execution-summary.md       # 脚本执行后生成
├── merge-summary.md           # merge 模式执行后生成
├── changes/
│   ├── ruan-cat__notes/       # per-repo 差异化文件
│   └── ruan-cat__monorepo/    # per-repo 差异化文件
├── commit-message--ruan-cat__notes.txt  # per-repo commit 覆盖
└── pr-body--ruan-cat__notes.md          # per-repo PR 正文覆盖
```

#### per-repo 差异化文件命名规则

| 文件模式 | 用途 | 优先级 |
|:---------|:-----|:-------|
| `commit-message.txt` | 全部仓库统一的 commit | 低（fallback） |
| `commit-message--<repo_safe>.txt` | 特定仓库的 commit | 高 |
| `pr-body.md` | 全部仓库统一的 PR 正文 | 低（fallback） |
| `pr-body--<repo_safe>.md` | 特定仓库的 PR 正文 | 高 |
| `changes/<repo_safe>/` | 特定仓库的文件变更 | 高 |
| `changes/`（旧格式） | 全部仓库共享的文件变更 | 低（fallback） |

其中 `<repo_safe>` 为 repo 标识中的 `/` 替换为 `__`，例如 `ruan-cat/notes` → `ruan-cat__notes`。

#### 脚本执行顺序

1. 解析 `--workdir` 参数（默认脚本自身所在目录 `import.meta.url`）
2. 读取 `pr-config.json` 获得仓库清单
3. 对每个仓库：切回目标分支 → 清理任务相关残留改动（仅当未提交文件全部被转换规则覆盖时）→ 检查工作树 → resolve commit message（per-repo 优先）→ resolve PR body（per-repo 优先）→ 执行 inline 转换 → resolve changes 目录应用 → git commit/push → gh pr create
4. 写入 `execution-summary.md` 到工作目录

#### 工作目录生命周期

| 阶段 | 操作 | 说明 |
|:-----|:-----|:------|
| 阶段 3a | AI 创建 `batch-pr-<date>/` 并写入所有文件 | 目录名不可省略 |
| 阶段 3b | 用户在该目录下执行脚本 | `cd batch-pr-<date>/ && npx tsx batch-pr.ts` |
| 阶段 3c | AI 读取 `execution-summary.md` | 用户确认后可删除整个目录 |
| 归档 | `execution-summary.md` 建议留存 | 便于追溯历史

### A9. `pr-transform.json` 执行规范

当脚本自动化模式运行时，`pr-transform.json` 的转换规则按以下顺序执行：

1. 对每个仓库，扫描匹配 `glob` 模式的文件。
2. 对每个匹配文件，执行 `search` → `replace` 操作。
3. 所有转换规则按数组顺序串行执行（后一条在前一条产物上操作）。
4. 转换完成后，若存在 `changes/` 目录的整文件，再应用整文件拷贝。
5. 执行完毕后对所有被修改文件做日志记录（显示原始行 vs 新行摘要）。

#### 任务残留清理

若上次执行失败后工作树中残留了未提交改动，且这些改动全部被 `transformations[]` 规则匹配的文件覆盖，脚本可安全执行 `git reset --hard HEAD` 清理后重跑。否则应跳过该仓库并提示用户手动处理，避免覆盖真实未提交工作。

## B. 输出模板

````markdown
## 批量 PR 汇总报告

### 统一内容

- **PR 标题**: {{prTitle}}
- **来源分支**: {{sourceBranch}}
- **默认执行模式**: {{defaultExecutionMode}}
- **commit**:

```txt
{{commitMessage}}
```

### 策略摘要

- **本地路径覆盖率**: {{localPathCoverage}}
- **复杂度分布**: low {{lowCount}} / medium {{mediumCount}} / high {{highCount}}
- **PR 策略**: {{strategySummary}}
- **合并策略**: 优先 rebase / fast-forward，保持线性历史

### 仓库执行结果

| 仓库                | 本地路径 | 复杂度 | 执行模式   | 目标分支 | PR 链接 | 状态 | 说明                       |
| :------------------ | :------- | :----- | :--------- | :------- | :------ | :--: | :------------------------- |
| `ruan-cat/notes`    | 有       | low    | hybrid     | `dev`    | <url>   |  ✅  | 创建成功                   |
| `ruan-cat/monorepo` | 无       | high   | remote-api | `main`   | -       |  ❌  | 缺少本地路径，需补充后重试 |

### 分支清理结果

| 仓库             | 远程来源分支 | 本地来源分支 | 状态 | 说明              |
| :--------------- | :----------- | :----------- | :--: | :---------------- |
| `ruan-cat/notes` | 已删除       | 已删除       |  ✅  | PR 已 rebase 合并 |
````

### 脚本自动化模式输出模板（`execution-summary.md`）

由 `batch-pr.ts` 自动生成的汇总报告模板：

````markdown
# 批量 PR 执行汇总报告

> **执行模式**: 脚本自动化（batch-pr.ts）
> **执行时间**: {{executionTime}}

## 统一内容

- **PR 标题**: {{prTitle}}
- **来源分支**: {{sourceBranch}}
- **commit**:
  ```txt
  {{commitMessage}}
  ```

## 执行结果

- ✅ 成功: {{successCount}}
- ⏭ 跳过: {{skippedCount}}
- ❌ 失败: {{failedCount}}

| 仓库                |    状态    | 目标分支 | PR 链接 | 说明         |
| :------------------ | :--------: | :------- | :------ | :----------- |
| `ruan-cat/notes`    | ✅ success | `dev`    | <url>   | —            |
| `ruan-cat/monorepo` | ⏭ skipped | `main`   | <url>   | 已有开放 PR  |
| `ruan-cat/resume`   | ❌ failed  | `master` | —       | 工作树不干净 |
````

## C. commit 生成约束

1. 必须先读取 `git-commit` 技能规范。
2. Emoji 与 type 以 `commit-types.ts` 为准。
3. 破坏性变更必须使用 `type(scope)!:` + `BREAKING CHANGE:`。
4. 提交信息必须使用中文。
5. 标准格式：
   - 普通变更：`<emoji> type(scope): summary`
   - 破坏性变更：`<emoji> type(scope)!: summary`
6. `prTitle`、`prBody` 与 `commitMessage` 必须语义一致，不得相互冲突。
7. 批量任务仅允许一份统一 `commitMessage`，所有仓库复用同一文案。
8. **脚本自动化模式专属约束**：写入 `commit-message.txt` 的文本**必须去除 Emoji 字符**，仅保留纯文本格式（例如 `feat(config): update vitepress base path`），以便 shell 命令 `git commit -m "$(cat commit-message.txt)"` 能正确引用。
