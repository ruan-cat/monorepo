# 2026-11-07 record-bug-fix-memory 部署路径压平

规格只记录已经对齐的合同和 2026-11-07 的扫描事实。实施见同目录 `plan.md`。审过这两份文档之前，不改技能、不提交、不推送。

## 目标

新部署位置是 `.agents/skills/record-bug-fix-memory/SKILL.md`。`init-ai-md` 以后按这个位置安装，并会把仍停在嵌套目录里的技能剪切到这里。`D:\code\ruan-cat` 里已经部署的副本由执行代理直接改文件，不在每个仓库里运行 `init-ai-md`。

## 已确认合同

### 搬迁

- 只认两个旧目录：`.claude/skills/fix-bug/record-bug-fix-memory/` 和 `.agents/skills/fix-bug/record-bug-fix-memory/`。
- 目标永远是 `.agents/skills/record-bug-fix-memory/`。
- 扁平目录里已有的同名文件保留。旧目录里多出来的 Markdown 剪切过去。
- 两个旧目录同时存在、扁平目录还没有时，以 `.agents` 嵌套目录里的文件为准，再从 `.claude` 那个技能目录补缺失的 Markdown。
- `.claude` 里只剪切这一个技能目录中的 Markdown。其余 `.claude` 文件不动。
- 旧目录是软链接时，停下来单独报告，不搬。
- 非 Markdown 文件留在原地并写入报告，所在目录不删。
- 只删除变空的 `record-bug-fix-memory` 和变空的上一层 `fix-bug`。`.claude` 与 `.claude/skills` 即使变空也保留。
- 旧路径不留跳转链接。

### 正文

- 搬迁不整篇换成模板。
- `template-version` 缺失或低于 `2.0.0` 时，不再因此改写 `SKILL.md` 正文。路径搬迁不受这个版本号拦截。
- 模板源文件自己的 `template-version` 维持 `"2.0.0"`。
- 新项目仍然把模板复制到扁平目录。
- `SKILL.md` 里还有内嵌案例时，以后运行 `init-ai-md` 继续拆成同目录的 `YYYY-MM-DD-*.md`，并留下索引。这次批量任务不跑拆分。

### 文本

这次批量任务替换每个仓库全部 Markdown 里的四段完整旧路径，包含历史报告、代码块和日志块：

| 原文                                           | 替换为                                 |
| ---------------------------------------------- | -------------------------------------- |
| `.agents/skills/fix-bug/record-bug-fix-memory` | `.agents/skills/record-bug-fix-memory` |
| `.agents\skills\fix-bug\record-bug-fix-memory` | `.agents\skills\record-bug-fix-memory` |
| `.claude/skills/fix-bug/record-bug-fix-memory` | `.agents/skills/record-bug-fix-memory` |
| `.claude\skills\fix-bug\record-bug-fix-memory` | `.agents\skills\record-bug-fix-memory` |

斜杠方向按上表保留。原文后面的 `/SKILL.md`、`\SKILL.md`、具体案例文件名保持不动，只换前缀。

不替换缺少 `.agents/skills/` 或 `.claude/skills/` 前缀的短片段 `fix-bug/record-bug-fix-memory`。不替换单独的技能名 `record-bug-fix-memory`。不替换模板源相对路径 `templates/record-bug-fix-memory`。

排除目录：`docs/prompts/release-ai-plugins/2026-11-7-init-ai-md-with-new-local-skills/`。这里要保留旧字符串，供执行时搜索。

以后 `init-ai-md` 只改两处路径字符串：扁平目录里的 `SKILL.md`，以及它维护的 `AGENTS.md` 技能表那一行。

非 Markdown 命中只记入报告，不改。

### 版本

- 插件系统 `12.0.0` 升到 `13.0.0`。九个 `plugin.json` 与带版本的 marketplace 锁步。
- `init-ai-md` 的 `metadata.version` 从 `23.0.0` 升到 `24.0.0`。
- `init-linux-cloud-agent-env` 只改了阅读路径。它的 `metadata.version` 从 `0.1.1` 升到 `0.1.2`。
- 模板 `template-version` 维持 `"2.0.0"`。

