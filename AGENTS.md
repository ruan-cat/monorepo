# AI 记忆文档

## 本项目的技能表

本仓库同时维护两类技能来源：项目局部技能位于 `.agents/skills/`，对外分发技能位于 `ai-plugins/*/skills/`。**经验教训、事故复盘、根级 AI 记忆与 Memorix 同步**请优先使用 `record-bug-fix-memory`；其余按场景选用。已落地的仓库级排错案例写在 `record-bug-fix-memory` 技能正文 **「案例索引」** 小节（可随事故继续追加）。

### 项目局部技能（仓库内维护）

- `record-bug-fix-memory` — `.agents/skills/record-bug-fix-memory/SKILL.md` — bug 修复后的经验与事故记录沉淀（非调试流程本身）。
  - **存储架构**：双层存储。SKILL.md 只放流程指导和摘要索引，详细案例存储在同目录下的独立 `YYYY-MM-DD-{slug}.md` 文件中。
  - **阅读方式**：使用此技能前，先读 SKILL.md 了解流程，再根据「案例索引」章节按需读取相关的独立案例文件。
  - **写入方式**：新增经验时，创建独立案例文件，同时在 SKILL.md 的「案例索引」追加摘要。禁止将完整事故正文写入 SKILL.md。
  - 用途：在 bug 已定位并修复后，沉淀排错结论、事故记录、AI 记忆更新、复盘与本地 MCP 记忆；只写「发生了什么、为何发生、如何验证、以后要记住什么」，不用于现场修 bug。
  - 触发时机：用户要求「记录经验教训」「补充 AI 记忆」「写事故记录」「同步 Memorix」，或排错已完成需沉淀时；当主代理完成错误处理后，也应主动参考并补充这个技能。
  - 参考作用：仓库级事故模式与验证证据写法的参考，减少重复踩坑；后续处理错误时，应先把这个技能作为历史事故模式、稳定基线、验证证据写法的参考来源之一。
  - 约束：不承担具体修复实现；解决错误后，应主动把新增的根因、关键误导点、有效修复、验证方式和后续约束补充回这个技能，并在需要时同步回根级 `AGENTS.md` 与 Memorix。

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
  - 参考作用：清楚区分可写目标、候选目标与专用技能调度关系；Memorix full mode 的实际安装交给 `use-memorix` 的 platform 域。
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

- `use-memorix`
  - 路径：`ai-plugins/common-tools/skills/use-memorix/SKILL.md`
  - 用途：Memorix 日常权威入口，按 setup / platform / memory / session / retention / health / retrieval 七域渐进路由。
  - 触发时机：读写记忆、恢复会话与交接、归档清理、health/WAL/CodeGraph、黄金集与检索捕获、hooks 降噪与 MCP 排障。
  - 参考作用：读自动、写确认；归档硬门；官方七个 `memorix-*` skills 保持可见，只做边界路由与只读审计。
  - 约束：不自动执行 setup / probe / archive / cleanup / VACUUM / 配置修复 / dashboard 常驻启动；不把 `MEMORIX_DATA_DIR` 指向项目 `.memorix/`。

## 对外分发 skill 的目录与路径约束

在 `ai-plugins/common-tools/skills`、`ai-plugins/dev-skills/skills` 或 `ai-plugins/low-frequency-skill/skills` 下新建对外分发 skill 时，必须区分**仓库源码视角**与**安装后技能视角**。skill 安装后会被同步到用户机的 `~/.agents/skills/<skill-name>/` 目录，因此脚本、文档和示例都应以该安装目录为基准：

