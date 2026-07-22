---
name: install-skills
description: >-
  Use when 用户需要盘点、规划或分发 AI agent skills，确认全局 skills 来源、目录级链接目标、项目级候选目录或特殊安装策略时。
user-invocable: true
metadata:
  version: "1.0.0"
---

# install-skills

## 职责边界

本技能是 skills 的清单与调度入口，不提供安装脚本，也不维护第二份 skills 副本。规范源目录为 `~/.agents/skills`。

- 对已验证的目录级链接目标，将具体安装动作交给 `sync-local-global-agents-skills`。
- 对未验证的 agent 或项目级目录，只记录候选与前置核验项；不得凭印象编造独立 skills 目录。
- 已验证目标只能调度 `sync-local-global-agents-skills` 执行目录级链接、备份和替换。
- 待验证候选或项目级候选只做核验和决策记录，不执行链接、复制或替换。

## 清单来源与同步维护纪律

已验证可执行目标的权威来源不是本文档表格，而是已安装的 `sync-local-global-agents-skills` 技能内部的 `src/platforms.ts`。使用本技能前，先通过当前 agent 的 skills 注册表、`skills list` 输出，或当前全局 skills 根目录中的技能名称，定位 `sync-local-global-agents-skills` 的安装目录；定位成功后读取该技能目录下的 `src/platforms.ts`，以其中的 `DEFAULT_PLATFORMS` 为准确认当前可执行目标。不要把仓库源码相对路径、当前项目目录，或 `install-skills` 自身目录的相对路径当作稳定运行时路径。

本文件中的“已验证可执行目标”表只是面向 agent 的可读摘要，不是第二份独立真理源。维护清单时必须遵守双向同步：

- 如果新增、删除或重命名已验证可执行目标，先更新 `sync-local-global-agents-skills/src/platforms.ts` 的 `DEFAULT_PLATFORMS`，再同步更新本文档摘要。
- 如果只想记录待验证 agent，不要改 `DEFAULT_PLATFORMS`；只能写在“生态入口与待验证候选”中，并保留核验条件。
- 如果本文档摘要与已定位同步技能中的 `DEFAULT_PLATFORMS` 不一致，以 `DEFAULT_PLATFORMS` 为准，并立即修正文档漂移。
- 如果无法定位已安装的 `sync-local-global-agents-skills`，或其 `src/platforms.ts` 不存在，停止宣称“已验证可执行目标”，先报告缺失依赖；本文档表格只能作为发布时快照辅助排查，不能作为运行时权威清单。

## 已验证可执行目标

以下目标是本技能发布时从 `DEFAULT_PLATFORMS` 摘录的可读快照，已由 `sync-local-global-agents-skills` 证实支持从 `~/.agents/skills` 建立目录级链接。实际执行前仍应重新定位已安装的同步技能并读取其 `DEFAULT_PLATFORMS`：

| 平台      | 目标目录                                                    | 调度策略                               |
| :-------- | :---------------------------------------------------------- | :------------------------------------- |
| WorkBuddy | `~/.workbuddy/skills`                                       | 交给 `sync-local-global-agents-skills` |
| QoderWork | `~/.qoderworkcn/skills`                                     | 交给 `sync-local-global-agents-skills` |
| Kimi Work | `~/AppData/Roaming/kimi-desktop/daimon-share/daimon/skills` | 交给 `sync-local-global-agents-skills` |

## 生态入口与待验证候选

Claude Code、Codex、Cursor、Antigravity、Trae、Qoder 等通常通过全局 skills 目录或 `skills` CLI 生态读取 skills。未在已验证资料中确认独立 skills 目录时，只能视为待验证候选，不能据此创建链接或复制目录。

确认新目标前，至少核验：

1. 该 agent 是否读取 `~/.agents/skills` 或具有公开、稳定的独立 skills 根目录。
2. 独立目录是否只承担 skills 根目录职责，且不与配置、缓存或其他资源混合。
3. 该 agent 是否接受目录级符号链接或需要其自身的安装机制。

## 项目级候选目录

以下目录是项目级候选，而非默认批量链接目标：

| 候选目录         | 处理原则                                          |
| :--------------- | :------------------------------------------------ |
| `.agents/skills` | 先确认项目授权与当前 agent 的读取语义。           |
| `.claude/skills` | 先确认 Claude Code 的项目级发现规则与已有内容。   |
| `.agent/skills`  | 先确认所属 agent 的目录语义，避免误接管混合目录。 |

项目级同步不得默认批量软链接。必须按单个项目、单个 agent 确认授权、目录职责和覆盖范围后再处理。

## 目录级链接策略

- 仅当目标目录只承担 skills 根目录职责时，使用目录级链接。
- 目标不存在时可创建链接；已是指向规范源目录的正确链接时跳过。
- 目标为真实目录时，先备份，再替换为链接。
- 目标是指向错误位置的链接时，先核实后重建。
- 目标目录职责不确定、含混合配置，或无法确认链接兼容性时，不自动替换；保留现状并请求进一步确认。

## 调度与验收

1. 确认规范源目录为 `~/.agents/skills`，并确定本次目标属于已验证目标、待验证候选或项目级候选。
2. 已验证目标调用 `sync-local-global-agents-skills` 执行；其余目标先完成目录语义与兼容性核验。
3. 执行前列出将创建、跳过、备份或替换的目录；执行后确认目标是正确链接，且源目录未被复制为多份副本。