### 提交与推送

- 其他仓库每个仓库一条提交，说明相同，写完 push 当前分支。不区分 main 和 dev。不另开 PR。
- 同一文件里已经混有无关未提交修改时，该仓库停下来单独报告，不把整文件提交进去。
- 不是 git 仓库的目录只改文件，不提交，写入报告。
- monorepo 拆成四类提交：规格文档、技能行为、本仓库路径搬迁、插件版本。然后 push 当前分支。
- 工作流没有明显错误后，再安装全局技能。安装命令使用用户给出的两条 `skills add`。
- 全局技能目录 `C:\Users\pc\.agents\skills` 不手改。

提交说明按 `git-commit` 技能现查 `commit-types.ts`。技能行为提交使用 `✨ feat(init-ai-md)!`，正文写 `BREAKING CHANGE:`。插件版本提交使用 `📢 publish`。规格文档使用 `📃 docs`。路径搬迁使用 `🦄 refactor`。

## 扫描事实

2026-11-07 只读扫描。技能目录都不是软链接。没有已经位于 `.agents/skills/record-bug-fix-memory/` 的项目副本。

| 仓库                                                 | 当前分支 | 工作区 | 发现的目录                                                                                              |
| ---------------------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `D:\code\ruan-cat\01s-11comm`                        | dev      | 干净   | `.claude\skills\fix-bug\record-bug-fix-memory`；`apps\app\.claude\skills\fix-bug\record-bug-fix-memory` |
| `D:\code\ruan-cat\eams-component-lib`                | main     | 干净   | `.agents\skills\fix-bug\record-bug-fix-memory`                                                          |
| `D:\code\ruan-cat\gzpc-big-screen`                   | dev      | 干净   | `.agents\skills\fix-bug\record-bug-fix-memory`                                                          |
| `D:\code\ruan-cat\hzx10`                             | main     | 干净   | `.claude\skills\fix-bug\record-bug-fix-memory`                                                          |
| `D:\code\ruan-cat\learn-nitro-starter-with-vercel`   | main     | 干净   | `.agents\skills\fix-bug\record-bug-fix-memory`                                                          |
| `D:\code\ruan-cat\monorepo`                          | dev      | 脏     | `.agents\skills\fix-bug\record-bug-fix-memory`                                                          |
| `D:\code\ruan-cat\notes`                             | dev      | 干净   | `.agents\skills\fix-bug\record-bug-fix-memory`                                                          |
| `D:\code\ruan-cat\resume`                            | dev      | 干净   | `.agents` 与 `.claude` 两套嵌套目录都在                                                                 |
| `D:\code\ruan-cat\shadcn-docs-nuxt-production-repro` | main     | 干净   | 主工作区 `.agents\skills\fix-bug\record-bug-fix-memory`                                                 |
| `D:\code\ruan-cat\SmallAliceWeb`                     | dev      | 干净   | `.agents\skills\fix-bug\record-bug-fix-memory`                                                          |
| `D:\code\ruan-cat\stars-list`                        | dev      | 干净   | `.agents\skills\fix-bug\record-bug-fix-memory`                                                          |

`resume` 是唯一同时拥有两套旧目录的仓库，按「`.agents` 嵌套优先、`.claude` 只补缺失 Markdown」处理。`01s-11comm` 的根目录和 `apps\app` 各有一份，同一次提交里都搬。

16 个同名目录里的文件全是 Markdown，没有非 Markdown 残留，也没有软链接。没有「只在文档里提到旧路径、磁盘上却没有技能目录」的仓库。`eams-component-lib`、`hzx10`、`learn-nitro-starter-with-vercel`、`shadcn-docs-nuxt-production-repro` 当前在 `main`，按合同直接推当前分支。

`monorepo` 的 `docs/prompts/release-ai-plugins/02.md` 在扫描时已经有无关未提交修改，而这个文件又含有旧路径。路径搬迁不把 `02.md` 整文件提交。执行时只暂存本次路径替换能单独分开的文件；`02.md` 停下来单独报告。

