<!-- 已完成 -->

# Release AI Plugins Cutover Dual Root Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将仓库局部技能 `.claude/skills/release-ai-plugins` 剪切迁移为 `ai-plugins/common-tools/skills/release-ai-plugins` 的唯一真实来源，并把仓库的技能发现逻辑、AI 记忆文档和 `common-tools` 对外说明升级为“双根感知”模型。整个任务直接在当前 `dev` 分支内完成，不使用 `git worktree`，且不保留旧路径 shim。
**Architecture:** 技能来源采用双根模型：项目局部技能继续留在 `.claude/skills/**/SKILL.md`，对外分发技能位于 `ai-plugins/*/skills/**/SKILL.md`。`release-ai-plugins` 迁入 `common-tools` 后，根级 AI 记忆文档按“项目局部技能 / 对外分发技能”双分组呈现；`init-ai-md` 明确区分“本地内置技能部署”和“技能表双根扫描”两套逻辑；`common-tools` 文档只登记新的真实来源，不同步触碰 marketplace/plugin manifest 版本号。
**Tech Stack:** Markdown, YAML frontmatter, PowerShell, `rg`, `git`, `pnpm exec prettier`

---

## File Structure

- `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`
  - 新的唯一真实来源；从旧 skill 剪切迁移而来，并升级 `metadata.version`
- `.claude/skills/release-ai-plugins/SKILL.md`
  - 旧来源；在所有引用更新完成后删除整个目录
- `CLAUDE.md`
  - 根级 AI 记忆文档；改为双根总述和双分组技能表
- `AGENTS.md`
  - 根级 AI 记忆文档；内容与 `CLAUDE.md` 对齐
- `GEMINI.md`
  - 根级 AI 记忆文档；内容与 `CLAUDE.md` 对齐
- `ai-plugins/common-tools/skills/init-ai-md/SKILL.md`
  - 将技能表发现逻辑从单根 `.claude/skills` 升级为双根扫描
- `ai-plugins/common-tools/skills/init-ai-md/templates/08.本项目的技能表.md`
  - 将技能表模板升级为双分组、真实路径回填
- `ai-plugins/common-tools/README.md`
  - 将 `release-ai-plugins` 正式登记进 common-tools 的 skills 列表和目录树
- `ai-plugins/common-tools/CHANGELOG.md`
  - 新增 `Unreleased` 记录本次未发版的结构迁移，不修改已发布版本节

## Constraints And Non-Goals

- 只保留 `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md` 一份真实来源。
- 删除 `.claude/skills/release-ai-plugins/` 后，不新增 shim、转发壳或兼容副本。
- 本次不修改以下文件的版本号或 manifest 内容：
  - `.claude-plugin/marketplace.json`
  - `.cursor-plugin/marketplace.json`
  - `ai-plugins/common-tools/.claude-plugin/plugin.json`
  - `ai-plugins/common-tools/.cursor-plugin/plugin.json`
- 本次不改 `pnpm-workspace.yaml`、根 `package.json`、`tsconfig`。
- `docs/plan/**`、`docs/reports/**`、`docs/prompts/release-ai-plugins/**` 中带历史路径的内容默认视为历史快照，不做批量重写；只有当前实施文件和根级 AI 记忆文档必须反映新结构。

## Task 1: Cut Over The Skill Source Into `common-tools`

**Files:**

- Create: `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`
- Keep temporarily: `.claude/skills/release-ai-plugins/SKILL.md`

- [ ] **Step 1: Copy the old skill into the new common-tools location**

Create `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md` by moving the content from `.claude/skills/release-ai-plugins/SKILL.md`.

Required frontmatter changes:

```yaml
---
name: release-ai-plugins
description: 管理 ai-plugins 多插件与多平台（Claude/Cursor）插件商城的版本升级，包括同步 marketplace/plugin 版本号、校验路径、维护更新日志与文档安装链接。在用户要求升级插件版本、发布插件、更新插件商城或更新日志时使用。触发关键词：release-ai-plugins、ai-plugins、插件升级、版本更新、发布插件、更新日志、cursor-plugin。
metadata:
  version: "0.16.0"
---
```

Required body edits:

- 保留原有技能职责、版本策略、README/CHANGELOG 维护规范。
- 删除任何暗示它仍属于“项目局部 skill”的语气。
- 在开头说明它现在是 `common-tools` 的对外分发 skill，真实路径为 `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`。

- [ ] **Step 2: Verify the new skill exists and the old source is still present before cleanup**

Run:

```powershell
Test-Path ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md
Test-Path .claude/skills/release-ai-plugins/SKILL.md
rg -n '^metadata:|version: "0.16.0"|common-tools' ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md
```

Expected:

- Both `Test-Path` commands print `True`.
- `rg` prints the new `0.16.0` line and at least one body line mentioning `common-tools`.

- [ ] **Checkpoint commit: record the source cutover only**

If committing during execution, use:

```bash
git add ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md
git commit -m "feat(ai-plugins): cut release-ai-plugins into common-tools"
```

Expected:

- The commit contains only the new `common-tools` skill file.

## Task 2: Rewrite Root AI Memory Docs For Dual-Root Awareness

**Files:**

- Modify: `CLAUDE.md`
- Modify: `AGENTS.md`
- Modify: `GEMINI.md`

- [ ] **Step 1: Replace the single-root overview with a dual-root overview**

In each file, replace the existing paragraph:

```md
本仓库在 `.claude/skills/` 下维护 Claude Code 技能。
```

with wording equivalent to:

```md
本仓库同时维护两类技能来源：项目局部技能位于 `.claude/skills/`，对外分发技能位于 `ai-plugins/*/skills/`。**经验教训、事故复盘、根级 AI 记忆与 Memorix 同步**请优先使用 `record-bug-fix-memory`；其余按场景选用。
```

- [ ] **Step 2: Split `本项目的技能表` into two sections**

In each file, change the current flat skill list into this structure:

```md
## 本项目的技能表

### 项目局部技能（仓库内维护）

- `record-bug-fix-memory`
  - 路径：`.claude/skills/fix-bug/record-bug-fix-memory/SKILL.md`
  - ...

### 对外分发技能（ai-plugins）

- `release-ai-plugins`
  - 路径：`ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`
  - 用途：管理 `ai-plugins` 多插件与多平台（Claude/Cursor）插件商城版本与文档链接。
  - 触发时机：插件版本升级、发版、更新 marketplace 或安装文档时。
  - 参考作用：与 `ai-plugins/common-tools` 下的 skills 树、README、CHANGELOG 保持一致。
  - 约束：同步版本号与变更路径，避免漏改子包；不再从 `.claude/skills/release-ai-plugins` 读取真实来源。
```

Rules:

- `.claude/skills/**` 的条目只能留在“项目局部技能”组。
- `ai-plugins/*/skills/**` 的条目只能出现在“对外分发技能”组。
- `release-ai-plugins` 必须只出现一次，并且只能出现在“对外分发技能”组。

- [ ] **Step 3: Verify all three AI memory docs are aligned**

Run:

```bash
rg -n "本仓库同时维护两类技能来源|### 项目局部技能（仓库内维护）|### 对外分发技能（ai-plugins）|ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md" CLAUDE.md AGENTS.md GEMINI.md
rg -n "\.claude/skills/release-ai-plugins/SKILL.md" CLAUDE.md AGENTS.md GEMINI.md
```

Expected:

- The first `rg` prints matching lines from all three files.
- The second `rg` prints nothing.

- [ ] **Checkpoint commit: capture the root memory-doc rewrite**

If committing during execution, use:

```bash
git add CLAUDE.md AGENTS.md GEMINI.md
git commit -m "docs(ai): teach root memory docs dual skill roots"
```

Expected:

- The commit contains only the three root AI memory docs.

## Task 3: Upgrade `init-ai-md` From Single Root To Dual Root

**Files:**

- Modify: `ai-plugins/common-tools/skills/init-ai-md/SKILL.md`
- Modify: `ai-plugins/common-tools/skills/init-ai-md/templates/08.本项目的技能表.md`

- [ ] **Step 1: Rewrite the skill doc so deployment and scanning are explicitly separated**

In `ai-plugins/common-tools/skills/init-ai-md/SKILL.md`, keep “本地内置技能部署”指向 `.claude/skills/`，但把“技能表管理/扫描”改成双根规则。

The final document must clearly contain both statements:

```md
- 本地内置技能部署：继续写入 `.claude/skills/`
- 技能表扫描：同时扫描 `.claude/skills/**/SKILL.md` 与 `ai-plugins/*/skills/**/SKILL.md`
```

