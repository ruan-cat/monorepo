# AI 记忆文档

## 本项目的技能表

本仓库同时维护两类技能来源：项目局部技能位于 `.agents/skills/`，对外分发技能位于 `ai-plugins/*/skills/`。**经验教训、事故复盘、根级 AI 记忆与 Memorix 同步**请优先使用 `record-bug-fix-memory`；其余按场景选用。已落地的仓库级排错案例写在 `record-bug-fix-memory` 技能正文 **「案例索引」** 小节（可随事故继续追加）。

### 项目局部技能（仓库内维护）

- `record-bug-fix-memory` — `.agents/skills/fix-bug/record-bug-fix-memory/SKILL.md` — bug 修复后的经验与事故记录沉淀（非调试流程本身）。
  - **存储架构**：双层存储。SKILL.md 只放流程指导和摘要索引，详细案例存储在同目录下的独立 `YYYY-MM-DD-{slug}.md` 文件中。
  - **阅读方式**：使用此技能前，先读 SKILL.md 了解流程，再根据「案例索引」章节按需读取相关的独立案例文件。
  - **写入方式**：新增经验时，创建独立案例文件，同时在 SKILL.md 的「案例索引」追加摘要。禁止将完整事故正文写入 SKILL.md。
  - 用途：在 bug 已定位并修复后，沉淀排错结论、事故记录、复盘与本地 MCP 记忆；只写「发生了什么、为何发生、如何验证、以后要记住什么」，不用于现场修 bug。
  - 触发时机：用户要求「记录经验教训」「补充 AI 记忆」「写事故记录」「同步 Memorix」，或排错已完成需沉淀时。
  - 参考作用：仓库级事故模式与验证证据写法的参考，减少重复踩坑。
  - 约束：不承担具体修复实现；仓库级经验写入本技能「案例索引」及根级 `CLAUDE.md` / `AGENTS.md`（必要时 Memorix）。

- `openspec-apply-change`
  - 路径：`.agents/skills/openspec-apply-change/SKILL.md`
  - 用途：OpenSpec 变更中按任务实现代码。
  - 触发时机：用户要开始、继续或推进实现，或处理 tasks 时。
  - 参考作用：把 delta 与 tasks 落到代码。
  - 约束：以变更工件为准，不跳过已约定的实现边界。

- `openspec-archive-change`
  - 路径：`.agents/skills/openspec-archive-change/SKILL.md`
  - 用途：在实现完成后归档 OpenSpec 变更。
  - 触发时机：用户要归档或结束某次变更时。
  - 参考作用：闭环变更与归档结构。
  - 约束：归档前宜配合 verify 与规范目录结构。

- `openspec-bulk-archive-change`
  - 路径：`.agents/skills/openspec-bulk-archive-change/SKILL.md`
  - 用途：并行多份变更一次性归档。
  - 触发时机：多分支或多变更需批量归档时。
  - 参考作用：批量归档流程与一致性。
  - 约束：核对每个变更的完成状态再归档。

- `openspec-continue-change`
  - 路径：`.agents/skills/openspec-continue-change/SKILL.md`
  - 用途：继续 OpenSpec 变更并生成下一工件。
  - 触发时机：用户要「下一 artifact」或延续工作流时。
  - 参考作用：延续 OPSX 工作流节奏。
  - 约束：承接上一工件依赖与命名约定。

- `openspec-explore`
  - 路径：`.agents/skills/openspec-explore/SKILL.md`
  - 用途：探索需求、问题与方案（OpenSpec 探索模式）。
  - 触发时机：变更前或途中需要澄清、调研、头脑风暴时。
  - 参考作用：在进入 new-change / apply 前缩小不确定面。
  - 约束：探索结论应能回写到规范工件，避免无限发散。

- `openspec-ff-change`
  - 路径：`.agents/skills/openspec-ff-change/SKILL.md`
  - 用途：快速创建 OpenSpec 实现所需全部工件。
  - 触发时机：用户要跳过逐步生成、一次性补齐 artifacts 时。
  - 参考作用：加速从意图到可实施工件集。
  - 约束：仍需人工审查质量与一致性。

- `openspec-new-change`
  - 路径：`.agents/skills/openspec-new-change/SKILL.md`
  - 用途：以实验性工件流程创建新的 OpenSpec 变更。
  - 触发时机：用户要新开功能、修复或重构类变更时。
  - 参考作用：规范化变更入口与目录结构。
  - 约束：遵循仓库 OpenSpec 约定与分支/命名策略。

- `openspec-onboard`
  - 路径：`.agents/skills/openspec-onboard/SKILL.md`
  - 用途：带讲解的 OpenSpec 全流程上手。
  - 触发时机：新成员或首次使用 OpenSpec 工作流时。
  - 参考作用：把设计与真实仓库操作串起来。
  - 约束：与仓库实际 `openspec` / `opsx` 布局一致。

- `openspec-sync-specs`
  - 路径：`.agents/skills/openspec-sync-specs/SKILL.md`
  - 用途：把 delta spec 同步回主 spec，且不强制归档变更。
  - 触发时机：主规格需吸收变更中的 delta 时。
  - 参考作用：保持主规格与变更一致。
  - 约束：区分同步与归档，避免误删变更目录。

- `openspec-verify-change`
  - 路径：`.agents/skills/openspec-verify-change/SKILL.md`
  - 用途：核对实现与变更工件一致后再归档。
  - 触发时机：实现完成后、归档前需验收时。
  - 参考作用：减少「实现与 spec 不一致」的归档。
  - 约束：验证应可复现（测试、构建或清单）。

- `package-linter`
  - 路径：`.agents/skills/package-linter/SKILL.md`
  - 用途：校验并规范化 monorepo 中 Node 包的 `package.json`、`tsup.config.ts`、`tsconfig.json`。
  - 触发时机：新建包、改包配置、包规范审查或初始化子包时。
  - 参考作用：与 monorepo 包规范一致。
  - 约束：以本仓库既有包与 `package-linter` 技能正文为准。

- `skill-hardening-from-incidents`
  - 路径：`.agents/skills/skill-hardening-from-incidents/SKILL.md`
  - 用途：把报告、事故复盘、历史经验转化为可复用的 skills 加固规则与执行流程。
  - 触发时机：根据报告、事故复盘、历史经验升级、加固或新建 skill 时。
  - 参考作用：明确写集、证据读取、角色闭环、路径污染扫描、AI 记忆与 Memorix 收口。
  - 约束：区分项目局部 skill、对外分发 skill、全局 skill；对外分发 skill 不写入本机绝对路径、开发期报告或 monorepo 内部测试/CI 路径。

