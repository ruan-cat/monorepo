---
name: git-commit
description: >-
  创建高质量的 git 提交：审查/暂存预期的变更，拆分为逻辑提交，并编写清晰的提交信息
  （遵循 Conventional Commits 规范，支持 Emoji）。当用户要求提交代码、编写提交信息、
  暂存变更或将工作拆分为多个提交时使用此技能。当用户提及【破坏性变更】关键词时，
  必须按照本技能的 BREAKING CHANGE 规范使用感叹号格式编写提交信息。
  优先针对 git 暂存区（staged）中的文件进行提交，只有当暂存区为空时才考虑整个工作树。
  当用户提及【分门别类】关键词时，必须按照本技能的多提交拆分规范，
  从文件类型、业务模块、修改类型、修改范围四个维度认真拆分多个提交。
user-invocable: true
metadata:
  version: "0.4.0"
---

# Git Commit

## 目标

仅包含预期的变更 → 逻辑拆分 → 信息描述变更内容和原因

## 规则来源优先级 [CRITICAL]

生成提交信息时，按以下优先级决策，低优先级不得覆盖高优先级：

1. 用户在当前对话中的明确要求
2. 当前仓库本地 commit / commitlint 规则（如 `commitlint.config.*`、`.commitlintrc*`、`package.json` 中的 `commitlint` 字段、`commit-msg` hook）
3. 远程 raw `commit-types.ts`（首选）+ 本地 `commit-types.ts`（fallback，详见步骤 6）
4. 技能默认模板、示例与 `references/commit-message-template.md`

- 若多个来源冲突，必须以更高优先级来源为准。
- 若更高优先级来源缺失或读取失败，必须停下说明，不得猜测。若来源内容完整但含义明确（如 commitlint 规则已定义 scope 列表等），直接按规则执行即可。

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
   - **检查通过后直接继续**：如果以上三项检查全部通过，**不要停下来询问用户"是否涉及敏感信息"**。直接继续到步骤 5。只有在检查发现可疑内容时才需要向用户确认。
5. **用 1-2 句话描述暂存的变更（在编写信息之前）**
   - "变更了什么？" + "为什么？"
   - 如果你无法清晰地描述它，那么提交可能太大或混合了；返回第 2 步。
6. **编写提交信息**
   - **语言选择（默认中文，按上下文切换）**：
     - **默认**使用中文编写提交信息。
     - **例外**：如果正在向一个使用英文的开源/上游仓库提交 PR（`git log` 中最近提交均为英文），则改用英文编写。判断依据：
       - 检查当前分支的上游目标仓库的提交语言风格（`git log --oneline` 最近的 5-10 条记录）
       - 如果上游/目标仓库全部使用英文 → 改用英文
       - 否则 → 保持中文（默认）
     - 无论中英文，summary 和 body 的语言必须保持一致。
   - 使用 **Conventional Commits**（必需）：
     - 普通提交：`<emoji> type(scope): summary`
     - 破坏性变更：`<emoji> type(scope)!: summary`（感叹号紧跟在 `)` 之后，冒号之前）
     - (空行)
     - body (内容/原因，而非实现流水账)
     - footer：破坏性变更时必须包含 `BREAKING CHANGE: <说明>` 行
   - **Emoji 和 Type 规范**：必须查阅并遵循 `commit-types.ts` 中的定义，按以下优先级获取：
     - **首选（远程 raw，确保最新）**：从 GitHub 远程获取最新定义：
       - `https://raw.githubusercontent.com/ruan-cat/monorepo/dev/configs-package/commitlint-config/src/commit-types.ts`
       - 远程文件是权威来源，优先使用以确保 type/emoji 映射是最新的。
     - **次选（技能自带的本地文件）**：若远程 raw 获取失败（网络不可用/超时/HTTP 错误），再回退到本技能目录下的 `references/commit-types.ts`
       - 读取该文件，解析 `commitTypes` 数组，定位本次要使用的 `type`。
       - 该文件是随技能一起分发的快照副本，版本可能落后于远程，但可确保离线可用。
     - **禁止仅依据搜索摘要或缓存判断 emoji**——必须读取完整文件后定位 type。在继续之前，显式复述本次解析结果：`selected type`、`resolved emoji`、命中的原始片段。
     - 若远程和本地都获取失败 → **停止**，报告"无法获取 commit-types.ts，无法确定合法 type 与 emoji"，不得猜测或回退到旧表格。
   - **推荐使用文件方式**（避免 shell 参数传递导致的编码与转义问题）：
     - 对于包含中文的 commit message，默认使用 `git commit -F commit-message.txt`
     - 创建临时提交信息文件（如 `commit-message.txt`），写入提交信息内容
     - ⚠️ **此步骤只创建提交信息文件，不要在此步骤执行 `git commit`**。真正的提交执行将在步骤 9 进行。
   - **不要在步骤 6 就停下来向用户展示提交信息文本后结束流程**——继续执行步骤 7→8→9 完成整个提交流程。
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
   - **必须输出检测日志**（无论结果如何）：
     - 格式：`→ Co-authored-by 检测: 客户端="{客户端名}" → {在/不在} allowlist; 模型="{模型名}" → {在/不在} allowlist; 结论="{结论}"`
     - 例如：`→ Co-authored-by 检测: 客户端="WorkBuddy" → 不在 allowlist; 模型="Deepseek-V4-Flash" → 不在 allowlist; 结论="不追加任何 trailer"`
     - 这样做是为了让用户明确知道检测过程，而非"Co-authored-by 神秘消失"。
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
   - **🛑 不要推送**：执行完提交后，**不要执行 `git push`**。推送操作由用户自行决定并执行。

