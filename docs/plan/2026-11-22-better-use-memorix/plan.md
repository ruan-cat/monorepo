# 2026-11-22 use-memorix [retrieval] 说明执行计划

任务源只使用本文件。合同以 `spec.md` 为准。各 Task 的完成标记只写在该 Task 下的「执行状态」一行。当前状态、证据、阻塞和下一条命令只写同目录 `handoff.md`。

## Global Constraints

- 仓库：`D:\code\ruan-cat\monorepo`。只在当前分支工作，不新建 worktree，不切换分支。
- Task 1–3 只改 `ai-plugins/common-tools/skills/use-memorix/references/retrieval-and-golden-set.md` 的指定插入点。
- Task 4 只改 `spec.md` 点名的两个 common Markdown。Task 3 没通过就不做 Task 4。
- 插入正文以 `spec.md` 第 2 节为准。不要顺手改表格、判定顺序或黄金集合同。
- `spec.md` 第 3 节的非目标全部有效。
- 本目录的 `spec.md` 不改。`plan.md` 只改 Task 的执行状态。`handoff.md` 只改易腐栏。
- 不 `git add`，不 `git commit`，不 `git push`。

## Task 1：复核插入点还在

执行状态：已完成

修改范围：不改文件。

步骤：

1. 在仓库根运行 `git status --short --branch`、`git rev-parse HEAD`、`git branch --show-current`。
2. 读 `references/retrieval-and-golden-set.md` 的 `## Embedding` 一节。
3. 确认动作表后面仍是 `判定顺序（不要跳步）`，且文件里还没有 `用户级检索策略`。

验收：插入点与 `handoff.md` 记录的哈希一致，或哈希变了但旧结构还在。结构没了就停止，并把差异写进 `handoff.md`。

验证命令：

```powershell
rg -n "用户级检索策略|判定顺序" ai-plugins/common-tools/skills/use-memorix/references/retrieval-and-golden-set.md
```

## Task 2：插入配置说明

执行状态：已完成

修改范围：只在 Embedding 动作表和判定顺序之间插入 `spec.md` 第 2 节的正文。

步骤：

1. 按周围标题层级插入，不改判定顺序的五条。
2. toml 示例使用普通 Markdown 围栏。

验收：新小节只出现一次，两个字段和确认要求都在。

验证命令：

```powershell
rg -n "cjk = .vector.|ascii = .hybrid.|得到确认后再写" ai-plugins/common-tools/skills/use-memorix/references/retrieval-and-golden-set.md
```

## Task 3：确认没有写进禁区

执行状态：已完成

修改范围：不改文件。

步骤：

1. `git diff -- ai-plugins/common-tools/skills/use-memorix/SKILL.md` 应为空。
2. 在改过的 reference 里搜索盘符用户目录和 `observationIds`，应无命中。

验收：非目标里的文件没有被本 Task 改到。

验证命令：

```powershell
git diff --stat -- ai-plugins/common-tools/skills/use-memorix
rg -n "observationIds|[A-Za-z]:\\\\Users\\\\" ai-plugins/common-tools/skills/use-memorix/references/retrieval-and-golden-set.md
```

## Task 4：回写 common 的两处现行句子

执行状态：已完成

修改范围：只改下面两个文件里 `spec.md` 点名的那一句。仓库根是 `D:\code\ruan-cat\common` 的工作区（本机路径 `D:\store\WorkBuddy\2026-6-30-common`）。

- `docs/memorix/index.md`
- `docs/memorix/2026-10-13-about-embedding-mode/handoff.md`

步骤：

1. 先确认 Task 3 的 diff 里已经有 `### 用户级检索策略`。没有就停止。
2. 若 monorepo 里这份 reference 改动已经提交，把该提交的完整 SHA 写入 handoff 第 1 条。未提交就写「未提交」，不编 SHA。
3. 两句都写明已安装的 `use-memorix` 还没有这段，要等用户另行 `skills add`。
4. 不改 common 的其他脏文件，不 `git add`，不 `git commit`。

验收：两个文件都能搜到 `用户级检索策略`，并且都写了已安装副本尚未更新。`cases.json` 与 `retrieval-golden-set/mirrors/` 无 diff。

验证命令（在 common 工作区根执行）：

```powershell
rg -n "用户级检索策略" docs/memorix/index.md docs/memorix/2026-10-13-about-embedding-mode/handoff.md
git diff --stat -- .memorix/golden-set/cases.json docs/memorix/retrieval-golden-set/mirrors
```