### 对外分发技能（ai-plugins）

- `install-mcp`
  - 路径：`ai-plugins/common-tools/skills/install-mcp/SKILL.md`
  - 用途：维护常见与非常见 AI agent 的 MCP 配置目标清单、格式差异、合并/备份策略与安装调度边界。
  - 触发时机：用户要盘点、规划或批量安装 MCP 配置，或需要确认某个 agent 的 MCP 配置文件位置时。
  - 参考作用：清楚区分可写目标、候选目标与专用技能调度关系；Memorix full mode 的实际安装仍交给 `init-simple-memorix`。
  - 约束：本技能只承担清单与调度职责，不新增脚本逻辑，不覆盖未知 MCP 配置字段，不凭印象写死候选平台路径。

- `install-skills`
  - 路径：`ai-plugins/common-tools/skills/install-skills/SKILL.md`
  - 用途：维护常见与非常见 AI agent 的 skills 源目录、目标目录、软链接适配性与项目级候选目录清单。
  - 触发时机：用户要盘点、规划或分发 AI agent skills，或需要确认哪些 agent 可以批量同步 skills 时。
  - 参考作用：承担 skills 目录清单职责；已验证目标的实际安装动作交给 `sync-local-global-agents-skills`。
  - 约束：仅把已验证目标列为可执行同步目标；未验证 agent 只能列为候选，不能编造独立 skills 目录或默认替换项目级目录。

- `release-ai-plugins`
  - 路径：`ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`
  - 用途：管理 `ai-plugins` 多插件与多平台（Claude/Cursor）插件商城版本与文档链接。
  - 触发时机：插件版本升级、发版、更新 marketplace 或安装文档时。
  - 参考作用：与 `ai-plugins/common-tools` 下的 skills 树、README、CHANGELOG 保持一致。
  - 约束：同步版本号与变更路径，避免漏改子包；不再从旧的仓库局部路径读取真实来源。

## 对外分发 skill 的目录与路径约束

在 `ai-plugins/common-tools/skills` 或 `ai-plugins/dev-skills/skills` 下新建对外分发 skill 时，必须区分**仓库源码视角**与**安装后技能视角**。skill 安装后会被同步到用户机的 `~/.agents/skills/<skill-name>/` 目录，因此脚本、文档和示例都应以该安装目录为基准：

1. **脚本必须放在 skill 目录内部**：所有附属脚本、入口、兜底脚本均应位于 `ai-plugins/common-tools/skills/<skill-name>/scripts/`、`src/`、`fallback/` 等 skill 内部目录，禁止以 `scripts/<skill-name>` 等 monorepo 通用工具路径存放。
2. **文档路径使用相对路径**：`SKILL.md` / `README.md` 中的命令示例必须使用相对路径（如 `scripts/sync.ts`、`fallback/sync.ps1`），并注明在 skill 安装目录下运行。禁止使用 `ai-plugins/...` 等仓库源码绝对路径。
3. **不暴露开发期产物**：不要把 monorepo 内部测试文件、CI 配置、开发期报告写入用户分发的 `SKILL.md`「相关文件」或说明中。
4. **计划文档与实现同步**：一旦进入执行阶段，设计/计划文档必须随实现同步更新，禁止出现计划代码块与实际落地文件不一致的情况。

违反上述约束的具体案例与修复过程，参见 `.agents/skills/fix-bug/record-bug-fix-memory/2026-07-02-sync-local-global-agents-skills-design-pitfalls.md`。

## 主动问询实施细节

在我与你沟通并要求你具体实施更改时，难免会遇到很多模糊不清的事情。

请你**深度思考**这些`遗漏点`，`缺漏点`，和`冲突相悖点`，**并主动的向我问询这些你不清楚的实施细节**。请主动使用 claude code 内置的 `AskUserQuestion` 工具，将你不清楚的内容设计成一些列问题，并询问我，向我索要细节，或着与我协作沟通。

我会与你共同补充细化实现细节。我们会先迭代出一轮完整完善的实施清单，然后再由你亲自落实实施下去。

## 编写测试用例规范

1. 请你使用 vitest 的 `import { test, describe } from "vitest";` 来编写。我希望测试用例格式为 describe 和 test。
2. 测试用例的文件格式为 `*.test.ts` 。
3. 测试用例的目录一般情况下为 `**/tests/` ，`**/src/tests/` 格式。
4. 在对应 monorepo 的 tests 目录内，编写测试用例。如果你无法独立识别清楚到底在那个具体的 monorepo 子包内编写测试用例，请直接咨询我应该在那个目录下编写测试用例。

## 报告编写规范

在大多数情况下，你的更改是**不需要**编写任何说明报告的。但是每当你需要编写报告时，请你首先遵循以下要求：

- 报告地址： 默认在 `docs\reports` 文件夹内编写报告。
- 报告文件格式： `*.md` 通常是 markdown 文件格式。
- 报告文件名称命名要求：
  1. 前缀以日期命名。包括年月日。日期格式 `YYYY-MM-DD` 。
  2. 用小写英文加短横杠的方式命名。
- 报告的一级标题： 必须是日期`YYYY-MM-DD`+报告名的格式。
  - 好的例子： `2025-12-09 修复 @ruan-cat/commitlint-config 包的 negation pattern 处理错误` 。前缀包含有 `YYYY-MM-DD` 日期。
  - 糟糕的例子： `构建与 fdir/Vite 事件复盘报告` 。前缀缺少 `YYYY-MM-DD` 日期。
- 报告日志信息的代码块语言： 一律用 `log` 作为日志信息的代码块语言。如下例子：

  ````markdown
  日志如下：

  ```log
  日志信息……
  ```
  ````

- 报告语言： 默认用简体中文。
- 报告所使用的 agent 工具说明： 在报告的最前面增加说明，说明清楚当前报告是由哪个 agent 工具完成的。
- 报告所使用的 AI 模型说明： 在报告的最前面增加说明，说明清楚当前报告是由哪个 AI 模型完成的。

## 生成发版日志的操作规范

在你生成发版日志时，按照以下规范来完成：

