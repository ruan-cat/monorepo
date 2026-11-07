# record-bug-fix-memory 部署路径压平 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `record-bug-fix-memory` 的项目级部署位置改成 `.agents/skills/record-bug-fix-memory/SKILL.md`，并让 `init-ai-md` 会搬迁旧的嵌套目录。

**Architecture:** 技能行为只改 `init-ai-md` 与 `init-linux-cloud-agent-env` 的说明和模板。已有仓库由执行代理按同一套剪切规则直接改文件。插件版本用 `release-ai-plugins` 升到 `13.0.0`。本规格目录不参与路径替换。

**Tech Stack:** Markdown 技能、`release-ai-plugins`、`git-commit` 的 `commit-types.ts`、PowerShell 与 `git`。

**Spec:** `docs/prompts/release-ai-plugins/2026-11-7-init-ai-md-with-new-local-skills/spec.md`

## Global Constraints

- 新部署路径是 `.agents/skills/record-bug-fix-memory/SKILL.md`。
- 模板 `template-version` 维持 `"2.0.0"`。`init-ai-md` 的 `metadata.version` 升到 `24.0.0`。插件系统升到 `13.0.0`。`init-linux-cloud-agent-env` 升到 `0.1.2`。
- 不把 `init-ai-md/templates/record-bug-fix-memory` 移出 `templates`。
- 不改 `shadcn-docs-nuxt-production-repro` 的 `.worktrees/r22` 与 `.worktrees/r32`。
- 不替换本规格目录里的旧路径字符串。
- 不手改 `C:\Users\pc\.agents\skills`。
- 同名 Markdown 以扁平目录、其次 `.agents` 嵌套目录为准。非 Markdown 不改。软链接停下来报告。
- 同一文件混有无关未提交修改时，该仓库停下来报告。
- 审过本计划和规格之前，不执行下面的任务。

## Review Focus

- 已部署副本的 `template-version` 已是 `2.0.0` 时，嵌套目录仍要搬。验收看步骤 5 的文字，不再把「已是最新」写成跳过搬迁。
- 模板目录名也叫 `record-bug-fix-memory`。验收看它仍在 `templates` 下。
- 本规格目录里保留旧路径，供搜索。验收时排除这个目录。
- `resume` 同时有两套旧目录。验收看扁平目录保留 `.agents` 侧同名文件，`.claude` 侧只补缺失文件。
- `01s-11comm` 有根目录和 `apps\app` 两份。验收看两份都到各自的 `.agents/skills/record-bug-fix-memory/`。

---

### Task 1: 改写 init-ai-md 的部署与搬迁

**Files:**

- Modify: `ai-plugins/common-tools/skills/init-ai-md/SKILL.md`
- Modify: `ai-plugins/common-tools/skills/init-ai-md/references/step-details.md`
- Modify: `ai-plugins/common-tools/skills/init-ai-md/references/execution-examples.md`

**Interfaces:**

- Consumes: 规格里的判断顺序和四段替换表。
- Produces: 步骤 5 以扁平目录为唯一安装目标；`[已是最新]` 不再跳过目录搬迁。

- [ ] **Step 1: 改步骤 5**

把新部署、检测和五种情况的目标路径改成 `.agents/skills/record-bug-fix-memory/`。保留情况 C 的内嵌案例拆分。删除「版本大于或等于 2.0.0 就视为目录已完成」的跳过逻辑。情况 E 只跳过正文替换。旧目录剪切、同名保留、非 Markdown 报告、空目录删除，按规格的判断顺序写进步骤 5。

- [ ] **Step 2: 改引用文档里的目标路径**

`references/step-details.md` 与 `references/execution-examples.md` 里的部署示例改为扁平路径。`template-version: 2.0.0` 这句保留。

- [ ] **Step 3: 搜索技能正文**

Run:

```powershell
rg -n "skills/fix-bug/record-bug-fix-memory|skills\\fix-bug\\record-bug-fix-memory" ai-plugins/common-tools/skills/init-ai-md/SKILL.md ai-plugins/common-tools/skills/init-ai-md/references
```

Expected: 无命中。

### Task 2: 改模板和云环境技能里的阅读路径

**Files:**

- Modify: `ai-plugins/common-tools/skills/init-ai-md/templates/record-bug-fix-memory/SKILL.md`
- Modify: `ai-plugins/common-tools/skills/init-ai-md/templates/08.本项目的技能表.md`
- Modify: `ai-plugins/common-tools/skills/init-linux-cloud-agent-env/SKILL.md`

