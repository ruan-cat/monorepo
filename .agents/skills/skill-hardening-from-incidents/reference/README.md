# 参考文件索引

本目录是 `skill-hardening-from-incidents` 的长期知识保留层。`SKILL.md` 只承担触发、决策骨架和强制门禁；本目录保留被压缩的操作细节、失败模式、边界条件和迁移记录。

## 使用规则

- 先读 `SKILL.md`，再按当前任务读取对应参考文件，不要无目的加载全部历史材料。
- 参考文件中的规则与案例是可复用知识，不是本次会话的流水账。
- 删除或合并 `SKILL.md` 章节前，必须先把原文迁移到对应参考文件，并在下表登记。
- 参考文件更新采用追加或定向修订；过时内容保留废弃原因，禁止静默删除。

## 文件导航

| 文件                                                                 | 适用问题                                               |
| -------------------------------------------------------------------- | ------------------------------------------------------ |
| [`retention-contract.md`](retention-contract.md)                     | 如何防止技能知识衰减、遗忘、过度删减，以及如何审计迁移 |
| [`workflow-boundaries.md`](workflow-boundaries.md)                   | 写入目标、证据材料、skill 类型边界和编辑准则           |
| [`rule-extraction.md`](rule-extraction.md)                           | 将事故材料提炼为 future-agent 规则的五步方法           |
| [`agent-team-loop.md`](agent-team-loop.md)                           | 主代理、编辑子代理、验证子代理的职责与闭环             |
| [`validation-and-failure-modes.md`](validation-and-failure-modes.md) | 验证清单、路径污染扫描、常见错误和完成条件             |
| [`plugin-marketplace.md`](plugin-marketplace.md)                     | AI 插件市场的维护入口、用户入口和安装验证              |

## 迁移台账

| 来源章节（原 `SKILL.md`）                  | 目标文件                          | 迁移原因                               | 状态         |
| ------------------------------------------ | --------------------------------- | -------------------------------------- | ------------ |
| 先定写入目标、证据材料读取清单、编辑准则   | `workflow-boundaries.md`          | 细节稳定但不应挤占入口篇幅             | 已迁移并复核 |
| 提炼规则的方法                             | `rule-extraction.md`              | 保留现象、根因、诱因、规则、验证五要素 | 已迁移并复核 |
| agent team 闭环                            | `agent-team-loop.md`              | 角色边界和清理要求需要独立查阅         | 已迁移并复核 |
| 验证清单、路径污染扫描、常见错误、完成条件 | `validation-and-failure-modes.md` | 保留完整门禁和失败分流                 | 已迁移并复核 |
| 插件市场变更加固                           | `plugin-marketplace.md`           | 平台 schema 和安装验证属于专题细节     | 已迁移并复核 |