本仓库已部署副本不是软链接，含 `SKILL.md` 和 16 个 `YYYY-MM-DD-*.md`。`CLAUDE.md` 与 `GEMINI.md` 只有一行重定向，技能表只写在 `AGENTS.md`。本仓库 Markdown 里四段完整路径有 16 个文件、49 处命中。非 Markdown 没有命中。

### 明确不搬的目录

- `D:\code\ruan-cat\monorepo\ai-plugins\common-tools\skills\init-ai-md\templates\record-bug-fix-memory` 是模板源。只改其中的部署路径示例，不把这个目录移出 `templates`。
- `D:\code\ruan-cat\shadcn-docs-nuxt-production-repro\.worktrees\r22` 与 `r32` 是同一仓库的附加工作区。这次只改主工作区，避免把同一次路径搬迁提交到 worktree 当前分支。

## 技能日后的判断顺序

1. 扁平目录已有 `SKILL.md` 时，它是正文来源。
2. 否则，`.agents` 嵌套目录里的 `SKILL.md` 是正文来源。
3. 否则，`.claude` 嵌套目录里的 `SKILL.md` 是正文来源。
4. 三个位置都没有时，把模板复制到扁平目录。
5. 把旧目录中的 Markdown 剪切到扁平目录。同名文件不覆盖。
6. 非 Markdown 留下并报告。变空的技能目录和变空的 `fix-bug` 删除。
7. 只在扁平目录的 `SKILL.md` 和 `AGENTS.md` 技能表那一行替换四段旧路径。
8. 扁平目录的 `SKILL.md` 仍含内嵌案例时，拆成同目录案例文件并写索引。

`template-version` 大于或等于 `2.0.0` 时，步骤 5 仍然执行。情况 E「已是最新」只表示正文不用按版本号替换，不表示目录可以留在嵌套路径。

## 本仓库要改的技能文件

- `ai-plugins/common-tools/skills/init-ai-md/SKILL.md`
- `ai-plugins/common-tools/skills/init-ai-md/references/step-details.md`
- `ai-plugins/common-tools/skills/init-ai-md/references/execution-examples.md`
- `ai-plugins/common-tools/skills/init-ai-md/templates/record-bug-fix-memory/SKILL.md`
- `ai-plugins/common-tools/skills/init-ai-md/templates/08.本项目的技能表.md`
- `ai-plugins/common-tools/skills/init-linux-cloud-agent-env/SKILL.md` 第 53–54 行

本仓库路径搬迁还覆盖 `AGENTS.md`、`ai-plugins/common-tools/CHANGELOG.md` 里的历史句子，以及 `docs/reports`、`docs/prompts/release-ai-plugins` 下除本规格目录以外的命中、`docs/superpowers` 里的命中。

## 验收

- 上表每个项目副本都位于 `.agents/skills/record-bug-fix-memory/`，旧的两个嵌套目录不存在；若因非 Markdown 残留而保留，报告里有路径。
- 模板源仍在 `init-ai-md/templates/record-bug-fix-memory/`。
- 两个 worktree 的嵌套目录保持原样。
- 排除本规格目录后，`D:\code\ruan-cat` 的 Markdown 不再含有四段完整旧路径。
- `init-ai-md` 的 `metadata.version` 为 `24.0.0`，插件版本为 `13.0.0`，模板 `template-version` 为 `2.0.0`。
- 技能正文里，版本号大于或等于 `2.0.0` 不再跳过目录搬迁。

## 风险

- 历史句子里如果同时出现两条旧路径，机械替换后会变成从新路径迁到新路径。这是已接受的结果。
- `CHANGELOG.md` 既有历史路径，又会被发版脚本追加新条目。这个文件不拆进两次提交。历史路径替换和 `13.0.0` 的新条目放在同一次 `publish` 提交。其余 Markdown 的路径替换仍在路径搬迁提交。
- 执行时工作区可能已经变脏。以执行当时的 `git status` 为准，不用这份扫描代替。