**Interfaces:**

- Consumes: Task 1 的扁平路径。
- Produces: 新项目复制出去的模板和云环境阅读说明都指向扁平路径。

- [ ] **Step 1: 改两份模板**

`templates/record-bug-fix-memory/SKILL.md` 第 37 行和第 201 行改为 `.agents/skills/record-bug-fix-memory/`。frontmatter 的 `template-version` 仍是 `"2.0.0"`。`templates/08.本项目的技能表.md` 的路径改为 `.agents/skills/record-bug-fix-memory/SKILL.md`。

- [ ] **Step 2: 改云环境技能**

`init-linux-cloud-agent-env/SKILL.md` 第 53–54 行改为：

```markdown
`.agents\skills\record-bug-fix-memory\SKILL.md`
`.agents\skills\record-bug-fix-memory`
```

- [ ] **Step 3: 确认模板目录还在**

Run:

```powershell
Test-Path ai-plugins/common-tools/skills/init-ai-md/templates/record-bug-fix-memory/SKILL.md
```

Expected: `True`。

### Task 3: 升起技能版本和插件版本

这个任务由 Task 5 第 4 步调用。技能说明的 `feat` 提交完成之前，不要运行发版脚本。

**Files:**

- Modify: `init-ai-md` 与 `init-linux-cloud-agent-env` 的 frontmatter，以及 `release-ai-plugins` 负责的九个 `plugin.json`、两个带版本 marketplace、三个插件 CHANGELOG。

**Interfaces:**

- Consumes: Task 1 和 Task 2 的文件改动。
- Produces: `init-ai-md` `24.0.0`，`init-linux-cloud-agent-env` `0.1.2`，插件 `13.0.0`。

- [ ] **Step 1: 按 release-ai-plugins 发版**

先读 `release-ai-plugins` 技能。对 `init-ai-md` 使用 `-ChangeType major`、`-Version 13.0.0`。对 `init-linux-cloud-agent-env` 使用 `-ChangeType patch`。一次 registry Apply 之前完成两个技能的版本升级。不要顺手升级其他技能。

- [ ] **Step 2: 核对版本**

Run:

```powershell
rg -n "version: \"24.0.0\"" ai-plugins/common-tools/skills/init-ai-md/SKILL.md
rg -n "version: \"0.1.2\"" ai-plugins/common-tools/skills/init-linux-cloud-agent-env/SKILL.md
rg -n "\"version\": \"13.0.0\"" ai-plugins/common-tools/.claude-plugin/plugin.json
```

Expected: 三处都有命中。`templates/record-bug-fix-memory/SKILL.md` 仍是 `template-version: "2.0.0"`。

### Task 4: 搬迁本仓库已部署副本并替换 Markdown

**Files:**

- Move: `.agents/skills/fix-bug/record-bug-fix-memory/` 到 `.agents/skills/record-bug-fix-memory/`
- Modify: 本仓库里除本规格目录以外、含四段旧路径的 Markdown。已知命中包括 `AGENTS.md`、`ai-plugins/common-tools/CHANGELOG.md`、`docs/reports/2026-09-05-agent-browser-usage-experience-survey.md`、`docs/prompts/release-ai-plugins/01.md`、`index.md`，以及 `docs/superpowers` 下四份 2026-04-19 与 2026-08 的 spec/plan。`docs/prompts/release-ai-plugins/02.md` 已有无关未提交修改，不纳入这次提交。

**Interfaces:**

- Consumes: 规格里的四段替换表。
- Produces: 本仓库项目副本位于扁平目录。规格目录里的旧字符串还在。

- [ ] **Step 1: 移动目录**

把 `.agents/skills/fix-bug/record-bug-fix-memory` 整个目录移到 `.agents/skills/record-bug-fix-memory`。`fix-bug` 若变空则删除。不要移动 `templates/record-bug-fix-memory`。

- [ ] **Step 2: 替换四段路径**

在本仓库 Markdown 中按规格替换表替换。排除 `docs/prompts/release-ai-plugins/2026-11-7-init-ai-md-with-new-local-skills/`。`ai-plugins/common-tools/CHANGELOG.md` 先不改，留到 Task 5 的 `publish` 提交，和发版脚本追加的新条目放在同一次提交。`docs/prompts/release-ai-plugins/02.md` 已有无关修改，跳过并写入报告。

