# 2026-11-22 use-memorix 无活动会话说法与分轮落地计划

合同只以 `spec.md` 为准。本文件只排执行顺序。状态写在本文件的勾选和 `handoff.md` 易腐栏。

## 1. 交付范围

允许修改：

- `ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md`
- `ai-plugins/common-tools/skills/use-memorix/SKILL.md`
- 本文件的勾选
- `handoff.md` 的易腐栏

禁止修改 `spec.md`。禁止修改第 1 节以外的仓库文件。`docs/plan/2026-11-22-fix-use-memorix-01/` 只读。

## 2. 预检

预检不是 Task，不参与完成勾选。结果只写入 `handoff.md` 易腐栏。

在 `D:\code\ruan-cat\monorepo` 执行 `handoff.md` 易腐栏里的下一条命令。分支与规划时不一致就停止，只更新易腐栏。搜索结果用来判断 01 是否已经落地。然后读 `session-and-reasoning.md` 的「读写分区」和「失败分支」，以及 `SKILL.md` 的平台事实段。01 已经改过时，以磁盘上的现行段落为追加点，不按本包写下来的旧句回滚。

## 3. 任务

### Task 1：补会话文件

- [ ] 在「读写分区」之后新增 `## 收尾时没有活动会话`，正文使用 `spec.md` 第 5.1 节的 7 条，顺序不改。
- [ ] 在「失败分支」表按第 5.2 节加一行。原有四行不删、不改写。
- [ ] 不改「读写分区」里现有的 `start` 那一条。01 若已替换它，保持 01 的文字。

验证：

```powershell
rg -n "^## 收尾时没有活动会话|^## 失败分支|0 active" ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md
git diff -U0 -- ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md
```

标题和 `0 active` 行必须出现。diff 里不得删除「失败分支」原有四行。通过后把命令和结果写入易腐栏，再勾选本 Task。

### Task 2：补技能入口

- [ ] 在 `SKILL.md` 平台事实段落后面追加 `spec.md` 第 5.3 节那段。不删除该段已经存在的句子。
- [ ] 01 的项目绑定硬门若已在该段，追加段放在硬门之后。

验证：

```powershell
rg -n "只确认要不要新建会话|不是索引错误，也不是归档失败|项目绑定硬门" ai-plugins/common-tools/skills/use-memorix/SKILL.md
git diff -U0 -- ai-plugins/common-tools/skills/use-memorix/SKILL.md
```

前两句必须命中。预检时已经有「项目绑定硬门」的，验收时仍须命中。diff 不得整段删掉平台事实或硬门。通过后把命令和结果写入易腐栏，再勾选本 Task。

### Task 3：验收

- [ ] 按 `spec.md` 第 6 节逐条核对。
- [ ] 运行下面的验证。通过后把命令和结果写入易腐栏，再勾选本 Task。

验证：

```powershell
git diff --check -- ai-plugins/common-tools/skills/use-memorix/SKILL.md ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md
git diff --stat -- ai-plugins/common-tools/skills/use-memorix/SKILL.md ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md ai-plugins/common-tools/skills/use-memorix/references/retention-and-archive.md
git status --short --branch
```

`--check` 无输出。`--stat` 只出现前两个技能文件。后两个 reference 不出现。其他 dirty 路径保持未暂存、未回滚。

## 4. 停止条件

出现任一条就停止，不继续改技能：

- 需要改 `memory-operations.md` 或 `retention-and-archive.md` 才能让语句通顺。
- 追加会删掉「项目绑定硬门」，或会把「已有则复用，不重复启动」写回已被 01 删除的位置。
- 工作区里这两个技能文件在本任务之外还有未提交改动，且无法只追加本包的段落。

停止时只更新易腐栏，写明停在哪一条。
