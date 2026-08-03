---
name: install-skills
description: >-
  Use when 用户需要安装、卸载、盘点、规划或分发 AI agent skills，确认全局 skills 来源、目录级链接目标、项目级候选目录或特殊安装策略时。
user-invocable: true
metadata:
  version: "1.0.3"
---

# install-skills

## 职责边界

本技能是 skills 的清单与调度入口，不提供安装脚本，也不维护第二份 skills 副本。规范源目录为 `~/.agents/skills`。

- 本技能仍负责通用 skills 安装规划、安装命令确认、多 agent 同步目标判断，以及全局安装完成后的同步调度闭环。
- 对已验证的目录级链接目标，将具体安装动作交给 `sync-local-global-agents-skills`。
- 对未验证的 agent 或项目级目录，只记录候选与前置核验项；不得凭印象编造独立 skills 目录。
- 已验证目标只能调度 `sync-local-global-agents-skills` 执行目录级链接、备份和替换。
- 待验证候选或项目级候选只做核验和决策记录，不执行链接、复制或替换。

## 已给完整 CLI 安装命令时的短路规则

仅当用户消息已经给出待执行、确认、复述或解释的完整 `skills add` / `npx skills add` 命令，且命令已包含安装源、`--skill` 或具体 skill 名、`-g`、`-y`、明确的 `-a` / `--agent` 目标时，才进入本短路规则。此时先做最小检查；检查通过后，按用户意图执行原命令，或按用户语义原样复述该命令。

最小检查只包括：

- 用户意图是执行命令，还是只要求确认、复述或解释命令。
- 安装源 URL 是否指向用户已确认的可信 skills 目录；不能根据当前工作区目录或未验证来源自行改写。来源不明确时不走本短路规则，回到常规安装规划与核验流程。
- 引号、占位符或明显截断是否破损。
- 目标 agent 列表是否来自用户命令本身。

在原命令尚未执行或尚未按用户语义确认前，禁止把这类任务提前改写为读取 `DEFAULT_PLATFORMS`、调用 `sync-local-global-agents-skills`、进入 release、fallback、agent team 或长计划。原命令成功后，如果用户还要求同步到本地 agent 平台，或任务本身是清单盘点、目录级同步、新平台核验，仍按下方清单流程调度 `sync-local-global-agents-skills`。

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
| CodeBuddy | `~/.codebuddy/skills`                                       | 交给 `sync-local-global-agents-skills` |

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

1. 先区分本次是安装、卸载、盘点还是目录级同步。卸载任务先完成“全局技能卸载流程”；安装和同步任务再确认规范源目录为 `~/.agents/skills`，并确定目标属于已验证目标、待验证候选或项目级候选。
2. 已验证目标调用 `sync-local-global-agents-skills` 执行；其余目标先完成目录语义与兼容性核验。
3. 执行前列出将创建、跳过、备份或替换的目录；执行后确认目标是正确链接，且源目录未被复制为多份副本。卸载场景同时满足 CLI 注册表与目录残留的双重验收。
