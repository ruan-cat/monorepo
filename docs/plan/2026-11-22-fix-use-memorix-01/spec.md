# 2026-11-22 补上 use-memorix 的项目绑定硬门

## 1. 背景

2026-11-22 在工作区 `D:\store\WorkBuddy\2026-6-30-common` 做会话收尾时，CLI `memorix session context` 报的项目是 `ruan-cat/common`。随后 MCP `memorix_store` 把三条记忆写进了 `ruan-cat/monorepo`，编号 6422、6423、6424。

原因已经核对过：

- `memorix session context` 按命令的工作目录识别项目。
- MCP 的 `memorix_project_context`、`memorix_search`、`memorix_store` 没有项目参数，跟随 Cursor 里共享 Memorix 进程当前绑着的根目录。
- 当时该进程绑在 `D:\code\ruan-cat\monorepo`。活动会话是 `sess-mwqk7esf-8lbigx`，agent 为 `cursor`，2026-11-21 15:25 UTC 开始。
- 收尾提示词写了「有活动会话就复用，不要再 `session_start`」，并写了和技能冲突时以技能为准。
- 技能事实源把同一句写成了硬规则，没有要求 CLI 项目 id 与 MCP 根目录同时等于当前工作区。

本包只补技能文档里的这道门。不搬记忆，不改提示词，不安装技能。

## 2. 目标

在技能事实源里写明并保持一致：

CLI 的项目 id 和 MCP 绑定的根目录必须同时是当前工作区。有一边不是，就停止写入，向用户确认后，用当前工作区的绝对路径调用 `memorix_session_start` 的 `projectRoot`，核对通过后再写。

这句话要同时出现在下面三处：

1. `ai-plugins/common-tools/skills/use-memorix/SKILL.md` 的平台事实。
2. `ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md` 的 `start` 规则。
3. `ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md` 的写入路径，并让读取路径第 1 步指向这道门。

## 3. 非目标

执行会话不做这些事：

- 不修改 `D:\store\WorkBuddy\2026-6-30-common\通用提示词.md`，包括 `<!-- mem,7 -->` 和 `<!-- mem,8 -->`。
- 不修改 `C:\Users\pc\.agents\skills\use-memorix` 或 `C:\Users\pc\.claude\skills\use-memorix`。那是安装副本，交给以后的 `skills add`。
- 不运行 `skills add`。
- 不调用 `memorix_session_start`、`memorix_store`、`memorix_resolve`、`memorix session end`。
- 不移动、复制或失效 6422、6423、6424。
- 不改官方技能 `memorix-sessions`。它已经要求 HTTP 模式传递 `projectRoot`。
- 不改本技能的脚本、黄金集、hooks、MCP 安装文件。
- 不提交，不推送，不暂存本包之外的既有改动。
- 不创建 `agent-progress.md`、`agent-findings.md`、`tasks.md` 或 OpenSpec change。

## 4. 冻结文本

三处都用下面的判定，允许按所在文件的列表或段落格式改写，不允许改判定本身。

1. 在当前工作区运行 `memorix session context`，记下 CLI 项目 id 和根目录。
2. 读取 MCP `memorix_project_context`，记下它绑定的项目 id 和根目录。
3. 两边都必须等于当前工作区。CLI 报本项目已有活动会话，不能代替这次核对。
4. 有一边不是，停止 `memorix_store` 和 `memorix_resolve`。向用户展示两边的项目 id 与根目录，确认后第一件 MCP 调用才是 `memorix_session_start`，`projectRoot` 传当前工作区绝对路径。
5. `session_start` 会关闭该项目上一个活动会话。确认前不调用。
6. 绑定成功后再次核对。仍不一致就停止，不写。
7. 只有 `session_start` 失败，才走 CLI 兜底。CLI 的工作目录必须是当前工作区。

`SKILL.md` 现有平台事实整句替换。原文是：

```text
平台事实：MCP 工具链要等 `memorix_session_start` 成功并绑定项目后才暴露。`memorix session context` 是只读，可在启动前用来判断本项目是否已有活动会话。已有则复用，不重复启动。没有才确认后启动。只有这一步失败，才走 CLI 兜底。
```

`session-and-reasoning.md` 下面这一条整条替换。同文件「恢复会话只读不写」那条保留。

```text
- `start` 前先用只读的 `memorix session context` 看本项目是否已有活动会话。已有则复用，不重复启动。没有才确认后启动。确认的原因是 `start` 会新建会话，并可能关闭上一个活动会话。MCP 模式下，这一步成功并绑定项目之前，后续 memorix MCP 工具不可用。只有这一步失败，才走 CLI 兜底。
```

`memory-operations.md` 在「写入路径」开头增加标题「项目绑定硬门」，内容用上面 7 步。读取路径第 1 步改成指向这道硬门。被替换的原句是：

```text
1. 先取项目上下文：确认当前项目绑定、最近 handoff、可用的记忆条目。
```

原有的实体、类型、标题、narrative、确认后才写，全部保留。

## 5. 验收

1. 在 `ai-plugins/common-tools/skills/use-memorix` 下搜索 `已有则复用，不重复启动`，零命中。
2. `SKILL.md`、`session-and-reasoning.md`、`memory-operations.md` 都写有「项目绑定硬门」，并写有 `projectRoot` 使用当前工作区绝对路径。
3. 三份文件之外，`git diff` 不出现本任务造成的改动。仓库里已有的 `AGENTS.md`、`init-ai-md` 和 `docs/prompts/release-ai-plugins/02.md` 改动保持原样。
4. 本目录仍只有 `spec.md`、`plan.md`、`handoff.md`。
5. 验收只看文档和 `git diff`。不为验收调用 Memorix，也不核验 6422、6423、6424。
