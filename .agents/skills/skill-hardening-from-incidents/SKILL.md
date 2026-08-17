---
name: skill-hardening-from-incidents
description: Use when upgrading, hardening, or creating skills from reports, incident reviews, historical lessons, agent-team feedback, or repeated workflow failures
metadata:
  version: "1.2.0"
user-invocable: true
---

# Skill Hardening From Incidents

## 概述

把报告、事故复盘和历史经验升级为 skill 时，目标不是复述事故，而是提炼 future-agent 能直接执行的规则。每条规则都必须来自证据、指向未来行为，并能通过 diff、路径扫描和主代理复核验证。

## 使用场景 / 不使用场景

使用场景：

- 用户要求根据报告、事故复盘、历史经验、Memorix 记忆或 agent team 反馈升级、加固或新建 skill。
- 事故已经有结论，需要把经验沉淀为后续 agent 可复用的流程、警戒项或验证清单。
- 发现多个 skill、根级 AI 记忆或对外分发文档之间存在规则漂移，需要统一修正。

不使用场景：

- 事故仍在排查，根因、修复方式或验证证据还没有定论。
- 用户只是要求修 bug、改实现、跑测试，而没有要求沉淀 skill 规则。
- 可以用脚本、测试或 schema 自动防住的问题；这类约束优先自动化，skill 只记录需要判断的部分。

## 知识保留与迁移协议

`SKILL.md` 是可发现、可执行的入口，不是历史知识的唯一容器。为了避免知识衰减、遗忘或过度删减，必须遵守以下不可逆门禁：

1. 修改前先盘点现有章节、规则、示例、错误模式和验证命令，并为每一块指定保留位置。
2. 从正文删除的**当前仍有效规则**，必须先迁移到 `.agents/skills/skill-hardening-from-incidents/reference/` 下最合适的当前主题文件，再压缩正文。
3. 仅用于保留“拆分前全文 / 旧模板 / 旧规则原貌”的历史快照，必须放到 `reference/archive/<skill-name>/`；禁止与当前规范文件并列放在 `reference/` 顶层。
4. `reference/archive/` 是 **NON-NORMATIVE 历史证据层**。正常 hardening 执行不得加载 archive；只有做知识保留审计、迁移追溯或比较旧规则时才按明确目标读取。
5. 每次迁移都要在 [`reference/README.md`](reference/README.md) 登记“来源章节、目标文件、迁移原因、验证状态”。历史快照的 Deprecated 状态、日期、替代规则和废弃原因统一登记在 archive 索引或迁移台账，不改写原始快照正文。
6. 当前参考文件只能追加或定向修订；如果当前规则过时，保留废弃说明或转入 archive，不得让旧规则继续作为当前规范参与执行。
7. 主文件只保留稳定入口、强制边界和快速检查；细节通过当前参考文件渐进披露。压缩字数不能作为删除知识的理由。
8. 完成前检查孤立标题、失效链接、未登记的删除块、archive 误入活跃导航和重复/冲突规则；任何无法解释的减少都视为未完成。

完整契约见 [`reference/retention-contract.md`](reference/retention-contract.md)。

## 当前规则与历史快照边界

- `reference/*.md`：当前、可执行、可作为 future-agent 真值的规则。
- `reference/archive/README.md`：历史快照索引与替代关系。
- `reference/archive/<skill>/...`：历史证据，只用于审计/追溯；不能作为当前技能执行规则。
- 如果当前规则与 archive 内容冲突，以当前 `SKILL.md` + 当前 `reference/*.md` 为准；archive 只解释“过去是什么”，不能反向覆盖当前规则。

## 核心执行流程

1. **界定写集**：明确本轮允许修改的 skill、当前参考文件、历史 archive、根级 AI 记忆和（如适用）对外分发入口；不确定时先问用户。
2. **建立基线**：在编辑前运行压力场景或静态断言，记录当前缺口和可复现的失败输出。
3. **读取证据**：核对用户材料、当前 skill、相关 diff、根级 AI 记忆、同类事故和发布/同步元数据；默认不读 archive，只有迁移审计需要时才定向读取。
4. **提炼规则**：按“现象 → 根因 → 错误诱因 → 未来规则 → 验证方式”编写，禁止把事故流水账直接贴进正文。
5. **迁移与编辑**：当前有效规则先迁移到当前 reference；历史原貌先归档到 `reference/archive/<skill>/` 并登记，再用最小补丁更新入口；不得顺手格式化无关文件。
6. **独立验证**：主代理亲自查看最终 diff，执行 frontmatter、链接、路径污染、内容保留、archive 隔离和关键命令检查；不能只相信子代理报告。
7. **同步收口**：需要时同步根级 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md`；有 Memorix MCP 时记录决策链和完成状态，并 resolve 已完成任务。

## 写入目标与证据读取

项目局部、对外分发、全局 skill、根级 AI 记忆和 Memorix 的边界及读取清单见 [`reference/workflow-boundaries.md`](reference/workflow-boundaries.md)。局部经验不得误塞进对外分发 skill；对外 skill 的示例必须以安装后目录为基准。

## 规则提炼

好的规则必须是可操作约束，例如：`对外分发 skill 的示例路径必须以安装目录为基准`。坏的规则是无法执行或验证的流水账，例如：`某次任务忘记改 README，后来又补了两次`。完整的五步提炼法见 [`reference/rule-extraction.md`](reference/rule-extraction.md)。

## agent team 闭环

涉及 agent team 时，主代理、编辑子代理和验证子代理的职责、授权边界、旧任务隔离及证据要求，按 [`reference/agent-team-loop.md`](reference/agent-team-loop.md) 执行。主代理始终保留最终复核责任。

## 验证与失败分流

验证门禁、路径污染扫描模板、常见错误和完成条件见 [`reference/validation-and-failure-modes.md`](reference/validation-and-failure-modes.md)。验证结果必须能回到文件 diff 或命令输出，而不是只写“已检查”。

## 插件市场变更加固

涉及 AI 插件市场时，按 [`reference/plugin-marketplace.md`](reference/plugin-marketplace.md) 建立客户端到安装验证的映射，并同时覆盖维护入口和用户入口。

## 最终边界

- 目标写集与实际 diff 完全一致，没有无关文件修改。
- skill 内容是 future-agent 可执行流程，不是事故叙事。
- 三类 skill 边界清楚，没有把本仓库路径假设泄露到对外分发 skill。
- 被正文移除的当前规则均已进入当前 `reference/`；历史原貌进入 `reference/archive/<skill>/` 并登记。
- archive 没有进入正常执行阅读路线，也没有被当作当前真值。
- 根级 AI 记忆和 Memorix 已按需同步。
- 主代理完成独立验证，并明确剩余风险或待人工确认项。
