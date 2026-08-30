---
name: install-skills
description: >-
  Use when 用户需要安装、卸载、盘点、规划或分发 AI agent skills，确认全局 skills 来源、目录级链接目标、项目级候选目录或特殊安装策略，或排查清除 Kimi Desktop（Daimon）等第三方供应器对全局技能目录的污染时。
user-invocable: true
metadata:
  version: "1.1.0"
---

# install-skills

## 第一步：完整 CLI 命令即时执行

这是最常见、优先级最高的场景，先于本文件后续任何规划、核验或同步章节判断。

仅当用户消息已经给出待执行、确认、复述或解释的完整 `skills add` / `npx skills add` 命令，且命令已包含安装源、`--skill` 或具体 skill 名、`-g`、`-y`、明确的 `-a` / `--agent` 目标时，才进入本规则。此时只做以下最小检查；检查通过后，按用户意图立即执行原命令，或原样确认、复述该命令。

最小检查只包括：

- 用户意图是执行命令，还是只要求确认、复述或解释命令。
- 安装源是否指向用户已确认可信的 skills 目录；不能根据当前工作区目录或未验证来源自行改写。来源不明确时不走本规则，回到常规安装规划与核验流程。
- 引号、占位符或明显截断是否破损。
- 目标 agent 列表是否来自用户命令本身。

在原命令尚未执行或尚未按用户语义确认前，禁止读取 `DEFAULT_PLATFORMS`、定位或调用 `sync-local-global-agents-skills`、盘点目标、进入 release、fallback、agent team 或长计划。原命令成功后，查看安装摘要验收即可；只有用户额外要求同步到本地 agent 平台、站点清理、清单盘点、目录级同步或新平台核验时，才进入下方对应流程。

后续的“已验证可执行目标”“目录级链接”和 `DEFAULT_PLATFORMS` 全部属于目录级链接同步，即 `sync-local-global-agents-skills` 的职责；它们与 `skills add ... -a <agent>` 的 CLI 安装无关，命中本规则时无需阅读或执行。

## 任务类型速查

| 用户请求                       | 出口                                   | 需要读的章节                           |
| :----------------------------- | :------------------------------------- | :------------------------------------- |
| 给出完整 `skills add` 命令     | **按用户意图直接执行，看摘要验收**     | 仅“第一步”                             |
| 盘点、规划，或安装命令信息不全 | 最小检查后给出规划或确认               | “职责边界”“调度与验收”                 |
| 卸载或删除 skills              | `skills remove` + 双重验收             | “全局技能卸载流程”                     |
| 同步已安装 skills 到本地平台   | 调度 `sync-local-global-agents-skills` | “已验证可执行目标”至“调度与验收”       |
| 排查或清除第三方污染           | 标记文件检测 + 黑名单清除              | “Kimi Desktop（Daimon）污染排查与清除” |

## 职责边界

本技能是 skills 的清单与调度入口，不提供安装脚本，也不维护第二份 skills 副本。规范源目录为 `~/.agents/skills`。

- 负责通用 skills 的安装规划、命令确认、多 agent 同步目标判断，以及全局安装后的同步调度闭环。
- 已验证的目录级链接目标，具体安装动作交给 `sync-local-global-agents-skills`。
- 未验证的 agent 或项目级目录只记录候选与前置核验项；不得凭印象编造独立 skills 目录、链接、复制或替换目录。

## 全局技能卸载流程

当用户要求删除、卸载或移除某个全局 skill、某组 skills，或要求某类技能不再被多个 agent 入口发现时，必须优先使用 `skills remove`。文件系统删除只能处理 CLI 无法管理的已确认残留，不能替代正式卸载。

### 标准顺序

1. 先写明任务契约：要卸载的技能或主题范围、必须不再显示的 agent 入口、验收 pattern，以及“不把物理删除作为主路径”的限制。
2. 使用 `skills list -g --json`，或用户指定 agent 的 `skills list -g -a <agent...> --json`，盘点已注册候选。
3. 当用户给出产品、厂商或主题系列时，同时按名称、别名、description 和用户范围词识别候选；不能只按一个前缀匹配。删除前列出候选，若保留同义技能，必须说明理由。
4. 对已注册的目标使用 `skills remove -g -y <skill...>`。不要默认传 `-a '*'`；若当前 CLI 不接受该通配符，省略 `-a`，以 CLI 实际管理范围和输出为准。
5. 卸载成功后，按已安装 `sync-local-global-agents-skills` 的说明同步已验证平台。同步器只负责卸载后的分发和链接收敛，不替代 `skills remove`。
6. 用 CLI 注册表和实际目录做双重验收；任一侧仍有未解释的匹配时，不得声称完成。