1. 新建文件： 运行命令 `pnpm dlx @changesets/cli add --empty` ，该命令会在 `.changeset` 目录下，新建一个空的 markdown 文件，这个文件就是你要写入的发版日志。
2. 发版日志文件重命名： 这个命令会新建一个随机名称的发版日志文件，请你按照报告的规格，换成日期加语义化更新内容的名称。比如 `2025-12-15-add-pnpm-workspace-yaml.md` 就是有意义的命名。
3. yaml 区域写入 changeset 规格的发版信息： 写入发版包名，和`发版标签`的等级。
4. 写入更新日志： 在正文内编写更新日志。
5. 编写更新日志正文的行文规范：
   - 禁止使用任何等级的 markdown 标题： 编写任何`发版标签`的更新日志时，不允许使用任何等级的 markdown 标题，比如一级标题、二级标题等。这会影响自动合并的 `CHANGELOG.md` 文档的美观度。必须使用 markdown 的序号语法。
   - major： 详细，清晰。说明清楚 major 版本的重大变更。
   - minor： 用有序序号，简明扼要的说明清楚更新日志即可。
   - patch： 用有序序号，简明扼要的说明清楚更新日志即可。

## 术语说明

在我和你沟通时，我会使用以下术语，便于你理解。

### 发版日志相关术语

- `生成更新日志` ： 指的是在 `.changeset` 目录内，编写面向 changeset 的更新日志文件。其`发版标签`分为 `major` `minor` `patch` 这三个档次。如果我在要求你生成更新日志时，没有说明清楚`发版标签`具体发版到那个等级，请及时询问我。要求我给你说明清楚。
- `生成发版日志` ： `生成更新日志` 的别名，是同一个意思。

## 沟通协作要求

### `计划模式`

在`计划模式`下，请你按照以下方式与我协作：

1. 你不需要考虑任何向后兼容的设计，允许你做出破坏性的写法。请先设计一个合适的方案，和我沟通后再修改实施。
2. 如果有疑惑，请询问我。
3. 完成任务后，请告知我你做了那些破坏性变更。

请注意，在绝大多数情况下，我不会要求你以这种 `计划模式` 来和我协作。

### 避免越权修改

- 避免出现直接修改全局 skills 技能目录的情况。注意时刻明确自己所在的任务工作目录，没有明确的允许时，不允许直接修改全局技能目录。

## 终端操作注意事项（防卡住）

在 Windows PowerShell 环境下执行终端命令时，必须遵循以下规则，避免命令卡住浪费时间：

### 1. 避免超长单行命令

命令行参数过多（超过 200 字符）时，PowerShell 可能会挂起无响应。

- **拆分命令**：每次传入 2~3 个文件路径，不要一次传入 5 个以上。
- **使用通配符**：优先用 `git add scripts/.../src/*.ts` 替代逐个列举文件路径。

### 2. 优先使用 `pnpm run` 而非 `npx`

`npx` 在 Windows 上被终止时，会触发 `Terminate batch job (Y/N)?` 交互提示导致卡住。

- **优先使用** `pnpm run build` 替代 `npx tsdown`。
- **优先使用** `pnpm run test` 替代 `npx vitest run`。

### 3. 及时止损，不要反复轮询

当命令可能卡住时：

1. 第 1 次状态检查等待 10~15 秒。
2. 如果无输出且仍在运行 → **立即终止**，用新命令重试。
3. **不要超过 2 次**状态检查仍无进展还继续等待。

### 4. 合理的等待超时设置

|         命令类型         | 建议等待时长 |
| :----------------------: | :----------: |
| `git add / status / log` |   5~10 秒    |
|       `git commit`       |    10 秒     |
| `pnpm run build / test`  |    30 秒     |
|      `pnpm install`      |    60 秒     |

## 简单任务的高效执行原则

对于明显简单、直接、可在几步内完成的任务，请避免过度工程化。

### 1. 不要创建任务列表

简单任务不需要任务管理。只有当任务满足以下条件时才使用任务列表：

- 3 个或以上独立步骤
- 需要多轮决策
- 涉及多个文件或模块
- 用户明确要求跟踪进度

### 2. 不要写报告

除非用户明确要求，否则不要为简单任务生成报告、总结文档或变更说明。

### 3. 不要过度确认

在信息充足时直接执行，不要反复询问用户已经明确的内容。

### 4. 判断任务规模，选择正确的行动姿态

| 任务信号                         | 正确行动               |
| :------------------------------- | :--------------------- |
| 用户通过 `@文件` 明确了操作范围  | 直接读该文件，立即动手 |
| 用户说"帮我改这个"、"写个日志"   | 行动优先，缺什么补什么 |
| 用户涉及多包架构改动、新功能设计 | 先侦察，再行动         |

**核心原则**：用户提供的上下文（@文件引用、对话内容、当前打开文件）就是最直接的线索，优先使用，不要用命令重新发现已知信息。

### 5. 完整命令型简单任务优先级

当用户已经给出完整 `skills add ... --skill ... -g -y -a ...`、`npx skills add ...` 等可执行命令时，优先级是：用户明确命令 > 简单任务短路 > skill 触发 > 历史记忆/事故经验。首个实质动作应是执行原命令，或在存在明显语义风险时按用户语义确认原命令；失败后再按错误类型分流。

历史事故和 skill 只用于风险提示、失败分流和后置验证，不能抢占当前命令，也不能把安装命令提前扩展成同步、发布、fallback、agent team 或长计划。

### 6. 禁止行为清单

以下行为在**简单任务**（单文件改动、写 changeset、写提交信息等）中是被禁止的：

- 禁止连续执行超过 3 次 `git log` 来"了解全貌"
- 禁止在明确知道目标文件的情况下，仍去扫描整个项目目录
- 禁止把"读遍所有相关文档"当作行动前置条件
- 禁止在用户已给出 @文件 的情况下，用命令重新搜索文件位置

### 7. 立即响应纠偏

当用户发出以下信号时，必须**立即停止当前路径**，回归最小行动路径：

- "太复杂了"
- "不要反复查询"
- "直接做就行"
- "按要求做即可"
- "不对"
- "不是"
- "换种方式"

正确反应：停止当前侦察行为 → 明确当前已知信息 → 直接执行最核心的操作步骤。

### 8. 标准执行路径

| 用户请求      | 直接执行       |
| :------------ | :------------- |
| 安装依赖      | `pnpm install` |
| 运行测试      | `pnpm test`    |
| 格式化代码    | `pnpm format`  |
| 查看 git 状态 | `git status`   |

以"为某文件修改编写更新日志"为例，正确路径只有 3 步：

1. 读目标文件，理解改了什么
2. 执行 `pnpm dlx @changesets/cli add --empty`，重命名文件，写入内容
3. 提交

不需要查 git log，不需要扫描全部 tags，不需要对比所有包的版本号。

## 编码前思考、简洁优先、精准修改与目标驱动执行