Also update every place that currently says “扫描 `.claude/skills/` 生成技能表” to wording equivalent to:

```md
收集技能表时，按真实来源扫描两类技能：

1. 项目局部技能：`.claude/skills/**/SKILL.md`
2. 对外分发技能：`ai-plugins/*/skills/**/SKILL.md`
```

- [ ] **Step 2: Replace the skill-table template with a dual-group template**

Update `ai-plugins/common-tools/skills/init-ai-md/templates/08.本项目的技能表.md` so it no longer hardcodes `.claude/skills/...` as the only path shape.

The template must include this exact top-level structure:

```md
## 本项目的技能表

### 项目局部技能（仓库内维护）

### 对外分发技能（ai-plugins）
```

Rules for the template:

- Each entry’s `路径` field must be the real scanned relative path.
- The template text must say that entries are grouped by path prefix.
- The `release-ai-plugins` example, if one is retained, must point to `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`.

- [ ] **Step 3: Verify no single-root wording remains in `init-ai-md`**

Run:

```bash
rg -n "扫描 `?\\.claude/skills/?`? 生成技能表|仅扫描 \\.claude/skills|双根|ai-plugins/\\*/skills" ai-plugins/common-tools/skills/init-ai-md/SKILL.md ai-plugins/common-tools/skills/init-ai-md/templates/08.本项目的技能表.md
```

Expected:

- The output includes dual-root wording.
- Any remaining `.claude/skills` mentions are limited to local built-in skill deployment, not the skill-table scan.

- [ ] **Checkpoint commit: capture the discovery-logic upgrade**

If committing during execution, use:

```bash
git add ai-plugins/common-tools/skills/init-ai-md/SKILL.md ai-plugins/common-tools/skills/init-ai-md/templates/08.本项目的技能表.md
git commit -m "feat(init-ai-md): support dual-root skill discovery"
```

Expected:

- The commit contains only `init-ai-md` documentation/template changes.

## Task 4: Register The Distributed Skill In `common-tools` Docs

**Files:**

- Modify: `ai-plugins/common-tools/README.md`
- Modify: `ai-plugins/common-tools/CHANGELOG.md`

- [ ] **Step 1: Add `release-ai-plugins` to the README skills list**

In `ai-plugins/common-tools/README.md`, add one new skill bullet near the existing skills list:

```md
- **release-ai-plugins**: 管理 `ai-plugins` 多插件与多平台（Claude/Cursor）插件商城版本与文档链接，负责版本同步、清单校验、更新日志与安装文档一致性。
```

- [ ] **Step 2: Add the skill to the README directory tree**

In the directory tree section, insert:

```text
skills/
  release-ai-plugins/
    SKILL.md
```

Place it in alphabetical order with the surrounding skills.

- [ ] **Step 3: Record the migration in the changelog without inventing a release**

At the top of `ai-plugins/common-tools/CHANGELOG.md`, insert:

```md
## [Unreleased]

### Changed

- **release-ai-plugins**（`metadata.version` `0.15.1` -> `0.16.0`）：从 `.claude/skills/release-ai-plugins/` 剪切迁移到 `ai-plugins/common-tools/skills/release-ai-plugins/`，将 `common-tools` 设为唯一真实来源。
- **init-ai-md**：技能表发现逻辑从单根 `.claude/skills/**/SKILL.md` 升级为双根扫描，显式区分项目局部技能与对外分发技能。
- 根级 AI 记忆文档：`CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 改为双根说明与双分组技能表，不再把 `release-ai-plugins` 记为仓库局部技能。
```

Rules:

- 不修改已发布版本节标题。
- 不同步修改 README 的插件版本展示。
- `Unreleased` 只记录这次迁移带来的真实结构变化。

- [ ] **Step 4: Verify the README and changelog both expose the new source**

Run:

```bash
rg -n "release-ai-plugins|Unreleased|双根|common-tools" ai-plugins/common-tools/README.md ai-plugins/common-tools/CHANGELOG.md
```

Expected:

- `README.md` prints the new skill bullet and directory tree lines.
- `CHANGELOG.md` prints the new `Unreleased` section and the migration bullets.

- [ ] **Checkpoint commit: capture the common-tools documentation updates**

If committing during execution, use:

```bash
git add ai-plugins/common-tools/README.md ai-plugins/common-tools/CHANGELOG.md
git commit -m "docs(common-tools): register release-ai-plugins cutover"
```

Expected:

- The commit contains only the `common-tools` docs updates.

## Task 5: Remove The Old `.claude` Skill Directory

**Files:**

- Delete: `.claude/skills/release-ai-plugins/SKILL.md`
- Delete: `.claude/skills/release-ai-plugins/`

- [ ] **Step 1: Delete the old directory only after all references are updated**

Delete the old skill directory:

```powershell
Remove-Item -LiteralPath .claude/skills/release-ai-plugins -Recurse -Force
```

Expected:

- The directory no longer exists.

- [ ] **Step 2: Verify the old directory is gone and the new source remains**

Run:

```powershell
Test-Path .claude/skills/release-ai-plugins
Test-Path ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md
```

Expected:

- The first command prints `False`.
- The second command prints `True`.

- [ ] **Checkpoint commit: record the destructive cleanup separately**

If committing during execution, use:

```bash
git add -A .claude/skills/release-ai-plugins ai-plugins/common-tools/skills/release-ai-plugins
git commit -m "refactor(skills): remove local release-ai-plugins source"
```

Expected:

- The commit shows the old `.claude` path deleted and the `common-tools` path retained.

## Task 6: Run Final Verification And Residual Search

**Files:**

- Verify: all files changed in Tasks 1-5

- [ ] **Step 1: Search for live references to the deleted real source**

Run:

```bash
rg -n "\.claude/skills/release-ai-plugins/SKILL.md|\.claude/skills/release-ai-plugins" CLAUDE.md AGENTS.md GEMINI.md ai-plugins/common-tools .claude
```

Expected:

- No matches in root AI memory docs or `common-tools`.
- The only acceptable remaining matches are this plan/spec history if the search scope is later widened.

- [ ] **Step 2: Verify the new real source is referenced where expected**

Run:

```bash
rg -n "ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md" CLAUDE.md AGENTS.md GEMINI.md ai-plugins/common-tools
```

Expected:

- Matches appear in the three root AI memory docs, the new skill file when self-referential, and any updated `common-tools` docs.

- [ ] **Step 3: Run formatting and diff safety checks**

Run:

```bash
pnpm exec prettier --check CLAUDE.md AGENTS.md GEMINI.md ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md ai-plugins/common-tools/skills/init-ai-md/SKILL.md "ai-plugins/common-tools/skills/init-ai-md/templates/08.本项目的技能表.md" ai-plugins/common-tools/README.md ai-plugins/common-tools/CHANGELOG.md
git diff --check
git status --short --branch
```

Expected:

- `prettier --check` passes for all touched Markdown files.
- `git diff --check` prints nothing.
- `git status --short --branch` shows only the intended migration files as modified or deleted.

- [ ] **Step 4: Perform a final manual review against the approved scope**

Confirm these facts before calling the task done:

- `release-ai-plugins` has exactly one real source: `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`
- `.claude/skills/release-ai-plugins/` is fully deleted
- `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` all use dual-root language and dual-group skill tables
- `init-ai-md` clearly separates local deployment from dual-root scan
- `common-tools/README.md` and `CHANGELOG.md` both expose the migration
- No plugin manifest or workspace config was changed

## Review Checklist

- [ ] The plan still matches the approved “剪切迁移 + 双根感知” scope.
- [ ] Every file named in the approved design is covered by at least one task.
- [ ] The plan does not instruct any marketplace/plugin manifest version bump.
- [ ] The plan explicitly says execution happens on the existing `dev` branch without `git worktree`.
- [ ] The plan preserves historical prompt docs and archived plan/report docs as out of scope.