- [ ] **Step 3: 验收搜索**

Run:

```powershell
rg -n "skills/fix-bug/record-bug-fix-memory|skills\\fix-bug\\record-bug-fix-memory" -g "*.md" -g "!docs/prompts/release-ai-plugins/2026-11-7-init-ai-md-with-new-local-skills/**"
```

Expected: 无命中。再在本规格目录内搜索同一模式，Expected: 仍有命中。

### Task 5: 分四次提交并推送 monorepo

**Files:**

- 只暂存对应类别的文件。规格目录、技能说明与模板、扁平后的 `.agents/skills/record-bug-fix-memory` 与其余 Markdown、发版 JSON 与 CHANGELOG 分开提交。

**Interfaces:**

- Consumes: Task 1 至 Task 4 的工作区改动。
- Produces: 当前分支上的四次提交，并推送到远端。

- [ ] **Step 1: 提交规格**

```text
📃 docs(prompts): 记录 record-bug-fix-memory 扁平部署合同
```

- [ ] **Step 2: 提交技能行为**

这一提交发生在发版脚本改版本号之前。暂存两份技能的说明、引用和模板，不暂存 `plugin.json` 和 `CHANGELOG.md`。

```text
✨ feat(init-ai-md)!: 将 record-bug-fix-memory 部署到扁平技能目录

BREAKING CHANGE: 项目级技能从 .agents/skills/fix-bug/record-bug-fix-memory 迁到 .agents/skills/record-bug-fix-memory。版本号大于或等于 2.0.0 时仍会搬迁嵌套目录，不再因此替换技能正文。
```

- [ ] **Step 3: 提交本仓库路径搬迁**

```text
🦄 refactor(agents): 将本仓库 record-bug-fix-memory 挪到扁平目录
```

- [ ] **Step 4: 提交插件版本**

先跑 Task 3 的发版脚本，再把 `CHANGELOG.md` 里的四段旧路径按规格替换。版本号、marketplace 和这份 `CHANGELOG.md` 放进同一次提交。

```text
📢 publish(ai-plugins): 发布 13.0.0
```

正文用有序序号说明 `common-tools` 的部署路径合同变更。按发版日志规范，不使用 Markdown 标题。

- [ ] **Step 5: 推送并看工作流**

推送当前分支。用 `gh` 查看这次 push 触发的工作流。有明显失败就停，不安装全局技能。没有明显失败时运行：

```powershell
skills add https://github.com/ruan-cat/monorepo/tree/dev/ai-plugins/dev-skills/skills --skill "*" -g -y -a claude-code -a codex
skills add https://github.com/ruan-cat/monorepo/tree/dev/ai-plugins/common-tools/skills --skill "*" -g -y -a claude-code -a codex
```

### Task 6: 搬迁其余本地仓库

**Files:**

- 规格扫描表里的每个仓库。`monorepo` 已由 Task 4 处理。跳过两个 worktree。

**Interfaces:**

- Consumes: 规格里的剪切规则和统一提交说明。
- Produces: 每个仓库一条提交并 push 当前分支。脏文件冲突和非 Markdown 残留写入报告。

- [ ] **Step 1: 每个仓库先看状态**

在仓库根运行 `git status --porcelain` 和 `git branch --show-current`。要改的文件已经有无关修改时，跳过该仓库并记录路径。没有 `.git` 时只改文件并记录。

- [ ] **Step 2: 剪切**

目录是软链接时停下来并记录，不搬。其余按规格判断顺序把 Markdown 剪切到该项目的 `.agents/skills/record-bug-fix-memory/`。`01s-11comm` 处理根目录和 `apps\app` 两处。`resume` 以 `.agents` 嵌套目录的同名文件为准。然后替换该仓库 Markdown 里的四段旧路径。跳过 `.worktrees/r22` 和 `.worktrees/r32`。

- [ ] **Step 3: 提交并推送**

每个仓库一条提交：

```text
🦄 refactor(skills): 将 record-bug-fix-memory 挪到扁平技能目录
```

然后 `git push` 当前分支。当前分支是 main 或 dev 都推。不另开 PR。

- [ ] **Step 4: 汇总**

列出已推送仓库、因脏文件跳过的仓库、因非 Markdown 保留旧目录的路径、以及两个未改的 worktree。
