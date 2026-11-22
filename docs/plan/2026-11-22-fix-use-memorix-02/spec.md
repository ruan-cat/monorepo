# 2026-11-22 补齐 use-memorix 无活动会话时的说法与分轮

## 1. 背景

2026-11-22 一次会话收尾里，`memorix session context` 返回 `0 active / 192 completed`。执行代理没有调用过 `memorix_session_start`，也没有写入。它在同一条消息里同时询问「要不要新建会话」和「要不要写入三条记忆」。

用户随后把这件事理解成三件没有发生的事：会话被同目录代理关掉、索引错误、没有活动会话就无法做有意义的归档。

技能已经写了门禁：没有活动会话才确认后启动；一次只进一个域，多个写操作不混在一次确认里。缺的是查到 `0 active` 时必须怎么向用户说，以及这一轮只允许确认哪一个写操作。门禁在技能开头，收尾步骤旁边没有。

同日另有任务包 `docs/plan/2026-11-22-fix-use-memorix-01/`。它要替换 `SKILL.md` 的整句平台事实，并替换 `session-and-reasoning.md` 里那条 `start` 规则，改成项目绑定硬门。本包不拥有那两处替换。本包只追加。

## 2. 目标

在对外分发技能的事实源里补上可执行的说法和分轮。执行代理读完后，遇到 `0 active` 必须能按固定顺序回复，并且一轮只确认一个写操作。

写集只有两个文件：

1. `ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md`
2. `ai-plugins/common-tools/skills/use-memorix/SKILL.md`

## 3. 非目标

执行会话不做这些事：

- 不实现本包以外的技能改造，不亲自安装或同步技能。
- 不修改 `docs/plan/2026-11-22-fix-use-memorix-01/`。
- 不修改 `references/memory-operations.md`、`references/retention-and-archive.md`，也不改归档七步。
- 不修改 `C:\Users\pc\.agents\skills\use-memorix` 或 `C:\Users\pc\.claude\skills\use-memorix`。
- 不运行 `skills add`。
- 不调用 `memorix_session_start`、`memorix_store`、`memorix_resolve`、`memorix session end`，也不做归档。
- 不改官方技能 `memorix-sessions`。
- 不改本技能的脚本、黄金集、hooks、MCP 安装文件。
- 不提交，不推送，不暂存本包之外的既有改动。
- 不创建 `agent-progress.md`、`agent-findings.md`、`tasks.md` 或 OpenSpec change。
- 不把本机用户目录、这次对话原文、观察编号写进技能正文。

## 4. 与 01 包的边界

两个包都会碰到 `SKILL.md` 的平台事实和 `session-and-reasoning.md` 的 `start` 规则。所有权如下：

| 文本                                              | 所有者 | 本包                                                                                 |
| :------------------------------------------------ | :----- | :----------------------------------------------------------------------------------- |
| 把平台事实整句换成项目绑定硬门                    | 01     | 不替换这一句。01 已替换时，接在新段落后面追加。01 未替换时，接在现有平台事实后面追加 |
| 替换「已有则复用，不重复启动」那条 `start` 规则   | 01     | 不改这条。01 已删掉时，不把它写回去                                                  |
| `0 active` 时的回复顺序，以及一轮只确认一个写操作 | 02     | 新增独立小节，并在失败分支表加一行                                                   |

执行前用搜索判断 01 是否已经落地。两种状态都要能完成本包。本包不负责完成 01。

## 5. 冻结文本

下面的判定必须原意落地。允许放进段落或表格，不允许改判定。

### 5.1 新小节

在 `session-and-reasoning.md` 的「读写分区」之后新增 `## 收尾时没有活动会话`。内容按这个顺序：

1. 先跑只读的 `memorix session context`。回复里写上活动会话数量，以及最近一条已结束会话的代理和时间。命令失败时原样报失败，不把它说成 `0 active`。
2. 写明本对话有没有调用过 `session start`。没调用过，就写「本对话没有活动会话」，不得写「我的会话被其他代理关掉」。
3. `0 active` 不是索引错误，也不是归档失败。没有活动会话时，MCP 写入不可用；只读 `session context` 仍然有效。
4. 这一轮只问一件事：要不要新建会话，以便之后写入。不同时确认 `store`、`session end`、handoff 或 `archive`。
5. 用户说不存储、不启动或不归档：不调用 `session start`，不写入，不进入归档。
6. 只有本对话曾经 `session start` 成功，之后的只读结果变成已结束，且结束记录属于其他代理，才可以写「可能被其他会话结束」。三样缺一样，就写「本对话没有活动会话」。
7. 归档是否成立只看 retention 域的候选硬门。没有活动会话不是归档失败。

### 5.2 失败分支加一行

在同文件「失败分支」表增加一行：

| 现象                              | 处理                                                                                         |
| :-------------------------------- | :------------------------------------------------------------------------------------------- |
| `session context` 显示 `0 active` | 按「收尾时没有活动会话」回复。不推断竞态，不把索引或归档说成失败。这一轮只确认要不要新建会话 |

已有的四行保留。

### 5.3 SKILL.md 追加段

在平台事实所在段落后面追加一段，不删除该段现有句子：

```text
没有活动会话时，只读 `memorix session context` 仍然有效，MCP 写入不可用。这时只确认要不要新建会话，不要在同一条消息里同时确认 `store`、`session end` 或 `archive`。`0 active` 本身不是索引错误，也不是归档失败。归档是否成立只看 retention 域的候选硬门。本对话没有调用过 `session start` 时，不得声称自己的会话被其他代理关掉。说法和分轮见 `references/session-and-reasoning.md` 的「收尾时没有活动会话」。
```

若 01 已经把平台事实换成项目绑定硬门，这段接在硬门段落后面。不删硬门，不恢复被 01 删除的旧句。

## 6. 验收

1. `session-and-reasoning.md` 含标题 `## 收尾时没有活动会话`。
2. 该小节含这四句判定：活动会话数量、本对话没有调用过 `session start` 时不得声称被关掉、这一轮只确认要不要新建会话、三样证据缺一就写「本对话没有活动会话」。
3. 失败分支表含 `0 active` 这一行，原有四行还在。
4. `SKILL.md` 含「只确认要不要新建会话」和「不是索引错误，也不是归档失败」。
5. 若文件里已有「项目绑定硬门」，验收后仍然有。若文件里已没有「已有则复用，不重复启动」，本包不把它写回去。
6. `git diff` 里本任务只涉及这两个技能文件，加上本目录 `handoff.md` 的易腐栏和 `plan.md` 的执行勾选。`spec.md` 不改。
7. `references/retention-and-archive.md` 与 `references/memory-operations.md` 无本任务 diff。
8. 技能 diff 里不出现本机用户目录、这次的观察编号，也不出现「索引错误」以外的事故流水账。
9. 没有新的 Memorix 写入，没有 `skills add`，没有 commit。
