---
name: skill-hardening-from-incidents
description: Use when upgrading, hardening, or creating skills from reports, incident reviews, historical lessons, agent-team feedback, or repeated workflow failures
metadata:
  version: "1.0.0"
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

## 先定写入目标

动手前先写下本轮允许写入的目标清单，并在执行中严格遵守：

- 项目局部 skill：写入 `.agents/skills/<skill-name>/SKILL.md`，适合仓库特有流程、路径约束、agent team 协作规则；新增或改名时同步根级 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 技能表。
- 对外分发 skill：写入 `ai-plugins/*/skills/<skill-name>/`，内容必须站在安装后目录视角；不要写入本机绝对路径、开发期报告、monorepo 内部测试路径、CI 路径或仅本仓库可见的临时材料。命令示例使用安装目录内的相对路径，例如 `scripts/sync.ts`。
- 全局 skill：写入用户全局技能目录，适合跨项目通用规则；不要假设当前 monorepo 的目录、包名、脚本或私有约束存在。
- 根级 AI 记忆：只记录会影响整个仓库未来 agent 行为的规则；三份文档必须保持等价更新。
- Memorix：用于跨会话收口，记录决策链和完成状态；有可用 MCP 时优先使用项目作用域和稳定 `topicKey`。

如果写入目标、skill 类型或同步范围不明确，先问用户，不要用猜测扩大写集。

## 证据材料读取清单

不要只读二手总结。至少核对这些材料中与本次目标相关的部分：

- 用户给出的报告、事故复盘、历史经验、review 评论或 handoff。
- 当前要加固的 `SKILL.md`，包括 frontmatter、触发条件、常见错误、完成条件。
- 相关 diff：确认实际改了什么，而不是只相信子代理报告。
- 根级 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 中的技能表和已有规则，避免重复或冲突。
- 相关 Memorix 记忆：查找同一事故、同类 skill、路径污染、发布或同步问题。
- 若涉及对外分发 skill，额外检查 README、CHANGELOG、plugin/marketplace 元数据和安装后路径假设。

证据不足时，只能记录待确认问题；不能把猜测写成规则。

## 提炼规则的方法

把事故材料压缩成 future-agent 规则时，按这个顺序写：

1. 现象：未来 agent 会看到什么信号。
2. 根因：真正导致错误的判断、路径、流程或角色问题。
3. 错误诱因：agent 当时为什么会合理化错误做法。
4. 未来规则：以后必须先做什么、禁止做什么、如何判断边界。
5. 验证方式：用什么 diff、扫描、命令或人工复核证明规则被落实。

好的规则像操作约束：`对外分发 skill 的示例路径必须以安装目录为基准`。

坏的规则像流水账：`某天某个 agent 在某次任务里忘记改 README，后来又补了两次`。

## agent team 闭环

涉及 agent team 时，至少分清三类角色：

- 主代理：界定目标写集、分配角色、合并结论；最终必须亲自查看 diff 和目标文件，不能只转述子代理报告。
- 编辑子代理：只在被授权文件内做小补丁，记录证据来源、未验证项和风险；不能重写大文件或顺手格式化无关文件。
- 验证子代理：独立检查最终文件、路径污染、frontmatter、触发条件、常见错误和 AI 记忆同步；输出可复核的检查点。

闭环要求：

- 开始前清理或忽略旧 agent team 的过期任务、旧 handoff、旧计划，避免把前一轮目标带入本轮。
- 每个子代理报告都必须落到文件 diff 或命令结果上。
- 主代理完成独立验证后，再把最终规则同步到 AI 记忆和 Memorix。

## 编辑准则

- description 只写触发条件，必须以 `Use when...` 开头；不要概括 workflow。
- skill 正文写可复用流程、判断标准和验证清单，不写本次会话流水账。
- 使用小补丁修改，避免重写整份大文件。
- 保持项目局部 skill、对外分发 skill、全局 skill 的边界清楚；局部经验不要误塞进对外分发 skill。
- 对外分发 skill 的示例、脚本、引用文件均以安装目录为基准，避免仓库源码视角污染用户安装后的使用体验。
- 同步根级 AI 记忆时，三份文档使用同一条目、同一措辞、同一插入位置。

## 验证清单

完成前逐项检查：

- 新增或修改的 skill 有 YAML frontmatter，至少包含 `name`、`description`；按项目要求补齐 `metadata.version` 和 `user-invocable`。
- `description` 以 `Use when...` 开头，只描述触发条件，不写流程摘要。
- 正文覆盖写入目标、证据读取、规则提炼、角色闭环、编辑准则、验证清单、常见错误和完成条件。
- 根级 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 的技能表同步一致。
- 主代理查看实际 diff，而不是只信子代理总结。
- 对目标 skill 运行路径污染扫描；若是对外分发 skill，拒绝本机绝对路径、开发期报告、monorepo 内部测试/CI 路径。
- 有 Memorix MCP 时，存储本次决策链或完成状态，并 resolve 过期任务记忆。

路径污染扫描要按目标文件收窄执行，并把占位项替换为当前任务的风险模式：

```powershell
rg -n "<本机绝对路径>|<用户目录>|<开发期报告目录>|<CI 工作流目录>|<内部测试目录>" <target-files>
```

扫描命中不一定都是错误；要按 skill 类型判断。对外分发 skill 的命中通常需要删除或改成安装目录相对描述。

## 常见错误

| 错误                           | 修正                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| 直接贴事故流水                 | 改写成现象、根因、未来规则、验证方式                                               |
| 只改 `SKILL.md` 不同步 AI 记忆 | 新增或改名项目局部 skill 时，同步根级三份 AI 记忆文档                              |
| 只信子代理报告不看 diff        | 主代理必须亲自查看 diff、目标文件和关键命令输出                                    |
| 没清理旧 agent team            | 开始前确认旧任务、旧 handoff、旧计划不会污染本轮目标                               |
| description 写 workflow 摘要   | description 只写 `Use when...` 触发条件                                            |
| 把局部经验误塞进对外分发 skill | 局部规则写项目局部 skill 或根级 AI 记忆；对外分发 skill 只保留安装后用户可复用规则 |
| 对外分发 skill 暴露开发路径    | 改为安装目录相对路径，移除本机绝对路径、开发期报告、内部测试/CI 路径               |
| 完成后不收口 Memorix           | 有 MCP 时存储决策链、文件变化和下一步，并 resolve 已完成任务                       |

## 完成条件

- 目标写集与实际 diff 完全一致，没有无关文件修改。
- skill 内容是 future-agent 可执行流程，不是事故叙事。
- 三类 skill 边界清楚，尤其没有把本仓库路径假设泄露到对外分发 skill。
- 根级 AI 记忆和 Memorix 已按需同步。
- 主代理完成独立验证，并明确剩余风险或待人工确认项。

## 插件市场变更加固

当经验涉及 AI 插件市场时，先建立“客户端 -> marketplace -> plugin manifest -> 已发布组件 -> 安装文档 -> 验证命令”的映射。共享 skills 可以复用，但必须按目标客户端 schema 声明；禁止把一个客户端专属的 hooks、commands、agents 或相对路径假设复制到另一个客户端。

规则写入时必须同时覆盖维护入口和用户入口：市场与 manifest、各平台 README、总览文档、CHANGELOG，以及后续发版 skill 的同步清单。验证规则要区分静态 JSON/schema 校验与真实 CLI 安装；若为测试临时安装了 marketplace 或插件，完成条件必须包含对应的 remove 命令和无残留检查。