本章节整合自 `multica-ai/andrej-karpathy-skills` 对 LLM 编码陷阱的总结，用于降低 AI agent 在写代码、改代码、重构代码时的常见错误。

这些准则偏向**谨慎和可验证**，而不是追求最快动手。遇到拼写修正、显而易见的一行改动、用户已经明确要求“直接做”的简单任务时，仍应遵循“简单任务的高效执行原则”，走最小行动路径。

### 问题背景

LLM 在编码任务中常见的问题不是“不会写代码”，而是会在不该自行决定的地方默默做决定：

- 代替用户做错误假设，然后不加确认地继续执行。
- 隐藏自己的困惑，不主动说明哪里不确定。
- 遇到多种解释时，不呈现分歧和权衡，而是静默选择一种。
- 在应该提出异议时不反驳，导致复杂方案一路推进。
- 喜欢增加抽象、配置项、兼容层和“未来可能有用”的能力。
- 顺手修改相邻代码、注释、格式或命名，制造与任务无关的 diff。
- 删除或改写自己没有充分理解的旧代码，尤其是看似无用但可能承载历史约束的代码。

本章节的目标是把这些风险转化为明确的执行纪律：先澄清，再简化；只改必要内容；每一步都有可验证的成功标准。

### 核心原则概览

| 原则         | 主要解决的问题                             |
| :----------- | :----------------------------------------- |
| 编码前思考   | 错误假设、隐藏困惑、缺少权衡、没有及时澄清 |
| 简洁优先     | 过度工程、抽象泛滥、为了未来场景提前设计   |
| 精准修改     | 无关编辑、顺手重构、删除不理解的代码       |
| 目标驱动执行 | 成功标准模糊、验证不足、靠盲改推进任务     |

### 编码前思考

不要假设，不要隐藏困惑，要把关键权衡摆出来。

在开始实现前，先检查自己是否真的理解了任务：

- 明确说明当前假设。只要假设会影响实现路径，就不要把它藏在心里。
- 如果存在多种解释，列出这些解释，并说明各自会导致什么实现差异。
- 如果需求不清楚，停下来指出不清楚的点，向用户询问。
- 如果用户提出的方案明显复杂、风险高或与目标不匹配，应该礼貌指出，并给出更简单的替代方案。
- 如果只是小范围、低风险、目标明确的任务，可以说明采用的合理默认假设，然后直接执行。

不要用“我先实现一个通用版本”来掩盖需求不清。通用版本通常意味着你正在替用户决定未确认的未来需求。

### 简洁优先

用能解决当前问题的最少代码完成任务，不要写推测性功能。

执行时遵循这些约束：

- 不添加用户没有要求的功能。
- 不为只使用一次的逻辑创建抽象。
- 不为了“灵活性”添加未要求的配置项、插件点、策略对象或兼容层。
- 不为实际上不可能发生的场景堆错误处理。
- 不为了展示完整架构而扩大文件、模块或 API 的边界。
- 如果你写了 200 行，但 50 行就能清楚解决问题，应该主动收缩实现。

判断是否过度复杂，可以问自己：

- 资深工程师会不会认为这比需求本身重很多？
- 当前抽象是否已经有两个以上真实调用方？
- 这个配置项是否已经被用户或现有系统明确需要？
- 这段错误处理是否对应真实可达的失败路径？
- 如果明天删除这个功能，当前设计是否会留下大量无意义结构？

简洁不是草率。简洁意味着实现边界清楚、依赖少、验证直接、后续读者容易判断为什么需要这些代码。

### 精准修改

只触碰必须触碰的内容，只清理自己造成的问题。

编辑已有代码时，必须尊重当前系统的局部风格和历史边界：

- 不要顺手“改进”相邻代码、注释、格式或命名。
- 不要重构没有坏、也不在任务范围内的代码。
- 匹配已有代码风格，即使你个人更喜欢另一种写法。
- 看到无关死代码时，可以在总结中提及，不要擅自删除。
- 不要把格式化整个文件当作完成小改动的副作用。
- 不要因为读不懂旧逻辑就删除它；读不懂时应先调查或询问。

当你的改动制造了孤儿代码时，应清理这些由你造成的遗留物：

- 删除因为本次改动而变成未使用的导入。
- 删除因为本次改动而变成未使用的变量、函数或类型。
- 删除因为本次改动而失效的局部注释或测试数据。

不要清理本次任务之前就已经存在的死代码，除非用户明确要求。

最终自检标准：每一行 diff 都应该能直接追溯到用户请求、实现该请求所需的必要调整，或本次改动产生的必要清理。

### 目标驱动执行

先定义成功标准，再循环验证直到达成。

不要只把用户的话理解成“要做什么”，还要把它转化成“怎样证明已经做好”。例如：

| 用户指令   | 更好的目标表达                               |
| :--------- | :------------------------------------------- |
| 添加验证   | 为无效输入补测试，再让测试通过               |
| 修复 bug   | 先写出能复现问题的测试或最小复现，再让它通过 |
| 重构某模块 | 保证重构前后现有测试通过，行为不变           |
| 优化构建   | 给出构建命令、耗时或错误消失的验证证据       |
| 更新文档   | 检查链接、路径、命令和示例是否与实际文件一致 |

多步骤任务应使用简短计划，并为每一步绑定验证方式：

```markdown
1. 调整模板内容 -> 验证：标题层级和语言符合模板规范
2. 同步版本号 -> 验证：相关配置与版本声明一致
3. 更新 changelog -> 验证：版本节、日期、分类和 bullet 可扫读
```

强成功标准可以让 agent 独立推进并及时收敛。弱成功标准，例如“让它能用”“优化一下”“整理一下”，通常会导致反复猜测和返工。

### AI 实践补充

在实际协作中，除了四项核心原则，还应遵循下面的 agent 执行纪律：

- **先识别任务类型**：简单任务直接做；多文件、多包、发布、架构和流程变更先列清范围与验证点。
- **先读最近相关上下文**：读目标文件、相邻模板、现有 changelog 或测试，不要为了“了解全貌”无边界扫描。
- **显式记录关键假设**：假设影响版本号、发布等级、文件落点、兼容策略时，必须告诉用户或请求确认。
- **让每一步能回滚和解释**：每次编辑只覆盖一个清楚意图，避免把内容改写、版本升级、格式整理和无关清理混在一起。
- **失败时先定位根因**：测试、构建、校验失败后，先读错误和相关代码，不要连续盲改。
- **验证证据要具体**：优先给出命令、文件、diff、测试结果、解析结果，而不是“应该可以”。
- **保护用户改动**：工作区已有改动默认属于用户；除非用户明确要求，不要撤销、覆盖、提交或重新暂存这些改动。
- **避免流程压过目标**：技能、规范和流程用于服务任务。如果流程与用户明确意图冲突，应先说明冲突并按用户意图收敛。
- **保持输出可扫读**：面向人类的 changelog、报告、说明文档，要用短句和分组表达，不要把多个原因、文件和效果塞进一条长句。
- **完成前读 diff**：确认改动范围、标题层级、格式、语言和验证结果都符合目标，再声称完成。

