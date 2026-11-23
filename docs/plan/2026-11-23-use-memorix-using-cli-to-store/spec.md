# 2026-11-23 补齐 use-memorix 的 CLI 存储命令

本目录是简易任务包，不是 OpenSpec change。任务只以 `plan.md` 为准。状态只写 `handoff.md`。不创建 `tasks.md`、`proposal.md`、`agent-progress.md`、`agent-findings.md`。

## 1. 背景

2026-11-23 一次写入里，执行代理要按主题键更新已有记忆。它先读了 `memorix remember --help`。那份帮助只列出 `--title`、`--type`、`--visibility`、`--json`，快捷命令也只转发这四项。接着 `memorix memory store --help` 打出的是 memory 动作总览，没有 `--entity`，也没有 `--topic-key`。

`use-memorix` 把这张空帮助当成了合同。`references/memory-operations.md` 写了要用 `topicKey` 做 upsert，兜底命令却是 `memorix memory store ...`，又写「参数以 `--help` 为准，不照抄旧文档」。代理因此判定 CLI 不能按主题键更新。MCP 若绑在另一个项目上，同名主题键会插入新记录。

实现侧已经能更新：`memorix memory store` 接受 `--entity` 和 `--topic-key`（内部写成 `--topicKey`）。同一 git 项目、同一主题键更新原记录，并返回 `upserted`。这份能力没有写进技能。

上游 CLI 帮助补丁另有稿，不在本包。本包只改 monorepo 里的 `use-memorix` 事实源。

## 2. 目标

执行代理读完技能后，CLI 兜底存储必须使用带项目、实体、类型、标题、主题键和正文的完整命令，并且知道 `memorix remember` 不是这条路径。

写集只有三处：

1. `ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md`
2. `ai-plugins/common-tools/skills/use-memorix/SKILL.md`
3. `ai-plugins/skill-registry.json` 里 `use-memorix` 的 `version` 字段

## 3. 非目标

执行会话不做这些事：

- 不改 Memorix CLI，不改 `D:\code\store\memorix__AVIDS2`。
- 不改官方技能 `memorix-memory`，也不改 `~\.agents\skills`、`~\.claude\skills` 里的任何副本。
- 不运行 `skills add` 或 `skills update`。
- 不调用 Memorix 的 store、resolve、session start、session end，也不做归档。
- 不把观察编号、本机用户目录、这次对话原文写进技能正文。
- 不改 `memory-operations.md` 的只读示例、失败表里与存储无关的行、以及其他 reference。
- 不改 `skill-registry.json` 里 `use-memorix` 以外的条目，也不改它的 `description`。
- 不提交，不推送，不暂存，不切换分支，不创建 worktree。
- 不碰规划时已经 dirty 的 `openspec/changes/slim-four-skill-descriptions/` 与 `openspec/changes/archive/2026-11-23-slim-four-skill-descriptions/`。
- 不创建 OpenSpec 文件或第二份进度文件。

## 4. 冻结文本

路由表「存储记忆」一行的 CLI 兜底，整格换成：

```text
memorix memory store --cwd <git 项目> --entity <实体> --type <类型> --title "<标题>" --topic-key <主题键> --text "<正文>"
```

「补充约定」里原来的 `topicKey` 那一条，整条换成：

```text
- 有明确演进主题时用 `--topic-key` 做 upsert。同一 git 项目、同一主题键更新原记录。没有这个键才新建。
```

「CLI 兜底」原有三条里，第 1、2 条换成下面两段。第 3 条「本次走 CLI 兜底」保持原句。只读示例三行不改。

帮助仍未列出 `--topic-key` 时：

```text
1. 先读 `memorix --version`。除存储以外的命令，再读 `memorix <command> --help`，参数以这次帮助为准，不照抄旧文档。
2. 存储走下面这条命令。`memorix memory store --help` 打印的是 memory 动作总览，不列出 `--entity` 和 `--topic-key`。`memorix remember --help` 只列出 `--title`、`--type`、`--visibility`、`--json`。这两份帮助都不是主题键更新的参数合同。
```

帮助已经列出 `--topic-key` 时，第 2 条改用这一句，其它不变：

```text
2. 存储仍走下面这条命令。`memorix remember` 不转发 `--entity` 和 `--topic-key`。`memorix memory store --help` 已列出这些参数时，帮助必须和本命令一致，不改走 `remember`。
```

存储命令和两条附注，放在只读示例之前：

```bash
memorix memory store --cwd <git 项目> --entity <实体> --type <类型> --title "<标题>" --topic-key <主题键> --text "<正文>"
```

```text
- `memorix remember` 不是 upsert 入口。它不转发 `--entity` 和 `--topic-key`。
- 主题键只在 `--cwd` 指向的那个 git 项目里查找。指错项目会插入新记录。MCP store 的主题键同样只在当前绑定项目里查找。
```

失败表新增一行，不改原有四行：

```text
| 帮助里看不到主题键   | 存储以本文件的存储命令为准                       | 改走 `memorix remember`，或据此判定 CLI 不能更新 |
```

`SKILL.md`「运行时事实来源优先级」第 2 条之后追加一句，不改第 1、3、4、5 条：

```text
主题键更新不从 `memorix remember --help` 推断，也不从缺少 `--topic-key` 的 `memorix memory store --help` 推断。CLI 存储以 `references/memory-operations.md` 的存储命令为准。其它命令仍以当前 `--help` 为准。
```

`SKILL.md` 的 `metadata.version` 和 `skill-registry.json` 里 `use-memorix` 的 `version` 一起从 `3.0.1` 改为 `3.0.2`。

## 5. 验收

- 路由表、存储命令代码块、两条附注都含 `--cwd`、`--entity`、`--type`、`--title`、`--topic-key`、`--text`。
- 技能正文写明 `memorix remember` 不转发 `--entity` 和 `--topic-key`。
- 技能正文写明主题键按 `--cwd` 或 MCP 当前绑定项目查找，指错项目会插入新记录。
- 「参数以 `--help` 为准」不再覆盖存储这条命令。其它命令仍然先读 `--help`。
- 两处版本都是 `3.0.2`。`description` 与改前一致。
- `git diff` 只触及写集三处和本任务包。只读示例三行仍在。