10. **重复下一个提交，直到工作树干净**

## 最小有效校验矩阵 [CRITICAL]

| 变更类型           | 默认最小校验                                             |
| :----------------- | :------------------------------------------------------- |
| 仅 Markdown / 文档 | Markdown 格式化或与文档渲染链路相关的最小构建            |
| 仅配置             | 对应 lint / config check / 最小 build                    |
| 源码               | 对应模块的 test / typecheck / build 中最快且有意义的一项 |
| 混合改动           | 选择覆盖主要风险面的最小组合校验                         |



## 分门别类拆分提交规范 [CRITICAL]

当工作树中存在较多文件变更时，**必须**将变更拆分为独立小提交，而非全量提交。按以下决策流程执行：

```plain
分析变更文件列表
    ↓
有没有不同 type 的混合变更？ → 是 → 按 type 拆分
    ↓ 否
有没有跨越多个业务模块的变更？ → 是 → 按模块拆分
    ↓ 否
有没有配置/文档/测试等文件混在一起？ → 是 → 按文件类型拆分
    ↓ 否
变更范围是否横跨前后端或基础设施？ → 是 → 按范围拆分
    ↓ 否
所有变更都聚焦于同一职责 → 合并为一个提交
```

**type与文件类型映射参考**：配置文件→`config`，文档→`docs`，测试→`test`，依赖→`deps`，核心源码→`feat`/`fix`/`refactor`

> 详细拆分示例（含 8 文件拆分方案）参见 `references/commit-splitting-example.md`。

## 破坏性变更规范 [CRITICAL]

当用户提及**「破坏性变更」**关键词，或本次变更确实存在不向下兼容的 API/行为改动时，**必须**按以下规范编写提交信息。

### 主动评估准则（每次提交前执行）

**不要只等用户说"破坏性变更"才行动。** 在完成步骤 5 后（描述变更内容后），主动对照以下清单判断本次变更是否属于破坏性：

| 判断维度 | 属于破坏性变更的情况 | 不属于破坏性变更的情况 |
|:---------|:-------------------|:---------------------|
| **API 签名变更** | 函数参数数量/顺序/类型变化、删除导出的函数或类、重命名公共 API | 新增仅额外可选参数的 API、内部私有函数改名 |
| **配置格式变更** | 修改配置文件的字段名/类型/结构、删除已有配置项 | 新增配置项（默认值兼容旧行为）、仅调整注释 |
| **行为语义变更** | 修改已有功能的预期行为、删除功能、改变错误处理策略 | 新增功能（不影响已有行为）、修复 Bug（恢复预期行为） |
| **依赖升级** | 框架/运行时大版本升级（如 Vue 2→3、Node 16→20）、peerDependencies 范围收窄 | 补丁版本升级、开发依赖升级 |
| **数据结构变更** | 修改数据库 schema、修改 API 响应格式、修改缓存键结构 | 新增字段（客户端可忽略）、仅增加索引 |
| **删除/重命名文件** | 删除或重命名被其他模块引用的文件、删除导出的符号 | 删除未使用的文件、内部重组不影响外部 |

**决策规则**：只要以上任意一维度命中"属于破坏性变更"，就必须使用 `!` 格式。

**如果不确定**：偏向保守——标记为破坏性变更，并在 `BREAKING CHANGE:` 正文中说明"可能的影响范围"。

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
🦄 refactor(api)!: 重构用户查询接口