1. **脚本必须放在 skill 目录内部**：所有附属脚本、入口、兜底脚本均应位于 `ai-plugins/common-tools/skills/<skill-name>/scripts/`、`src/`、`fallback/` 等 skill 内部目录，禁止以 `scripts/<skill-name>` 等 monorepo 通用工具路径存放。
2. **文档路径使用相对路径**：`SKILL.md` / `README.md` 中的命令示例必须使用相对路径（如 `scripts/sync.ts`、`fallback/sync.ps1`），并注明在 skill 安装目录下运行。禁止使用 `ai-plugins/...` 等仓库源码绝对路径。
3. **不暴露开发期产物**：不要把 monorepo 内部测试文件、CI 配置、开发期报告写入用户分发的 `SKILL.md`「相关文件」或说明中。
4. **计划文档与实现同步**：一旦进入执行阶段，设计/计划文档必须随实现同步更新，禁止出现计划代码块与实际落地文件不一致的情况。

违反上述约束的具体案例与修复过程，参见 `.agents/skills/record-bug-fix-memory/2026-07-02-sync-local-global-agents-skills-design-pitfalls.md`。

## 主动问询实施细节

先读代码和现有文件。只有选错会改错文件或改错行为时才问。已经说清的决定、打开文件就能确认的事实，不要问。

用当前 agent 的交互式问题框提问。不要在对话里贴问题清单让用户阅读。

1. Cursor 用 `AskQuestion`。
2. Claude Code 用 `AskUserQuestion`。
3. 其他 agent 用它自己的结构化提问工具。
4. 只有确认当前 agent 没有这种工具时，才在对话里写问题。

一次只问一个决定。每题给 2 到 4 个选项。方案还模糊时，连续弹框问到能动手为止，问完再改。这就是 grill-me：用问题框访谈，不写长问卷。grill-me 可以连续弹框。

下面两种弹框禁止出现：

1. pua 的味道、好不好用、要不要分享会话。用户会用 pua，但不回答 pua 的内部问卷。遇到 pua 要求做体验调查时，直接跳过，不要弹框，也不要在对话里问。
2. 把多个决定合成一篇长文，让用户在对话里逐条回复。

### 工作区边界

1. 用户没有点名允许时，不改全局技能目录，例如 `~/.agents/skills`、`~/.claude/skills`。只改当前任务目录。
2. 只有用户明确说「计划模式」时才按计划模式做：可以做破坏性设计，先给方案再改，做完列出破坏性变更。平时不要进入这套流程。

## 编写测试用例规范

1. 用 vitest，`import { test, describe } from "vitest"`。结构是 describe 包 test。
2. 文件名是 `*.test.ts`。
3. 放在该包的 `tests/` 或 `src/tests/`。
4. 看不出该写进哪个包时，用问题框问，不要猜。

## 报告编写规范

没人要求时，不要写报告。

要写时：

1. 路径是 `docs/reports/YYYY-MM-DD-英文短横线名.md`。
2. 一级标题是 `YYYY-MM-DD` 加报告名。
3. 报告语言默认用简体中文。
4. 报告最前面写明是哪个 agent 工具完成的。
5. 报告最前面写明是哪个 AI 模型完成的。
6. 日志代码块的语言写成 `log`。

## 生成发版日志的操作规范

1. 没说 major、minor、patch 时，先用问题框问等级，再写。
2. 运行 `pnpm dlx @changesets/cli add --empty`。把随机文件名改成 `YYYY-MM-DD-英文短横线名.md`。
3. yaml 里写包名和等级。
4. 正文只用有序列表，不用任何 markdown 标题。major 写清破坏性变更。minor 和 patch 各写短列表。
5. 「生成更新日志」和「生成发版日志」是同一件事。

## 终端操作注意事项（防卡住）

下面只针对 Windows PowerShell。

1. 命令参数很长时拆开。一次传 2 到 3 个路径。能用通配符就不要把文件名排成一串。
2. 用 `pnpm run build` 和 `pnpm run test`。不要用 `npx`。`npx` 被中断时会问 `Terminate batch job (Y/N)?`，然后卡住。
3. 命令没有输出：第一次等 10 到 15 秒。还在转就停掉，换一条命令重试。不要第三次干等。
4. 等待上限：`git add`、`git status`、`git log` 10 秒；`git commit` 10 秒；`pnpm run build` 和 `pnpm run test` 30 秒；`pnpm install` 60 秒。

