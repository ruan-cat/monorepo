# 历史快照索引 — NON-NORMATIVE

本目录只保存 `skill-hardening-from-incidents` 在技能压缩、迁移和重构时需要保留的**历史原貌证据**。

> **NON-NORMATIVE：这里的内容不是当前执行规则。正常 hardening 任务不要加载本目录。**

只有以下场景允许读取：

- 知识保留审计；
- 迁移前后规则对照；
- 追溯某条当前规则从哪里来；
- 验证“被删除内容是否确实已保留”。

当前执行真值始终是：

1. `.agents/skills/skill-hardening-from-incidents/SKILL.md`
2. `.agents/skills/skill-hardening-from-incidents/reference/*.md` 顶层当前参考文件
3. 被加固目标 skill 自己当前的 `SKILL.md` 与 `references/`

archive 与当前规则冲突时，**不能用 archive 覆盖当前规则**。

## use-other-model

归档日期：2026-08-18
状态：Deprecated historical snapshots / NON-NORMATIVE
替代规则：`ai-plugins/common-tools/skills/use-other-model/SKILL.md` 及其当前 `references/`
归档原因：主入口进行渐进披露拆分，并升级任务合同、失败分流和弱模型执行合同；旧全文仅用于知识保留与迁移审计。

文件：

- `use-other-model/skill-v0.9.0-pre-split.md`
- `use-other-model/context-packet-v0.9.0-pre-split.md`
- `use-other-model/failure-routing-v0.9.0-pre-split.md`
- `use-other-model/references-readme-v0.9.0-pre-split.md`

这些文件包含已经被替代的规则，例如旧任务封包结构和旧失败重试语义。**禁止把其中内容直接作为当前 `use-other-model` 的执行依据。**

## release-ai-plugins

归档日期：2026-08-18（本次仅重新分类既有历史快照，不改变其正文）
状态：Deprecated historical snapshot / NON-NORMATIVE
替代规则：当前 `release-ai-plugins/SKILL.md` 及其当前 references
归档原因：旧版入口只用于迁移对照，不应与 hardening 当前规范文件并列参与正常阅读路线。

文件：

- `release-ai-plugins/skill-v0.17.4.md`