### 生效判断

这些准则真正生效时，应该能观察到以下信号：

- diff 更小，且无关文件和无关格式改动明显减少。
- 因过度抽象、过度配置、过度兼容导致的返工减少。
- 澄清问题出现在实现之前，而不是错误实现之后。
- 代码修改更贴近现有风格，局部边界更稳定。
- PR、提交或补丁更干净，每一块改动都有清楚理由。
- 测试、构建、文档检查或手动验证证据更具体。
- 用户纠偏次数减少，任务能围绕可验证目标向前推进。

## 插件市场变更

本节仅适用于本 monorepo 的 `ai-plugins` 市场维护与发版；不得将其回填到通用 AI 记忆模板或一般项目的 AI 记忆文档。

新增或修改 AI 插件市场时，先识别每个客户端的 manifest、marketplace 与安装命令边界。不得把 Claude Code、Cursor 或 Codex 的专属字段和路径假设互相复制；共享技能目录可以复用，但平台清单必须按各自 schema 维护。

多平台插件市场变更的完成标准不只是 JSON 可解析：还要同步安装、更新、卸载文档和 CHANGELOG，运行对应客户端的真实 CLI 或官方验证路径，并在本地安装 smoke test 后清理临时市场与插件。若无法获得真实安装证据，必须明确记录为未验证，不能以静态校验替代。

## 使用 superpower 技能的个人偏好

本章节记录用户使用 superpower 系列技能时的固定个人偏好。执行 `brainstorming`、`writing-plans`、`executing-plans` 等 superpower 工作流时，优先遵循这些偏好；除非用户在当前对话中明确要求例外，不要自行改成其他默认流程。

### superpower 产物必须使用中文

使用 `brainstorming` 技能生成的 `docs\superpowers\specs` 规格规划文件，以及 `docs\superpowers\plans` 计划执行清单文件，必须使用简体中文编写。

具体要求如下：

- 规格文件的标题、正文、方案说明、取舍分析、验收标准和风险说明必须使用简体中文。
- 计划文件的阶段划分、任务清单、执行步骤、验证方式和完成状态必须使用简体中文。
- 尤其是 plan 执行任务清单，不要写成英文任务项。
- 只有技能名、文件路径、命令、分支名、包名、API 名称等必要技术标识可以保留英文。
- 如果 superpower 技能自带示例是英文，也要在落地到本项目的 Markdown 文件时改写为中文表达。

这条偏好用于纠正 superpower 技能在实际执行中偶尔生成英文 Markdown 的问题。项目级 AI 记忆文件中必须明确强调：由 superpower 技能生成的规格文件和计划文件，特别是 plan 任务清单文件，必须是中文内容。

### superpower 产物不要擅自标记完成

使用 `brainstorming`、`writing-plans`、`executing-plans` 等 superpower 工作流生成 `docs\superpowers\specs` 或 `docs\superpowers\plans` 文档时，禁止在文档顶部或正文中擅自添加 `<!-- 已完成 -->`、`已完成`、`完成` 等状态标记。

只有当对应任务已经真实实施、验证完成，并且用户明确认可该阶段已经完成时，才能记录完成状态。用户只是认可方案或 spec，不代表实施任务已经完成；不能用 “已完成” 误导后续查找和判断。

### superpower 流程不要擅自 git commit

使用 superpower 技能时，即使技能文档写有“写完设计文档并 commit”之类默认流程，也不能擅自执行 `git commit`。提交会影响用户查找文件和管理工作区，必须等用户在当前对话中明确要求 “提交” “git commit” 或给出等价授权后才能提交。

如果技能默认流程与用户当前偏好冲突，以用户当前偏好为准：只写文件、说明状态、等待用户决定是否提交。需要提交时，也必须只暂存本轮会话明确涉及的文件，不要把无关 dirty 文件纳入。

### executing-plans 不默认使用 git worktree

使用 `executing-plans` 技能执行任务时，不要默认创建或切换到 git worktree。用户不喜欢默认的 git worktree 执行方式。

分支使用规则如下：

- 当前 AI 代理在哪个分支内工作，就优先在当前分支内开始执行任务。
- 如果当前分支是 `dev`，直接在 `dev` 分支完成开发、测试和文档编写。
- 如果当前分支是 `main`，先检查是否存在 `dev` 分支；如果存在，优先切换到 `dev` 分支再完成开发与编写。
- 如果当前分支是 `main` 且不存在 `dev` 分支，不要自行创建 worktree；先向用户确认是在 `main` 继续，还是创建或切换到其他开发分支。
- 只有当用户明确要求隔离工作区、并行分支开发或使用 worktree 时，才采用 git worktree 流程。

切换分支前必须先检查工作区状态。若存在未提交修改，先判断这些修改是否会影响切换；不要覆盖、丢弃或回滚用户已有改动。

## 文档读取策略

初始化或更新项目内的 AI 记忆文档时，必须遵循渐进式读取，先建立结构认知，再读取任务所需内容。

- 第一次只读目录和标题结构。Markdown 文档先执行 `grep "^##" file`，不要一开始读取全文。
- 根据任务需要，使用 `offset` / `limit` 只读取相关章节；无关章节不加载到上下文中。
- 读取 JSON、YAML、TOML 等结构化文件时，先查看顶层键、数组项和相关字段，再按字段范围读取，禁止为了确认一个字段倾倒整个文件。
- 更新文档时使用 `Edit` 做精准替换或定点插入，不要先 `Read` 全文再整体 `Write`，避免覆盖项目已有内容。
- 编辑后只复读修改位置，并用差异检查确认没有误改、漏改或破坏原有格式。

## 获取技术栈对应的上下文

在处理特定技术栈相关的问题时，你应该主动获取对应的上下文文档和最佳实践。

### claude code skill

- 编写语法与格式： https://code.claude.com/docs/zh-CN/skills
- 最佳实践： https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices
- 规范文档： https://agentskills.io/home