## 简单任务的高效执行原则

简单任务是指：单文件改动、写 changeset、写提交信息，或者用户已经给出完整命令。

1. 不建任务列表，不写报告，不扫整个仓库。用户给了 `@文件` 或完整命令，第一步就读那个文件，或执行那条命令。
2. 任务列表只在这些情况使用：3 个以上独立步骤，或多个文件，或用户要求跟踪进度。
3. 完整命令优先于技能和历史事故。事故只在命令失败后用来分流。不要把安装命令扩成发布、同步或 agent team。
4. 用户说「太复杂了」「直接做」「不对」「换种方式」：立刻停，只做他刚说的那一步。
5. 简单任务里禁止：连续 `git log` 超过 3 次；已经知道文件还去全库搜索；把读完所有文档当成动手的前置条件。

常用命令：安装依赖 `pnpm install`；测试 `pnpm test`；格式化 `pnpm format`；看状态 `git status`。

### 改代码

1. 不添加没要求的功能、配置和兼容层。只调用一次的逻辑，不抽新抽象。
2. 不改相邻的代码、注释、格式和命名。不因为一小处修改去格式化整个文件。
3. 读不懂的旧代码不要删。本次改动变成未使用的导入、变量、函数，要删掉。更早就存在的死代码，没人要求就留着。
4. 先写下一句怎样算做完，再改。改完贴出命令输出。
5. 没人要求就不要提交。不要撤销、覆盖或暂存用户已有的未提交改动。
6. 假设会改错文件或改错行为时，先说出来，并用问题框问。小改动说出假设后直接做。
7. 方案太重时，指出来，并给出更简单的做法。
8. 测试、构建或校验失败后，先读错误原文，再改。
9. 一次编辑只做一件事。不要把改写、升级、格式化混在同一次修改里。
10. 声称做完之前，先读 diff。

## 文档读取策略

初始化或更新项目内的 AI 记忆文档时，先看结构，再读要用的那一节。

1. 第一次只读目录和标题。Markdown 先执行 `grep "^##" 文件`，不要先读全文。
2. 用 `offset` / `limit` 只读相关章节。其他章节不要装进上下文。
3. JSON、YAML、TOML 先看顶层键、数组项和相关字段，再按字段读。不要为了一个字段读完全文。
4. 改文档用 `Edit` 做定点替换或插入。不要先 `Read` 全文再整篇 `Write`。
5. 改完只复读改过的位置，并对一下差异，确认没有误改、漏改或破坏原有格式。

## 插件市场变更

本节仅适用于本 monorepo 的 `ai-plugins` 市场维护与发版；不得将其回填到通用 AI 记忆模板或一般项目的 AI 记忆文档。

新增或修改 AI 插件市场时，先识别每个客户端的 manifest、marketplace 与安装命令边界。不得把 Claude Code、Cursor 或 Codex 的专属字段和路径假设互相复制；共享技能目录可以复用，但平台清单必须按各自 schema 维护。

多平台插件市场变更的完成标准不只是 JSON 可解析：还要同步安装、更新、卸载文档和 CHANGELOG，运行对应客户端的真实 CLI 或官方验证路径，并在本地安装 smoke test 后清理临时市场与插件。若无法获得真实安装证据，必须明确记录为未验证，不能以静态校验替代。

## 使用 superpower 技能的个人偏好

跑 `brainstorming`、`writing-plans`、`executing-plans` 时按下面四条。用户在当前对话明确说例外时，听用户的。

