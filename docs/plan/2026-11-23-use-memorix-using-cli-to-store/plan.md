# 2026-11-23 use-memorix CLI 存储命令落地计划

合同只以 `spec.md` 为准。本文件只排执行顺序。状态写在本文件的勾选和 `handoff.md` 易腐栏。

## Global Constraints

- 一次只做下面一个未完成 Task。做完并写入证据后，再读这三份文件里刚改过的部分，进入下一个。
- 冻结文本以 `spec.md` 第 4 节为准。不改写措辞，不增删标志。
- 动手前先跑 `handoff.md` 的预检。易腐栏过期时先改正 handoff，再决定门是否仍成立。
- 预检发现 `memorix memory store --help` 已经印出 `--topic-key` 时，CLI 兜底第 2 条用 spec 里的已列出变体。否则用未列出变体。
- 不提交、不推送、不暂存、不切换分支。
- 不创建 `agent-progress.md`、`agent-findings.md`、`tasks.md` 或 OpenSpec change。
- 遗漏若属于本包，先补进本文件对应 Task，写清验证，再做。

## 1. 交付范围

允许修改：

- `ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md`
- `ai-plugins/common-tools/skills/use-memorix/SKILL.md`
- `ai-plugins/skill-registry.json` 中 `use-memorix` 的 `version`
- 本文件的勾选
- `handoff.md` 的易腐栏

禁止修改 `spec.md`。禁止修改第 1 节以外的仓库文件。

## 2. 预检

预检不是 Task，不参与完成勾选。结果只写入 `handoff.md` 易腐栏。

在 `D:\code\ruan-cat\monorepo` 执行 `handoff.md` 易腐栏里的下一条命令。分支不是 `dev`，或 HEAD 与易腐栏不一致，先更新易腐栏。dirty 里出现写集三处以外的新文件时，只记录，不 checkout、不 stash。然后读 `memory-operations.md` 的路由表、补充约定、CLI 兜底，以及 `SKILL.md` 的运行时事实来源优先级。

## 3. 任务

### Task 1：改存储参考

- [ ] 按 `spec.md` 第 4 节替换路由表存储行、`topicKey` 约定、CLI 兜底第 1 和第 2 条。
- [ ] 在只读示例之前放入存储命令和两条附注。
- [ ] 失败表追加一行。原有四行不删、不改写。
- [ ] 只读示例三行保持原样。第 3 条「本次走 CLI 兜底」保持原句。

验证：

```powershell
rg -n "topic-key|memorix remember|memorix search --query" ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md
git diff -U0 -- ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md
```

存储命令、`remember` 不转发、指错项目会插入新记录，这三处都必须出现。`memorix search --query` 那一行必须仍在。通过后把命令和结果写入易腐栏，再勾选本 Task。

### Task 2：改技能入口版本

- [ ] 在「运行时事实来源优先级」第 2 条后追加 spec 规定的那一句。第 1、3、4、5 条不改。
- [ ] `metadata.version` 从 `3.0.1` 改为 `3.0.2`。
- [ ] 不改 `description`。

验证：

```powershell
rg -n "metadata:|version:|主题键更新不从" ai-plugins/common-tools/skills/use-memorix/SKILL.md
git diff -U0 -- ai-plugins/common-tools/skills/use-memorix/SKILL.md
```

版本行是 `3.0.2`。diff 不得改动 `description`。通过后写入易腐栏，再勾选本 Task。

### Task 3：对齐注册表版本

- [ ] 把 `ai-plugins/skill-registry.json` 里 `id` 为 `use-memorix` 的 `version` 改为 `3.0.2`。
- [ ] 不改该条目的 `description`、`plugin`、`entry`，也不改其它技能。

验证：

```powershell
rg -n -A 6 "\"id\": \"use-memorix\"" ai-plugins/skill-registry.json
git diff -U0 -- ai-plugins/skill-registry.json
```

该条目版本是 `3.0.2`。diff 只应出现这一处版本。通过后写入易腐栏，再勾选本 Task。

### Task 4：收口核对

- [ ] 对照 `spec.md` 第 5 节逐条核对。
- [ ] 确认 `git status --short` 里，本包之外的既有 dirty 没有被本任务改写。
- [ ] 确认工作区没有新的 `agent-progress.md` 或 `agent-findings.md`。

验证：

```powershell
git status --short --branch
git diff --stat -- ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md ai-plugins/common-tools/skills/use-memorix/SKILL.md ai-plugins/skill-registry.json
rg --files -g agent-progress.md -g agent-findings.md docs/plan/2026-11-23-use-memorix-using-cli-to-store
```

第三命令无命中。前两个命令的结果写入易腐栏。全部验收成立后勾选本 Task，并把下一条命令改成复跑 `git status --short --branch`。