# Memorix — Automatic Memory Rules

You have access to Memorix memory tools. Follow these rules to maintain persistent context across sessions.

## RULE 1: Session Start — Load Context

At the **beginning of every conversation**, BEFORE responding to the user:

1. Call `memorix_session_start` to get the previous session summary and key memories (this is a direct read, not a search — no fragmentation risk)
2. Then call `memorix_search` with a query related to the user's first message for additional context
3. If search results are found, use `memorix_detail` to fetch the most relevant ones
4. Reference relevant memories naturally — the user should feel you "remember" them

## RULE 2: Store Important Context

**Proactively** call `memorix_store` when any of the following happen:

### What MUST be recorded

- Architecture/design decisions → type: `decision`
- Bug identified and fixed → type: `problem-solution`
- Unexpected behavior or gotcha → type: `gotcha`
- Config changed (env vars, ports, deps) → type: `what-changed`
- Feature completed or milestone → type: `what-changed`
- Trade-off discussed with conclusion → type: `trade-off`

### What should NOT be recorded

- Simple file reads, greetings, trivial commands (ls, pwd, git status)

### Use topicKey for evolving topics

For decisions, architecture docs, or any topic that evolves over time, ALWAYS use `topicKey` parameter.
This ensures the memory is UPDATED instead of creating duplicates.
Use `memorix_suggest_topic_key` to generate a stable key.

Example: `topicKey: "architecture/auth-model"` — subsequent stores with the same key update the existing memory.

### Track progress with the progress parameter

When working on features or tasks, include the `progress` parameter:

```json
{
	"progress": {
		"feature": "user authentication",
		"status": "in-progress",
		"completion": 60
	}
}
```

Status values: `in-progress`, `completed`, `blocked`

## RULE 3: Resolve Completed Memories

When a task is completed, a bug is fixed, or information becomes outdated:

1. Call `memorix_resolve` with the observation IDs to mark them as resolved
2. Resolved memories are hidden from default search, preventing context pollution

This is critical — without resolving, old bug reports and completed tasks will keep appearing in future searches.

## RULE 4: Session End — Store Decision Chain Summary

When the conversation is ending, create a **decision chain summary** (not just a checklist):

1. Call `memorix_store` with type `session-request` and `topicKey: "session/latest-summary"`:

   **Required structure:**

   ```plain
   ## Goal
   [What we were working on — specific, not vague]

   ## Key Decisions & Reasoning
   - Chose X because Y. Rejected Z because [reason].
   - [Every architectural/design decision with WHY]

   ## What Changed
   - [File path] — [what changed and why]

   ## Current State
   - [What works now, what's pending]
   - [Any blockers or risks]

   ## Next Steps
   - [Concrete next actions, in priority order]
   ```

   **Critical: Include the "Key Decisions & Reasoning" section.** Without it, the next AI session will lack the context to understand WHY things were done a certain way and may suggest conflicting approaches.

2. Call `memorix_resolve` on any memories for tasks completed in this session

## RULE 5: Compact Awareness

Memorix automatically compacts memories on store:

- **With LLM API configured:** Smart dedup — extracts facts, compares with existing, merges or skips duplicates
- **Without LLM (free mode):** Heuristic dedup — uses similarity scores to detect and merge duplicate memories
- **You don't need to manually deduplicate.** Just store naturally and compact handles the rest.
- If you notice excessive duplicate memories, call `memorix_deduplicate` for batch cleanup.

## Guidelines

- **Use concise titles** (~5-10 words) and structured facts
- **Include file paths** in filesModified when relevant
- **Include related concepts** for better searchability
- **Always use topicKey** for recurring topics to prevent duplicates
- **Always resolve** completed tasks and fixed bugs
- **Always include reasoning** — "chose X because Y" is 10x more valuable than "did X"
- Search defaults to `status="active"` — use `status="all"` to include resolved memories

## Monorepo 结构

这是一个基于 **pnpm workspace** 的 monorepo 项目，包含以下工作区：

- `packages/*` - 核心发布包（utils、release-toolkit、vercel-deploy-tool、vitepress-preset-config、vuepress-preset-config、domains、generate-code-workspace）
- `configs-package/*` - 共享配置包（commitlint-config、taze-config）
- `vite-plugins/*` - Vite 相关插件
- `demos/*` - 示例应用
- `tests/*`、`fork/*`、`learn-create-compoents-lib/*`、`docs/*` - 其他辅助工作区
- `ai-plugins/*` - AI 插件与 skills 模板（内含大量**非真实可运行项目**的 TypeScript 片段，仅作技能模板）

**关键的 monorepo 事实**：`.claude/agents` 仅存在于 monorepo 根目录。当从嵌套子项目运行脚本时，`process.cwd()` 可能指向子项目根目录，而非 monorepo 根目录。应复用工具包公开的 `@ruan-cat/utils/monorepo` 中的 `findMonorepoRoot()`（源码位于 `packages/utils/src/monorepo/index.ts`），通过向上查找 `pnpm-workspace.yaml` 来定位 monorepo 根目录。

## 常用命令

### 包管理

```bash
pnpm install                    # 安装依赖
pnpm up-taze                    # 交互式更新依赖（使用 taze）
pnpm clear:deps                 # 清理所有 node_modules 和锁文件
pnpm clear:cache                # 清理构建缓存（dist, .turbo, .vercel, .cache, .temp）
```

### 构建

```bash
pnpm build                      # 构建所有包（使用 Turbo）
pnpm build:docs                 # 构建所有文档站点
pnpm ci                         # 运行完整 CI 构建（包 + 文档）
```

### 测试

```bash
pnpm test                       # 运行 Vitest，启用 UI 界面，端口 4000
```

### 代码质量

```bash
pnpm format                     # 使用 Prettier 格式化所有代码
pnpm automd                     # 运行 automd 自动更新 Markdown 文档
pnpm automd:all                 # 对所有包运行 automd
```

### Git 工作流

```bash
pnpm commit                     # 使用 commitizen 提交（基于 cz-git）
pnpm git:push                   # 推送并携带标签
pnpm git:fetch                  # 获取远程更新并清理（git fetch -p）
pnpm git:dev-2-main             # 将 dev 分支 rebase 到 main 并推送
pnpm git:main-2-dev             # 将 main 分支 rebase 到 dev 并推送
```

### 发版流程（Changesets）

```bash
pnpm changeset:add              # 添加变更集用于版本升级
pnpm changeset:version          # 升级版本并更新变更日志（包含 tag）
pnpm changeset:publish          # 发布包到 npm
pnpm release                    # 构建并发布到 npm（build + publish）
```