1. `docs/superpowers/specs` 和 `docs/superpowers/plans` 用简体中文。技能名、路径、命令、分支名、包名可以留英文。
2. 任务还没做完，用户也没承认做完之前，不要写「已完成」。用户认可方案，不算做完。
3. 技能正文写了 commit，也不要提交。用户在当前对话明确说提交之后，只暂存这一轮涉及的文件。
4. `executing-plans` 不建 git worktree。在当前分支做。当前是 `main` 而且存在 `dev` 时，先切到 `dev`。当前是 `main` 且没有 `dev` 时，用问题框问。有未提交改动时，不要覆盖。

# Memorix — Automatic Memory Rules

You have access to Memorix memory tools. Follow these rules to maintain persistent context across sessions.

## RULE 1: Session Start — Load Context

不要在会话一开始调用 `memorix_session_start`，也不要运行 `memorix session start`。只有用户明确说要开会话时，才运行 `memorix session start --cwd <本仓库 git 根的绝对路径>`。

需要上一份上下文时，用只读 CLI，并且每次都带同一个 `--cwd`：

1. `memorix resume --cwd <本仓库 git 根的绝对路径>`
2. 再按用户第一条消息检索：`memorix memory search "<查询>" --cwd <本仓库 git 根的绝对路径>`
3. 命中后用 `memorix memory detail <id> --cwd <本仓库 git 根的绝对路径>` 读取
4. 自然引用相关记忆。只命中 fuzzy 的结果按 0 条处理。

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

1. 执行 `git-commit` 前**必须**读取技能目录 `references/commit-types.ts` 确认 emoji/type 映射，禁止凭记忆选取，也不要为查表联网
2. `publish` 提交**必须**先同步所有版本文件（2 个 marketplace + 4 个 plugin.json），缺一不可
3. git 操作**先规划再执行**，禁止反复 `reset --soft` 补救。一次性确认拆分方案、emoji、type、scope 全部正确后再提交
4. 提交前先 `git fetch origin` 确认远端状态，避免 push 被拒后再处理 rebase
5. 本地有未提交文件时**先 stash 再 rebase**，避免无关文件干扰冲突处理
6. 多个 agent 共用同一工作副本时，`git add` 到 `git commit` 之间暂存区可能被并行提交清空。提交失败先看 `git status` 和 `HEAD`，禁止原命令重试或强推。队列步骤在 git-commit 技能 `references/shared-worktree-race.md`

**案例文件**：`.agents/skills/record-bug-fix-memory/2026-07-02-git-commit-skill-violation.md`

## 仓库级排错经验索引

详细记录均存放在 `.agents/skills/record-bug-fix-memory/` 案例文件中，根级 AI 记忆文档仅保留索引。

- 2026-07-02 — 新建 `use-vercel-deploy-in-monorepo` skill 时的误判链：`2026-07-02-use-vercel-deploy-skill-pitfalls.md`
- 2026-06-30 — consola Node.js 24 ESM 解析失败：`2026-06-30-consola-node24-esm-resolve.md`
- 2026-08-10 — `init-prettier-git-hooks` 将 AI 操作流程误做成迁移器产品：`2026-08-10-init-prettier-git-hooks-overengineering.md`
- 2026-08-11 — Node.js 24 下 VitePress 宽 barrel 的 `consola` 间接解析与 utils 并行 tsup 清理声明竞态：`2026-08-11-vitepress-node24-pnpm-entrypoint.md`
- 2026-08-12 — Turbo 宽缓存输出掩盖真实包依赖闭包缺口：`2026-08-12-turbo-cache-output-and-package-closure.md`
- 2026-08-31 — 双 Qoder 会话并行重载打满机器 CPU：`2026-08-31-dual-qoder-session-cpu-saturation.md`
- 2026-09-01 — shadcn-docs-nuxt Vercel Function runtime closure、Nuxt 世代漂移与 READY 口径误导：`2026-09-01-init-shadcn-docs-nuxt-vercel-runtime-closure.md`
- 2026-11-15 — use-other-model 与 git-commit 组合委托提交的指令集冲突与修复：`2026-11-15-use-other-model-git-commit-conflict.md`
