---
name: git-commit
description: "创建高质量的 git 提交：审查/暂存预期的变更，拆分为逻辑提交，并编写清晰的提交信息（遵循 Conventional Commits 规范，支持 Emoji）。当用户要求提交代码、编写提交信息、暂存变更或将工作拆分为多个提交时使用此技能。当用户提及【破坏性变更】关键词时，必须按照本技能的 BREAKING CHANGE 规范使用感叹号格式编写提交信息。优先针对 git 暂存区（staged）中的文件进行提交，只有当暂存区为空时才考虑整个工作树。当用户提及【分门别类】关键词时，必须按照本技能的多提交拆分规范，从文件类型、业务模块、修改类型、修改范围四个维度认真拆分多个提交。"
user-invocable: true
metadata:
  version: "0.3.5"
---

# Git Commit

## 来源说明

该技能本质上是参考 [agent-toolkit/skills/commit-work](https://github.com/softaworks/agent-toolkit/blob/main/skills/commit-work/SKILL.md) 文档的纯中文翻译版本，并进行了特定改写以适应当前环境。

## 目标

制作易于审查且安全发布的提交：

- 仅包含预期的变更
- 提交具有逻辑范围（必要时进行拆分）
- 提交信息描述了变更内容和原因

## 需要询问的输入（如果缺失）

- **单个提交还是多个提交？**（如果不确定：当存在不相关的变更时，默认为多个小提交。）
- **提交风格**：必须使用 Conventional Commits，并包含 Emoji。
- **任何规则**：最大标题长度，必需的作用域。

## 规则来源优先级 [CRITICAL]

生成提交信息时，按以下优先级决策，低优先级不得覆盖高优先级：

1. 用户在当前对话中的明确要求
2. 当前仓库本地 commit / commitlint 规则（如 `commitlint.config.*`、`.commitlintrc*`、`package.json` 中的 `commitlint` 字段、`commit-msg` hook）
3. 远程 raw `commit-types.ts` 中的 `type -> emoji` 定义
4. 技能默认模板、示例与 `references/commit-message-template.md`

- 若多个来源冲突，必须以更高优先级来源为准。
- 若更高优先级来源缺失、读取失败或含糊不清，必须停下说明，不得猜测。
- `references/commit-message-template.md` 只可作为写作模板，不可作为 emoji/type 的真实来源。

## 工作流程（清单）

1. **检查暂存区与工作树状态（优先暂存区）**
   - `git status`
   - **首先检查暂存区是否有内容**：`git diff --cached --stat`
     - ✅ **暂存区有文件**：本次提交只针对暂存区，不要自行 `git add` 额外文件。直接跳到步骤 4 审查暂存内容。
     - 📭 **暂存区为空**：才需要从工作树中选取文件进行暂存，继续步骤 2-3。
   - 如果需要查看工作树的变更：`git diff` 或 `git diff --stat`
2. **决定提交边界（必要时拆分）** [见「分门别类拆分规范」]
   - **先分析上下文**：认真阅读对话中用户描述的改动内容，理解本次修改的业务意图。
   - **四维拆分依据**：
     1. **文件类型**：配置文件 vs 源码 vs 文档 vs 测试文件
     2. **业务功能模块**：不同业务模块的改动独立提交（如 `auth` vs `payment`）
     3. **修改类型**：新增功能 vs 修复 Bug vs 重构 vs 格式化（不同 type 的改动分开）
     4. **修改范围**：前端 vs 后端，依赖升级 vs 行为变更，生产代码 vs 测试代码
   - 如果变更混合在一个文件中，计划使用补丁暂存 (`patch staging`)。
3. **仅暂存属于下一个提交的内容**（暂存区为空时才执行此步）
   - 对于混合变更首选补丁暂存：`git add -p`
   - 取消暂存块/文件：`git restore --staged -p` 或 `git restore --staged <path>`
4. **审查实际将要提交的内容**
   - `git diff --cached`
   - **合规性检查**：
     - 无密钥或令牌
     - 无意外的调试日志
     - 无不相关的格式化变动
5. **用 1-2 句话描述暂存的变更（在编写信息之前）**
   - "变更了什么？" + "为什么？"
   - 如果你无法清晰地描述它，那么提交可能太大或混合了；返回第 2 步。
6. **编写提交信息**
   - **必须**使用中文编写提交信息。
   - 使用 **Conventional Commits**（必需）：
     - 普通提交：`<emoji> type(scope): summary`
     - 破坏性变更：`<emoji> type(scope)!: summary`（感叹号紧跟在 `)` 之后，冒号之前）
     - (空行)
     - body (内容/原因，而非实现流水账)
     - footer：破坏性变更时必须包含 `BREAKING CHANGE: <说明>` 行
   - **Emoji 和 Type 规范**：必须查阅并遵循远程 raw `commit-types.ts` 中的定义：
     - `https://raw.githubusercontent.com/ruan-cat/monorepo/dev/configs-package/commitlint-config/src/commit-types.ts`
     - 必须读取 raw 全文后，再定位本次要使用的 `type`。
     - 禁止仅依据搜索摘要、snippet、单行预览、缓存摘要或 reference 表格判断 emoji。
     - 在继续之前，必须显式复述本次解析结果：`selected type`、`resolved emoji`、命中的原始片段。
     - 如果 raw 文件抓取失败、内容不完整、或无法可靠定位目标 `type`，必须停止提交流程，不得猜测，不得回退到旧表格。
   - **推荐使用文件方式**（避免 shell 参数传递导致的编码与转义问题）：
     - 对于包含中文的 commit message，默认使用 `git commit -F commit-message.txt`
     - 创建临时提交信息文件（如 `commit-message.txt`），写入提交信息内容
     - **注意**：此步骤只创建文件，**暂不执行提交**
   - 参考 `references/commit-message-template.md` 获取模板格式与 BREAKING CHANGE 示例，不要把其中内容当作 emoji/type 真值。

7. **提交信息预校验 [CRITICAL]**
   - 优先检查当前仓库是否存在本地 commit 规则：`commitlint.config.*`、`.commitlintrc*`、`package.json` 的 `commitlint` 字段、`commit-msg` hook。
   - 如果仓库存在本地 commitlint 配置或可执行 `commitlint`，必须先对 `commit-message.txt` 做预校验，再允许进入 `git commit`。
   - 推荐命令：`pnpm exec commitlint --edit commit-message.txt --strict`；若仓库使用 `npx --no-install commitlint`，按仓库现有 hook / 脚本保持一致。
   - 任何 warning、error 或 rule violation 都视为阻塞，必须先修正文案，再继续。
   - 若仓库要求 scope，必须使用合法 scope；若无法确定合法 scope，停止并说明原因。
   - 若仓库未要求 scope，优先省略 scope，而不是臆造 scope。

8. **运行最小的相关验证**
   - 按下方「最小有效校验矩阵」选择本次提交前的默认最小校验。
   - 验证通过后再执行步骤 9 进行提交。
   - 如果验证失败，修复问题后重新执行验证。
   - 如果仓库确实不存在任何有意义的自动校验，必须在最终说明中明确“未运行校验，原因是仓库无可用脚本/规则”。

9. **获取 Co-authored-by 信息并执行提交**
   - **获取 AI 客户端型号**：从当前对话的 system prompt 或初始化信息中查找：
     - "You are Claude Code" → 客户端 = "Claude Code"
     - "You are Cursor" → 客户端 = "Cursor"
     - "You are Gemini CLI" → 客户端 = "Gemini CLI"
     - 其他 AI IDE / CLI 同理
   - **获取 AI 模型型号**：从当前对话的 model 信息中查找：
     - "MiniMax-M2.5-highspeed" → 模型 = "MiniMax-M2.5"
     - "claude-opus-4-6" → 模型 = "Claude Opus 4.6"
     - "claude-sonnet-4-6" → 模型 = "Claude Sonnet 4.6"
     - 其他模型同理
   - **逐项判定**：客户端与模型必须分别判断是否在下方 allowlist 中，不得把“客户端可验证”自动扩展为“模型也可验证”。
   - 仅允许以下四种结果：
     1. 仅客户端可验证 → 只追加客户端 trailer
     2. 仅模型可验证 → 只追加模型 trailer
     3. 二者都可验证 → 追加两条 trailer
     4. 二者都不可验证或无法识别 → 不追加任何 trailer
   - 如果当前会话无法可靠得到模型标识，必须视为“模型不可验证”，不得猜测。
   - 当前非 allowlist 客户端（如 Codex、Gemini CLI 等）默认不写 Co-authored-by，除非下方对照表后续明确补充。
   - **使用 `--trailer` 参数追加**：执行 `git commit -F commit-message.txt` 时，仅为已验证身份追加对应的 `--trailer`；一条身份对应一条 `--trailer`。
   - **提交成功后删除临时文件**：
     - PowerShell：`Remove-Item -LiteralPath commit-message.txt`
     - POSIX Shell：`rm -- commit-message.txt`
   - **复核提交结果**：
     - `git log -1 --format=%B`
     - `git status --short --branch`
     - 若 commit 过程中出现 warning、hook 改写了文件、或最终提交信息与预期不一致，不能直接宣称完成，必须先修正。

10. **重复下一个提交，直到工作树干净**

## 平台命令参考

### PowerShell

- 读取远程 raw 文件：`(Invoke-WebRequest -UseBasicParsing '<raw-url>').Content`
- 预校验提交信息：`pnpm exec commitlint --edit commit-message.txt --strict`
- 删除临时文件：`Remove-Item -LiteralPath commit-message.txt`

### POSIX Shell

- 读取远程 raw 文件：`curl -fsSL '<raw-url>'`
- 预校验提交信息：`pnpm exec commitlint --edit commit-message.txt --strict`
- 删除临时文件：`rm -- commit-message.txt`

## 最小有效校验矩阵 [CRITICAL]

| 变更类型           | 默认最小校验                                             |
| :----------------- | :------------------------------------------------------- |
| 仅 Markdown / 文档 | Markdown 格式化或与文档渲染链路相关的最小构建            |
| 仅配置             | 对应 lint / config check / 最小 build                    |
| 源码               | 对应模块的 test / typecheck / build 中最快且有意义的一项 |
| 混合改动           | 选择覆盖主要风险面的最小组合校验                         |

## 优先处理暂存区 [CRITICAL]

**在开始任何提交流程之前，首先检查 git 暂存区（staging area / index）是否已有文件。**

这是基于尊重用户意图的原则：如果用户已经手动 `git add` 了某些文件，说明他们明确知道要提交什么，此时不应画蛇添足地扩大提交范围。

| 暂存区状态     | 处理方式                                                    |
| :------------- | :---------------------------------------------------------- |
| **有暂存文件** | 直接对暂存区内容进行提交，**不自行 `git add` 任何额外文件** |
| **暂存区为空** | 从工作树分析所有变更，按拆分规范选取文件并暂存后再提交      |

**检查命令**：

```bash
# 检查暂存区是否有内容
git diff --cached --stat

# 有输出 → 暂存区有文件，直接进入审查流程
# 无输出 → 暂存区为空，需要从工作树选取文件
```

## 分门别类拆分提交规范 [CRITICAL]

当用户提及**「分门别类」**，或工作树中存在较多文件变更时，**必须**认真分析上下文，将变更拆分为若干个逻辑独立的小提交，而不是粗暴地一次性 `git add .` 全量提交。

### 为什么要拆分

- 每个提交都有清晰的单一职责，方便 code review 和问题追溯
- 出现问题时可以精准 `git revert` 单个提交而不影响其他变更
- 符合 Conventional Commits 语义：一个 `type` 对应一类变更

### 四个拆分维度

在分析本次变更时，请从以下四个维度逐一评估，发现可拆分点就独立成一个提交：

#### 1. 按文件类型拆分

不同类型的文件通常对应不同关注点：

- 配置文件（`*.json`, `*.yaml`, `*.toml`, `nitro.config.ts` 等）→ `config` 类型
- 文档文件（`*.md`, `CHANGELOG`, `README`）→ `docs` 类型
- 测试文件（`*.test.ts`, `*.spec.ts`）→ `test` 类型
- 依赖文件（`package.json`, `pnpm-lock.yaml`）→ `deps` 类型
- 核心源码文件 → `feat` / `fix` / `refactor` 类型

#### 2. 按业务功能模块拆分

不同业务模块的改动应独立提交，即使它们都是同一类型（如 `feat`）：

- `feat(auth): ...` 和 `feat(payment): ...` 应分开
- `fix(users): ...` 和 `fix(orders): ...` 应分开

#### 3. 按修改类型拆分

不同 `type` 的变更必须分开提交，不能混在一起：

- 新增功能（`feat`）和修复 Bug（`fix`）→ 分开
- 功能代码（`feat`/`fix`）和格式化（`style`）→ 分开
- 业务逻辑和重构（`refactor`）→ 分开

#### 4. 按修改范围拆分

- 前端代码 vs 后端代码
- 生产代码 vs 测试代码
- 应用代码 vs 基础设施/工具链代码

### 拆分决策流程

```plain
分析变更文件列表
    ↓
有没有不同 type 的混合变更？ → 是 → 按类型拆分
    ↓ 否
有没有跨越多个业务模块的变更？ → 是 → 按模块拆分
    ↓ 否
有没有配置/文档/测试等文件混在一起？ → 是 → 按文件类型拆分
    ↓ 否
变更范围是否横跨前后端或基础设施？ → 是 → 按范围拆分
    ↓ 否
所有变更都聚焦于同一职责 → 可以合并为一个提交
```

### 示例：工作树有 8 个文件的拆分方案

```plain
变更文件：
  M  src/api/users.ts          # 后端业务逻辑：新增用户查询
  M  src/api/orders.ts         # 后端业务逻辑：修复订单Bug
  M  src/components/UserList.vue # 前端组件
  M  nitro.config.ts            # 配置文件
  M  package.json               # 依赖升级
  M  pnpm-lock.yaml             # 依赖锁定文件
  M  tests/users.test.ts        # 测试文件
  M  CHANGELOG.md               # 文档

推荐拆分为 5 个提交：
  提交1: ✨ feat(users): 新增用户查询接口       ← src/api/users.ts
  提交2: 🐞 fix(orders): 修复订单数量计算错误   ← src/api/orders.ts
  提交3: ✨ feat(ui): 新增用户列表组件          ← src/components/UserList.vue
  提交4: 🧪 test(users): 补充用户查询单测       ← tests/users.test.ts
  提交5: 📦 deps: 升级依赖并更新配置            ← package.json + pnpm-lock.yaml + nitro.config.ts
  (CHANGELOG.md 通常随其他提交一起或单独 docs 提交)
```

## 破坏性变更规范 [CRITICAL]

当用户提及**「破坏性变更」**关键词，或本次变更确实存在不向下兼容的 API/行为改动时，**必须**按以下规范编写提交信息。

### 感叹号位置（唯一正确格式）

```text
<emoji> type(scope)!: summary
```

- `!` 紧跟在 `)` 之后，冒号 `:` 之前
- `!` 与 `)` 之间**不留空格**
- `!` 与 `:` 之间**不留空格**

### 错误示例 vs 正确示例

| 写法                                | 状态 | 问题说明                                   |
| :---------------------------------- | :--: | :----------------------------------------- |
| `🦄 refactor!(scope): summary`      |  ❌  | 感叹号在 type 之后、scope 之前，不符合规范 |
| `🦄 refactor(scope) !: summary`     |  ❌  | 感叹号与 `)` 之间有空格                    |
| `🦄 refactor(scope)! : summary`     |  ❌  | 感叹号与 `:` 之间有空格                    |
| `🦄 refactor(scope)!: summary`      |  ✅  | 正确——`!` 紧跟在 `)` 之后，无空格          |
| `🦄 refactor!: summary`（无 scope） |  ✅  | 无 scope 时 `!` 紧跟在 type 之后           |

### 完整破坏性变更提交模板

```text
<emoji> type(scope)!: 简短描述破坏性变更

BREAKING CHANGE: 详细说明破坏性变更的内容、原因，以及用户需要如何迁移。

- 变更点 1
- 变更点 2
```

### 示例

```text
🦄 refactor(nitro-api-development)!: 从 11comm 项目提取技能并重构为通用版本

BREAKING CHANGE: 删除了 reference.md 和 templates.md，替换为 references/ 和 templates/ 子目录结构。

- 移除 reference.md
- 移除 templates.md
- 新增 references/ 子目录（含 7 个专项文档）
- 新增 templates/ 子目录（含 2 个可复用 TypeScript 文件）
```

## Co-authored-by 邮箱对照表

注意：

- GitHub 识别 `Co-authored-by` 主要依赖邮箱是否能归属到 GitHub 账号。下面统一使用对应账号的 `users.noreply.github.com` 邮箱格式。
- 所有条目均已通过 GitHub API（`https://api.github.com/user/:id` + `/users/:login/orgs`）验证，确认账号归属可信。
- 客户端与模型必须分别匹配此表；任一项未命中时，仅跳过该项，不得连带臆造另一项。
- **若某工具或模型不在此表中，禁止编造或猜测账号，直接跳过 Co-authored-by。**

### 已验证的 Co-authored-by 账号

| 工具名称    | GitHub 账号 / 邮箱类型 | 关注者数 / 验证来源 | Co-authored-by 格式                                                       |
| :---------- | :--------------------- | :------------------ | :------------------------------------------------------------------------ |
| Cursor      | cursoragent            | 1,856               | `Co-authored-by: Cursor <199161495+cursoragent@users.noreply.github.com>` |
| Claude Code | 公司邮箱               | 官方文档            | `Co-authored-by: Claude <noreply@anthropic.com>`                          |

### 无官方账号（禁止使用）

以下工具/模型目前没有经验证的官方 GitHub bot 账号或公司邮箱，**禁止使用任何冒名抢注账号**：

- **AI CLI**：Codex CLI（属于 `openai` 组织）、Gemini CLI（属于 `google-gemini` 组织）均无专属 bot 账号
- **AI IDE**：VS Code、Trae、Codebuddy、Antigravity、Qoder、Kiro 均未确认官方 bot 账号
- **AI 模型**：OpenAI GPT 系列、Gemini 系列、MiniMax 系列、GLM 系列均无官方归属账号

> 待各厂商官方提供可验证的 bot 账号或公司邮箱后再补充到此表中。

### 已确认的假冒/冒名账号黑名单 [CRITICAL]

**以下账号均已通过 GitHub API 验证为非官方账号，严禁在 Co-authored-by 中使用。** 即使 AI 模型"记住"了这些账号，也绝对不能使用。

| 冒充目标    | 假冒账号                     | ID        | 判定为假冒的依据                                                                                                                                                           |
| :---------- | :--------------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code | `anthropics-claude`          | 237456255 | 不属于 `anthropics` 组织；仓库包含 Solana 加密货币诈骗项目（`clabs`）；仅 2 个关注者。**注意：Claude Code 有官方邮箱 `noreply@anthropic.com`，请使用该邮箱而非此假冒账号** |
| Gemini CLI  | `google-gemini-cli`          | 229672533 | 不属于 `google-gemini` 组织；仓库全部是 fork（无原创内容）；仅 5 个关注者                                                                                                  |
| Codex CLI   | `codex-cli`                  | 208188539 | 不属于 `openai` 组织；OpenAI 发布 Codex（2025-04-13）后 5 天抢注；0 个公开仓库、仅 2 个关注者                                                                              |
| VS Code     | `vscode-triage-bot`          | 62039782  | 这是 VS Code 仓库的 Issue 分流机器人，不代表 VS Code IDE 本体，用于 Co-authored-by 会产生语义误导                                                                          |
| GLM-5       | `zhipuch`                    | 178361551 | 普通个人用户，与智谱 AI / GLM 无任何关联                                                                                                                                   |
| Trae        | `Trae-AI-Admin`              | 192575406 | 不属于任何组织；0 个公开仓库；无法确认为 Trae 官方账号                                                                                                                     |
| Codebuddy   | `CodeBuddy-Official-Account` | 214620440 | 不属于任何组织；无法确认为 Codebuddy 官方账号                                                                                                                              |
| Antigravity | `antigravity-ai`             | 256725992 | 仅 1 个关注者；0 个公开仓库；2026-01-23 才创建；无法确认为官方账号                                                                                                         |
| Qoder       | `Qoder-AI`                   | 215799558 | 不属于任何组织；仅 8 个关注者；无法确认为官方账号                                                                                                                          |
| Kiro        | `kiro-ai`                    | 201607104 | 0 个关注者；0 个公开仓库；无法确认为官方账号                                                                                                                               |
| MiniMax     | `MiniMax-OpenPlatform`       | 239562665 | 不属于任何组织；无法确认为 MiniMax 官方账号                                                                                                                                |

> **为什么要维护黑名单？** AI 模型在生成 Co-authored-by 时，可能会从训练数据或互联网上"回忆"起这些账号并自动填入。明确列出黑名单可以防止这种行为，避免你的 GitHub 仓库贡献者列表中出现无关甚至恶意的第三方。

## 交付物

提供：

- 最终的提交信息（包含 Emoji，中文编写）
- 每个提交的简短摘要（内容/原因）
- 用于暂存/审查的命令（至少：`git diff --cached`，加上运行的任何测试）