发版工作流使用：

- **Changesets** 进行版本管理
- **@svitejs/changesets-changelog-github-compact** 生成变更日志
- **主分支**：`main`
- **自定义插件**：`@ruan-cat/release-toolkit` 提供基于 changelogen 的增强功能
- **GitHub Release 同步**：通过 `scripts/sync-github-release.ts` 自动同步

### 部署

```bash
pnpm deploy                     # 部署文档站点到 Vercel（使用 Turbo）
pnpm deploy-vercel              # 直接部署到 Vercel（使用 vercel-deploy-tool）
```

### 工具命令

```bash
pnpm create-code-workspace      # 生成 VS Code workspace 配置文件
pnpm pack:all                   # 打包所有包并生成报告
pnpm codess:init                # 初始化 codess 配置
pnpm codess:build               # 使用 codess 构建
```

## 构建系统架构

### Turbo 流水线

Monorepo 使用 **Turbo** 进行基于依赖关系的任务编排：

- `build` 任务：输出到任务自身的 `dist/**` 和 `.output/**`，依赖 `^build`（上游包）。禁止使用 `**/dist/**` 这类可匹配依赖目录的宽输出 glob。
- `build:docs` 任务：输出到 `**/.vitepress/dist/**` 和 `**/.vuepress/dist/**`，依赖 `^build`
- 发布任务依赖于成功的构建
- CI 模块找不到时，先绑定「第一个错误 + SHA + 任务命令 + 文件存在性」；历史绿灯、后续 `139`、全局 linker/Node 调整都不能代替因果证据。包内 `node_modules/.../bin` 物理路径不是稳定 CLI 合同。
- 发布包必须自行声明构建脚本所需二进制和构建产物保留的外部 runtime import；只在最新代码 SHA 的完整构建后，以发布入口测试验收，不能用本机 hoist 或文档提交的缓存绿灯代替。

**Turbo 远程缓存配置**：

- Team: `ruancat-projects`
- 需要配置 `TURBO_TOKEN` 环境变量（CI 中自动设置）

### TypeScript 项目引用

代码库使用 **TypeScript Project References**：

- `tsconfig.base.json` 中设置 `composite: true` 和 `incremental: true`
- `declaration: true` 和 `declarationMap: true` 用于类型生成
- `emitDeclarationOnly: true` - 大多数包使用外部打包器（tsup/vite）生成 JS 文件

### 包构建模式

大多数包使用 **tsup** 进行构建：

- 源码：`src/` 目录，包含 `.ts/.mts` 文件
- 输出：`dist/` 目录，包含 `.js/.cjs/.mjs` 文件
- 入口点在 `exports` 字段中定义，支持 ESM/CJS 双格式

**tsup 配置示例**（参见 `packages/utils/tsup.config.ts`）：

- ESM 格式：用于常规浏览器/现代 Node.js 环境
- CJS 格式（`dist/node-cjs`）：专用于 Node.js CommonJS 场景
- ESM 格式（`dist/node-esm`）：专用于 Node.js ESM 场景，启用 `shims`

## 核心包架构

### @ruan-cat/utils

通用工具包，包含 Node.js 脚本：

- `monorepo/index.ts` - 提供 `findMonorepoRoot()`、`isMonorepoProject()` 等 monorepo 根目录定位与 workspace 判定工具
- 导出工具：条件判断、Promise 工具、打印工具、VueUse 辅助函数等
- **多环境构建**：同时支持浏览器、Node.js CJS、Node.js ESM

### @ruan-cat/release-toolkit

基于 changelogen 增强 Changesets 工作流：

- 插件：`changelog-with-changelogen` - 语义化提交解析和 GitHub Release 生成
- 与 `@changesets/cli` 作为 peer dependency 集成
- 使用 `@octokit/rest` 进行 GitHub API 集成
- **发布标签**：所有包默认发布到 `beta` 标签

### @ruan-cat/vitepress-preset-config

VitePress 配置预设：

- 主导出：`./config`（构建输出：`dist/config.mjs`，类型：`src/config.mts`）
- 主题导出：`./theme`（源码：`src/theme.ts`）
- 文档站点位于 `src/docs/`
- 使用插件：vitepress-demo-plugin、@nolebase/git-changelog、vitepress-sidebar 等

## 配置文件说明

### TypeScript

- **基础配置**：`tsconfig.base.json` - 共享编译选项
- **路径配置**：`tsconfig.path.json` - 路径别名
- **测试配置**：`tsconfig.test.json` - 测试专用设置
- **Markdown 配置**：`tsconfig.md.json` - 用于 Markdown 中的 TypeScript 代码块
- **`ai-plugins` 专用**：`ai-plugins/tsconfig.json` — 根 `tsconfig.json` 与 `tsconfig.test.json` 已排除 `./ai-plugins`，避免 skills 模板 TS 被主工程当作正式代码检查。该配置使用 **`noCheck: true`**（并仅 `include` `**/*.ts`），有意**不做语义类型检查**，以免 Nuxt/占位包/`~icons` 等模板依赖产生大面积误报。校验命令：`pnpm run typecheck:ai-plugins`（通过即表示配置可解析，不代表类型安全）。
- **若将来在 `ai-plugins` 内编写「真实、可维护」的 TypeScript 脚本**（需要完整类型与 `tsc` 把关）：应**单独拆目录**（例如 `ai-plugins/tools/`）或**单独新增 tsconfig**（如 `ai-plugins/tools/tsconfig.json`），在该配置中**关闭 `noCheck`**（并补齐 `@types/node`、相关依赖与 `include`/`exclude`），**不要**与纯模板代码共用当前这份「仅消除误报」的 `ai-plugins/tsconfig.json`。

### 代码检查与格式化

- **ESLint**：使用 `@antfu/eslint-config` 配合 Prettier 集成
  - 双引号、分号、2 空格缩进
  - 启用 TypeScript、Vue、CSS、HTML、Markdown 格式化器
  - JSDoc 规则：强制要求描述（`jsdoc/require-description`）
- **Prettier**：使用 `@prettier/plugin-oxc` 插件进行额外格式化
- **lint-staged**：通过 `simple-git-hooks` 在 pre-commit 时格式化所有文件

### Git Hooks

- 通过 `simple-git-hooks.mjs` 配置
- 在 `postinstall` 时自动初始化
- **重要**：修改 `simple-git-hooks.mjs` 后必须运行 `npx simple-git-hooks` 使其生效
- `commit-msg` hook：使用 Commitlint 强制约定式提交（配置：`@ruan-cat/commitlint-config`）
- `pre-commit` hook：运行 `lint-staged` 格式化暂存文件