### 文件系统兜底边界

只有同时满足以下条件，才能检查或处理文件系统残留：

- `skills remove -g -y <skill>` 明确报告找不到目标，或目标已不在 `skills list --json` 注册表中。
- 规范源目录、已验证同步目标或用户明确指定的 agent 目录仍有目标残留。
- 已确认残留是坏链接、空目录或 CLI 不管理的旧目录，并回读其绝对路径、`LinkType` 和 `Target`。
- 操作范围只包含该残留项，且不会触及规范源目录之外的非目标内容。

对 junction 或 symlink 只能移除链接本身，不能递归删除其目标。目录职责、链接目标或影响范围任一项不明确时，停止并向用户说明待确认信息。

### 卸载验收

卸载开始前先确定目标 pattern。完成前至少检查以下两类证据：

```powershell
$items = skills list -g --json | ConvertFrom-Json
$matches = @($items | Where-Object {
  $_.name -match '<pattern>' -or $_.path -match '<pattern>'
})
"MATCH_COUNT=$($matches.Count)"
```

- CLI 注册表中目标 pattern 的 `MATCH_COUNT` 为 `0`。
- `~/.agents/skills`、从 `DEFAULT_PLATFORMS` 确认的已验证同步目标，以及用户明确要求覆盖的 agent skills 目录中，目标 pattern 的匹配数均为 `0`。

若保留某个同义或关联 skill，或残留目录不归 CLI 管理，必须逐项说明其来源、是否注册、保留或后续处理理由。

## Kimi Desktop（Daimon）污染排查与清除

Kimi Desktop 的 Daimon 供应器（`kimi-daimon setup`）会把内置技能作为固定步骤写入规范源目录 `~/.agents/skills`。这些技能不是 `skills` CLI 安装的，注册表没有来源记录，会污染所有 agent 共享的技能面，且随 Kimi Desktop 更新或重新供应再次写入。

### 污染检测

发现全局技能目录出现用户未主动安装的 skills，或例行盘点时，先检查标记文件：`~/.agents/skills/.daimon-managed-builtin-skills.json`。标记文件存在即为 Kimi Desktop 污染证据；其 `skills` 数组是本次清除黑名单，`sourceRoot` 指向 Kimi Desktop 应用内的捆绑技能源。

### 清除流程

1. 读取标记文件的 `skills` 数组作为黑名单；黑名单是动态的，不得硬编码技能名或数量。
2. 校验黑名单条目合法性：仅处理符合 `^[a-z0-9][a-z0-9-]*$` 的名称，其余报告并跳过。
3. 删除前逐条取证：`lstat` 确认每个条目类型；是符号链接时只移除链接本身；是真实目录时，将其 `SKILL.md` 与 `sourceRoot` 比对确认归属；内容不一致时记录为版本漂移，仍按黑名单处理但如实报告。
4. 删除每个黑名单条目对应目录，最后删除标记文件本身；标记文件删除后，污染检测才可复现。
5. 双重验收：`~/.agents/skills` 中黑名单目录残留为 `0`、标记文件不存在、各 agent 入口不再列出对应技能。

### 边界与复发警示

- 只删除黑名单点名的技能；用户通过 `skills add` 或其他途径安装的同名技能不得误删。用户需要其他厂商的同名技能时，删除后通过 `skills add` 流程重装。
- Kimi Desktop 更新或 Daimon 重新供应会再次写入这些内置技能并重建标记文件；每次 Kimi Desktop 更新后，若要保持全局目录干净，重新执行本流程。
- 证据链、事件时间线与历史清除记录见 [`references/kimi-desktop-daimon-contamination.md`](references/kimi-desktop-daimon-contamination.md)。

## 已验证可执行目标

