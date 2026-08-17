# 参考文件索引

本目录是 `skill-hardening-from-incidents` 的当前知识层。`SKILL.md` 只承担触发、决策骨架和强制门禁；本目录顶层只保留**当前可执行规则**。历史快照统一进入 `archive/`，正常执行不加载 archive。

## 使用规则

- 先读 `SKILL.md`，再按当前任务读取对应的当前参考文件，不要无目的加载全部材料。
- `reference/*.md` 顶层是当前规范；`reference/archive/**` 是 NON-NORMATIVE 历史证据。
- 删除或合并 `SKILL.md` 章节前：当前仍有效规则迁移到当前 reference；只用于保留旧版本原貌的内容进入 archive。
- archive 只用于知识保留审计、迁移追溯和旧规则比较，不能反向覆盖当前规则。

## 当前文件导航

| 文件                                                                 | 适用问题                                                       |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`retention-contract.md`](retention-contract.md)                     | 如何防止技能知识衰减、遗忘、过度删减，以及如何隔离历史 archive |
| [`workflow-boundaries.md`](workflow-boundaries.md)                   | 写入目标、证据材料、skill 类型边界和编辑准则                   |
| [`rule-extraction.md`](rule-extraction.md)                           | 将事故材料提炼为 future-agent 规则的五步方法                   |
| [`agent-team-loop.md`](agent-team-loop.md)                           | 主代理、编辑子代理、验证子代理的职责与闭环                     |
| [`validation-and-failure-modes.md`](validation-and-failure-modes.md) | 验证清单、路径污染扫描、常见错误和完成条件                     |
| [`plugin-marketplace.md`](plugin-marketplace.md)                     | AI 插件市场的维护入口、用户入口和安装验证                      |

## 历史证据索引

历史快照不在本表逐文件展开。只有需要迁移审计或追溯旧规则时，才读取：

- [`archive/README.md`](archive/README.md)

**不要在正常 hardening 流程中遍历 `archive/`。**

## 迁移台账

| 来源章节（原 `SKILL.md` 或模板）           | 目标文件                                                        | 迁移原因                                            | 状态                  |
| ------------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------- | --------------------- |
| 先定写入目标、证据材料读取清单、编辑准则   | `workflow-boundaries.md`                                        | 细节稳定但不应挤占入口篇幅                          | 已迁移并复核          |
| 提炼规则的方法                             | `rule-extraction.md`                                            | 保留现象、根因、诱因、规则、验证五要素              | 已迁移并复核          |
| agent team 闭环                            | `agent-team-loop.md`                                            | 角色边界和清理要求需要独立查阅                      | 已迁移并复核          |
| 验证清单、路径污染扫描、常见错误、完成条件 | `validation-and-failure-modes.md`                               | 保留完整门禁和失败分流                              | 已迁移并复核          |
| 插件市场变更加固                           | `plugin-marketplace.md`                                         | 平台 schema 和安装验证属于专题细节                  | 已迁移并复核          |
| `09.Karpathy Guidelines.md` 的插件市场变更 | `plugin-marketplace.md`、`release-ai-plugins/SKILL.md`          | 专项发布规则不应污染通用 AI 记忆模板                | 已迁移并复核          |
| `release-ai-plugins` v0.17.4 主入口        | `archive/release-ai-plugins/skill-v0.17.4.md`                   | 旧版入口只用于迁移审计，不应作为当前 hardening 规则 | 已归档，NON-NORMATIVE |
| `use-other-model` v0.9.0 拆分前主入口      | `archive/use-other-model/skill-v0.9.0-pre-split.md`             | 对外 skill 入口收缩前保留全部原始规则，避免知识丢失 | 已归档，NON-NORMATIVE |
| `use-other-model` 旧任务封包模板           | `archive/use-other-model/context-packet-v0.9.0-pre-split.md`    | 升级任务合同 schema 前保留旧模板                    | 已归档，NON-NORMATIVE |
| `use-other-model` 旧失败分流               | `archive/use-other-model/failure-routing-v0.9.0-pre-split.md`   | 统一失败层与重试语义前保留旧规则                    | 已归档，NON-NORMATIVE |
| `use-other-model` 旧 references 导航       | `archive/use-other-model/references-readme-v0.9.0-pre-split.md` | 重排渐进披露阅读路线前保留旧导航                    | 已归档，NON-NORMATIVE |