### 提交规范

- 使用 **commitizen** + **cz-git** 进行交互式提交
- 通过 `@ruan-cat/commitlint-config` 验证提交信息
- 配置项：`isPrintScopes: false`（不打印作用域列表）

## 开发工作流

### 添加新包

1. 在合适的工作区文件夹（`packages/*` 等）创建目录
2. 添加 `package.json`，使用 `workspace:^` 协议声明工作区依赖
3. 在其他包的 `devDependencies` 或 `dependencies` 中引用
4. 运行 `pnpm install` 链接工作区包
5. 在 `package.json` 中添加构建脚本（通常为 `"build": "tsup"`）
6. 创建 `tsup.config.ts` 配置文件（可参考 `packages/utils/tsup.config.ts`）

### 使用工作区依赖

使用 `workspace:^` 协议声明内部依赖：

```json
{
	"dependencies": {
		"@ruan-cat/utils": "workspace:^"
	}
}
```

### 文档站点

- VitePress 站点构建到 `.vitepress/dist/`
- VuePress 站点构建到 `.vuepress/dist/`
- 每个包含文档的包应有 `build:docs` 脚本
- 文档构建依赖于包构建完成（Turbo 依赖链）

### 发布工作流

1. 在相关包中进行修改
2. 运行 `pnpm changeset:add` 创建变更集
3. 提交 `.changeset/` 中的变更集文件
4. 准备发布时，运行 `pnpm changeset:version` 升级版本
5. 运行 `pnpm release` 构建并发布

**发布配置**：

- 所有包发布到 npm，`"access": "public"`
- 默认标签：`"tag": "beta"`
- GitHub Actions 自动化：推送到 `main` 分支时自动发布
- 发布后自动同步 GitHub Release
- 发布后触发部署工作流（`deploy-after-release` 事件）

### CI/CD 流水线

**Release 流水线**（`.github/workflows/release.yml`）：

1. 检出代码（fetch-depth: 0，获取完整历史）
2. 安装 pnpm + Node.js 22.14.0
3. 安装依赖并链接 Turbo 远程缓存
4. 构建项目（`pnpm build`）
5. 使用 Changesets Action 发布包
6. 同步 GitHub Release（`scripts/sync-github-release.ts`）
7. 触发部署工作流

**环境要求**：

- Node.js >= 22.14.0
- pnpm 10.21.0（通过 packageManager 字段指定）
- 仅允许使用 pnpm（通过 `preinstall` 脚本强制）

## 代码规范

- 要使用 `tinyglobby` ，而不是 `glob` 。

## 新建 Skills 的 YAML 前缀规范

在本项目新建 Skill（`SKILL.md`）时，文件最顶部必须使用 YAML frontmatter（以 `---` 开始和结束）。

### 必填字段（最小集合）

1. `name`
2. `description`

### 本项目推荐字段

1. `metadata.version`
   - 建议从 `"1.0.0"` 起步，后续仅在该 Skill 有变更时更新。
2. `user-invocable`
   - 当技能需要允许用户主动调用时，设置为 `true`。

### 参考模板（普通 Skill）

```yaml
---
name: your-skill-name
description: 说明技能用途、触发时机与适用场景。
metadata:
  version: "1.0.0"
---
```

### 参考模板（可主动调用 Skill）

```yaml
---
name: your-skill-name
description: 说明技能用途、触发时机与适用场景。
user-invocable: true
metadata:
  version: "1.0.0"
---
```

### 补充说明

1. `name` 建议使用 kebab-case（小写英文和短横线）。
2. `description` 要写清楚“做什么 + 什么时候用”。
3. frontmatter 之后再编写正文指令，不要把正文内容写进 YAML 区域。

## 经验教训：git-commit 技能执行规范

### 2026-07-02 — git-commit 技能执行违规复盘

**问题现象**：AI agent 在执行 git-commit 分门别类拆分时，连续出现三次技能执行错误：

- `style` 类型使用了 💅，但 `git-commit` 技能 `commit-types.ts` 规定 `style` 的 emoji 为 🌈
- `publish` 发版时遗漏了 6 个 marketplace/plugin.json 版本文件同步
- 反复 `git reset --soft` 补救导致提交过程混乱，最终推送时远端已有更新，触发 rebase 冲突

**根因**：

- 未查阅技能来源优先级（`git-commit` 技能要求先查 `commit-types.ts` 确认 emoji，而非凭记忆）
- 未按 `release-ai-plugins` 技能要求同步全部版本文件
- git 操作缺乏预规划，先提交再补救

**后续约束**：

1. 执行 `git-commit` 前**必须**查阅 `commit-types.ts` 或远程 raw 确认 emoji/type 映射，禁止凭记忆选取
2. `publish` 提交**必须**先同步所有版本文件（2 个 marketplace + 4 个 plugin.json），缺一不可
3. git 操作**先规划再执行**，禁止反复 `reset --soft` 补救。一次性确认拆分方案、emoji、type、scope 全部正确后再提交
4. 提交前先 `git fetch origin` 确认远端状态，避免 push 被拒后再处理 rebase
5. 本地有未提交文件时**先 stash 再 rebase**，避免无关文件干扰冲突处理

**案例文件**：`.agents/skills/fix-bug/record-bug-fix-memory/2026-07-02-git-commit-skill-violation.md`

## 仓库级排错经验索引

详细记录均存放在 `.agents/skills/fix-bug/record-bug-fix-memory/` 案例文件中，根级 AI 记忆文档仅保留索引。

- 2026-07-02 — 新建 `use-vercel-deploy-in-monorepo` skill 时的误判链：`2026-07-02-use-vercel-deploy-skill-pitfalls.md`
- 2026-06-30 — consola Node.js 24 ESM 解析失败：`2026-06-30-consola-node24-esm-resolve.md`
- 2026-08-10 — `init-prettier-git-hooks` 将 AI 操作流程误做成迁移器产品：`2026-08-10-init-prettier-git-hooks-overengineering.md`
- 2026-08-11 — Node.js 24 下 VitePress 宽 barrel 的 `consola` 间接解析与 utils 并行 tsup 清理声明竞态：`2026-08-11-vitepress-node24-pnpm-entrypoint.md`
- 2026-08-12 — Turbo 宽缓存输出掩盖真实包依赖闭包缺口：`2026-08-12-turbo-cache-output-and-package-closure.md`