BREAKING CHANGE: 函数签名从 `getUser(id)` 改为 `getUser({ id, includeDeleted? })`，需更新所有调用方。
```

## 提交类型（commit type）选择指南

> 本仓库在 `references/commit-types.ts`（随技能分发的快照）中定义了 18 个提交类型。
> 远程 GitHub raw 文件是权威来源，本地 `references/commit-types.ts` 作为离线 fallback。

### 核心类型（高频使用）

| type | emoji | 适用场景 | 注意 |
|:-----|:------|:---------|:-----|
| `feat` | ✨ | 新增功能、新特性、新组件 | 有 `semver: minor`，CLI 用户可见的新能力 |
| `fix` | 🐞 | 修复 Bug、修正异常行为 | 恢复预期行为，非新增功能 |
| `refactor` | 🦄 | 代码重构——重写/重命名/拆分代码但**不改变外部行为** | 如果改变了行为 → 用 `feat` 或 `fix` |
| `docs` | 📃 | 仅文档变更（README、JSDoc、注释、CHANGELOG） | 不包括源码注释——源码注释用 `chore` |
| `test` | 🧪 | 新增/修改测试用例、测试配置 | 不包括测试工具链的升级 |
| `style` | 🌈 | 代码格式化（缩进、分号、引号）、Lint 修复 | 不包括 CSS/UI 样式变更——那是 `feat` |

### 辅助类型（中频使用）

| type | emoji | 适用场景 | 注意 |
|:-----|:------|:---------|:-----|
| `config` | 🔧 | 配置文件新增/修改 | 仅限配置本身，不包括配置变更引起的代码改动 |
| `build` | 🔨 | 构建系统变更（构建工具、打包配置、tsconfig） | 与 `config` 的边界：`build` 只用于"影响构建产物"的配置变更 |
| `deps` | 📦 | 依赖包的新增/升级/移除 | 当依赖变更伴随代码调整时，代码部分另开提交 |
| `chore` | 🐳 | **不属于以上任何类别的杂项**——如 `.gitignore`、`.editorconfig`、源码注释清理 | **兜底 type**——只有其他 type 都不匹配时才用 |
| `ci` | 🐎 | CI/CD 配置文件变更（GitHub Actions、CI 脚本） | 不影响生产代码 |
| `perf` | 🎈 | 性能优化 | 如果优化时重构了代码 → 用 `refactor`；优化且改变行为 → 用 `feat` |
| `i18n` | 🌐 | 国际化翻译文本的新增/修改 | 不包括国际化基础设施——那算 `feat` 或 `config` |

### 特殊类型（低频使用）

| type | emoji | 适用场景 | 注意 |
|:-----|:------|:---------|:-----|
| `revert` | 🔙 | 仅用于 `git revert` 生成的提交 | 不要手动编写此 type，让 `git revert` 自动生成 |
| `delete` | 🔪 | 删除已废弃的代码/文件/注释 | 删除可能被引用的东西 → 用破坏性变更 `!` |
| `init` | 🎉 | 项目/模块/子包的初始化或重新初始化。如：新建 monorepo 子包、首次接入构建工具链、初始化文档站脚手架、为新目录建立基础结构和约定 | 适用于**从无到有**搭建基础设施的场景。不要用于已有项目的增量功能开发（那用 `feat`） |
| `publish` | 📢 | 发布 npm 包新版本（CHANGELOG + version bump） | 仅限发布流程专用 |
| `save-file` | 🤔 | **仅用于"临时保存进度，不构成有意义变更"** | 尽量避免，用有意义的 type 代替 |

### 边界类型判断流程

当不确定选哪个 type 时，按以下流程决策：

```plain
1. 这个变更是"新增"还是"修复"？
   → 新增功能 → feat
   → 修 Bug → fix
   → 都不是 → 第 2 步

2. 变更是否影响用户可见行为？
   → 是 → 回到第 1 步（用 feat 或 fix）
   → 否 → 第 3 步

3. 变更属于以下哪一类？
   → 重构代码结构 → refactor
   → 改配置文件 → config
   → 改构建/打包 → build
   → 改文档/注释 → docs
   → 改测试 → test
   → 改 CI/CD → ci
   → 改依赖 → deps
   → 改翻译文本 → i18n
   → 性能优化 → perf
   → 格式化/Lint → style
   → 删除废弃文件 → delete
   → 都不匹配 → chore（兜底）