以下目标是本技能发布时从 `DEFAULT_PLATFORMS` 摘录的可读快照，已由 `sync-local-global-agents-skills` 证实支持从 `~/.agents/skills` 建立目录级链接。实际执行前仍应重新定位已安装的同步技能并读取其 `DEFAULT_PLATFORMS`：

> 本表仅描述从 `~/.agents/skills` 建立目录级链接的平台可执行目标，属于 `sync-local-global-agents-skills` 的职责范围。**不适用于 `skills add ... -a <agent>` 的 CLI 安装语义**：CLI 安装目标由 skills CLI 原生支持，与是否在本表内无关，无需核验本表。

| 平台      | 目标目录                                                    | 调度策略                               |
| :-------- | :---------------------------------------------------------- | :------------------------------------- |
| WorkBuddy | `~/.workbuddy/skills`                                       | 交给 `sync-local-global-agents-skills` |
| QoderWork | `~/.qoderworkcn/skills`                                     | 交给 `sync-local-global-agents-skills` |
| Kimi Work | `~/AppData/Roaming/kimi-desktop/daimon-share/daimon/skills` | 交给 `sync-local-global-agents-skills` |
| CodeBuddy | `~/.codebuddy/skills`                                       | 交给 `sync-local-global-agents-skills` |
| Qoder     | `~/.qoder/skills`                                           | 交给 `sync-local-global-agents-skills` |

Qoder 指 Qoder IDE 与 Qoder agent 本体，专属 skills 目录为 `~/.qoder/skills`。不得与同机其他形似目录混淆：`~/.qoder-cli`（Qoder CLI）、`~/.qoder-cn`（Qoder CN IDE）、`~/.qoderwork` 与 `~/.qoderworkcn`（QoderWork / QoderWork CN，其中 `~/.qoderworkcn/skills` 已作为 QoderWork 平台单列）。

## 生态入口与待验证候选

Claude Code、Codex、Cursor、Antigravity、Trae 等通常通过全局 skills 目录或 `skills` CLI 生态读取 skills。未在已验证资料中确认独立 skills 目录时，只能视为待验证候选，不能据此创建链接或复制目录。

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

1. 先区分本次是安装、卸载、盘点还是目录级同步。卸载任务先完成“全局技能卸载流程”；安装和同步任务再确认规范源目录为 `~/.agents/skills`，并确定目标属于已验证目标、待验证候选或项目级候选。
2. 已验证目标调用 `sync-local-global-agents-skills` 执行；其余目标先完成目录语义与兼容性核验。
3. 执行前列出将创建、跳过、备份或替换的目录；执行后确认目标是正确链接，且源目录未被复制为多份副本。卸载场景同时满足 CLI 注册表与目录残留的双重验收。

## 仅维护者查阅：清单来源与同步维护纪律

已验证可执行目标的权威来源不是本文档表格，而是已安装的 `sync-local-global-agents-skills` 技能内部的 `src/platforms.ts`。维护本技能时，通过当前 agent 的 skills 注册表、`skills list` 输出或当前全局 skills 根目录中的技能名称定位该技能目录；定位成功后读取其 `src/platforms.ts`，以 `DEFAULT_PLATFORMS` 为准确认当前可执行目标。不要把仓库源码相对路径、当前项目目录或 `install-skills` 自身目录的相对路径当作稳定运行时路径。

本文件中的“已验证可执行目标”表只是面向 agent 的可读摘要，不是第二份独立真理源。维护清单时必须遵守双向同步：

- 新增、删除或重命名已验证可执行目标时，先更新 `sync-local-global-agents-skills/src/platforms.ts` 的 `DEFAULT_PLATFORMS`，再同步更新本文档摘要。
- 只记录待验证 agent 时，不要改 `DEFAULT_PLATFORMS`；只能写在“生态入口与待验证候选”中，并保留核验条件。
- 本文档摘要与已定位同步技能中的 `DEFAULT_PLATFORMS` 不一致时，以 `DEFAULT_PLATFORMS` 为准，并立即修正文档漂移。
- 无法定位已安装的 `sync-local-global-agents-skills`，或其 `src/platforms.ts` 不存在时，停止宣称“已验证可执行目标”，先报告缺失依赖；本文档表格只能作为发布时快照辅助排查，不能作为运行时权威清单。