```

### 类型选择禁忌

- ❌ **不要混淆 `style` 和 UI 样式**：`style` 只用于代码格式化（缩进、分号），不用于 CSS/UI 视觉效果
- ❌ **不要滥用 `chore`**：只有明确不属于其他任何 type 时才能用——`chore` 不是"我不知道用什么所以选这个"
- ❌ **不要把不同类型混入一个提交**：如果改了代码又改了文档，拆成 `feat` + `docs` 两个提交
- ❌ **不要臆造不在 commit-types.ts 中的 type**：如果觉得现有 type 都不匹配，用最接近的那个，而不是发明新 type

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
| MiniMax     | 组织邮箱               | 6,703 (org followers) | `Co-authored-by: MiniMax <model@minimax.io>`                              |
| MIMO        | 组织邮箱               | 1,741 (org followers) | `Co-authored-by: MIMO <mimo@xiaomi.com>`                                  |

> **注意**：MiniMax 和 MIMO 使用的组织邮箱已在 GitHub 组织设置（`MiniMax-AI` / `XiaomiMiMo`）中公开，但可能无法在 GitHub 提交页显示模型图标（取决于 GitHub 域名验证与头像关联状态）。若各厂商后续提供官方 bot 账号或 `users.noreply.github.com` ID，再用其替换组织邮箱。

### 无官方账号（禁止使用）

以下工具/模型目前没有经验证的官方 GitHub bot 账号或公司邮箱，**禁止使用任何冒名抢注账号**：

- **AI CLI**：Codex CLI（属于 `openai` 组织）、Gemini CLI（属于 `google-gemini` 组织）均无专属 bot 账号
- **ZCode CLI**：由智谱 AI（`zai-org`）推出，无独立 GitHub bot 账号。智谱官方尚未建立任何可验证的 bot 账号（参见 [zai-org/GLM-5#75](https://github.com/zai-org/GLM-5/issues/75)，社区提议 `glm-bot` + `noreply@z.ai`，至今无官方回复）
- **WorkBuddy（腾讯小龙虾）**：腾讯云 CodeBuddy 团队维护，代码托管在 `cnb.cool/CodeBuddy`，GitHub 无官方组织或 bot 账号
- **AI IDE**：VS Code、Trae、Codebuddy、Antigravity、Qoder、Kiro 均未确认官方 bot 账号
- **AI 模型**：OpenAI GPT 系列、Gemini 系列、GLM 系列（智谱）、Kimi 系列（月之暗面/MoonshotAI）均无官方归属 bot 账号

> 待各厂商官方提供可验证的 bot 账号或公司邮箱后再补充到此表中。

### 已确认的假冒/冒名账号黑名单 [CRITICAL]

以下账号均已通过 GitHub API 验证为非官方账号，**严禁在 Co-authored-by 中使用**：

| 冒充目标 | 假冒账号 | 判定依据简述 |
|:---------|:---------|:------------|
| Claude Code | `anthropics-claude` | 不在 `anthropics` 组织；含加密货币诈骗项目 |
| Gemini CLI | `google-gemini-cli` | 不在 `google-gemini` 组织；全是 fork 无原创 |
| Codex CLI | `codex-cli` | 不属于 `openai` 组织；Codex 发布 5 天后抢注 |
| VS Code | `vscode-triage-bot` | 是 Issue 分流机器人，非 VS Code 本体 |
| GLM-5 | `zhipuch` | 普通个人用户，与智谱 AI 无关联 |
| Trae | `Trae-AI-Admin` | 不属于任何组织；0 个公开仓库 |
| Codebuddy | `CodeBuddy-Official-Account` | 不属于任何组织；无法确认为官方账号 |
| 其他（Antigravity/Qoder/Kiro/MiniMax/Kimi/MIMO） | 各假冒账号 | 均不在对应组织中，0 或极少公开仓库 |

> 完整黑名单（含 ID 和详细判定依据）参见 `references/co-authored-by-blacklist.md`。

## 交付物

提供：

- 最终的提交信息（包含 Emoji，按上下文选择中文或英文编写）
- 每个提交的简短摘要（内容/原因）
- 用于暂存/审查的命令（至少：`git diff --cached`，加上运行的任何测试）

## 参考文件

以下文件存放在本技能目录的 `references/` 下，按需查阅：

| 文件 | 何时查阅 |
|:-----|:---------|
| `commit-types.ts` | emoji/type 映射的本地 fallback 数据源 |
| `commit-message-template.md` | 提交信息写作模板与结构参考 |
| `commit-splitting-example.md` | 拆分逻辑复杂、文件众多时需要详细拆分示例 |
| `staging-priority.md` | 对暂存区处理逻辑有疑问时 |
| `input-requirements.md` | 用户信息不足需要确认输入时 |
| `co-authored-by-blacklist.md` | 发现未知 Co-authored-by 账号需验证时 |
| `breaking-change-examples.md` | 编写复杂破坏性变更提交信息时 |
| `command-reference.md` | PowerShell/POSIX 具体命令记不清时 |
