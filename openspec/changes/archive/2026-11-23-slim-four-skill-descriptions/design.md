## Context

固定成本只计 YAML `description`。正文行数是触发后才加载的成本，不在本设计的削减范围。口径：中日韩字符按 1 字 1 token，其余非空白字符按 4 字 1 token，向上取整后相加。数字来自 2026-11-23 对 monorepo 源文件的实测。

| 技能                  | 字符 | 估算 token | 中日韩字符 | 其余非空白 | 正文行 | 形态                     |
| --------------------- | ---: | ---------: | ---------: | ---------: | -----: | ------------------------ |
| use-pnpm              | 1473 |        448 |        154 |       1176 |    290 | 中文长清单后再写英文复述 |
| use-agent-browser     |  777 |        378 |        269 |        433 |    294 | 中文后再写英文复述       |
| init-shadcn-docs-nuxt | 1015 |        356 |        165 |        764 |    355 | 英文后再写中文复述       |
| do-long-task          |  948 |        354 |        192 |        648 |    223 | 中文后再写英文复述       |
| 合计                  | 4213 |       1536 |            |            |        |                          |

整目录链接的 agent（WorkBuddy 双版、Qoder、QoderWork CN、CodeBuddy、Trae CN）每次冷启动都会付这 1536 token。四条技能今天都还在全局，共 74 个技能、描述合计约 7015 token（已卸掉 low-frequency-skill 全部 7 个之后的推算）。

上表的 token 列是这套口径的估算，不是模型账单，也不作为通过条件。验收只认 JavaScript 字符串 `length` ≤ 200，并且与写死的句子逐字相同。字符数已按源文件折叠后的 description 核对过。

## Goals / Non-Goals

**Goals:**

- 四条 description 各降到 200 字符以内，并去掉第二语言复述。
- 触发后行为不变：步骤、禁令和 STOP 条件留在正文。

**Non-Goals:**

- 不改这四份正文里已有的操作步骤。
- 不卸载技能，不改 `metadata` 以外的触发开关来假装省掉列表成本。
- 不在本变更里 `skills update -g`、不跑 `release-ai-plugins`。
- 不处理 `git-commit`。用户已裁决其正文保持现状。

## Decisions

1. 先删第二语言段落，再把留下的那一种语言收成两句。用户会输入、技能名里没有的路由词留在 description。备选是把错误码和目录补进正文：正文只在技能被选中之后才加载，补进去并不恢复冷启动路由。只删英文、保留中文长清单也不行，use-pnpm 的中文段本身仍然远超 200 字符。
2. 试点只改 `use-pnpm`，句子已经写死。它是四条里最肥的。试点 description 与写死的句子逐字相同、正文字句没有 diff，再改另外三条。
3. `skill-registry.json` 由 `ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs` 从 frontmatter 生成 description 和 version。手改描述会在版本一升时让 registry check 失败。实施时只跑 `--apply`，再跑 `--check`。
4. 全局安装副本不在本变更更新。源改完之后，冷启动账单要等发布链路才变。
5. 字符门禁用 JavaScript 字符串 length。文首 token 表不作为通过条件。

## 四条的落笔

实施时使用下面的成品句子，不要再改写。字符数已按 JavaScript 字符串长度点过。四句都装下了要留在冷启动列表里的路由词，所以不改正文。

### use-pnpm

- 文件：`ai-plugins/common-tools/skills/use-pnpm/SKILL.md`
- 版本：`1.0.0` → `1.0.1`
- 新 description（196 字符）：`当用户要处理 pnpm 安装、workspace 命令、npm/npx/yarn 替换，或排查 pnpm 12 的 allowBuilds、blockExoticSubdeps、Corepack、self-update 假成功、全局 shim、pnpm ls -g 空列表、NVM Desktop 与 ERR_PNPM_* 时使用。不要用于与 pnpm 无关的 Node、Git 或业务代码。`
- 正文：「When to Use」里已有这些错误码和表象。不新增章节，不改已有句子。这句已经 196 字符，再放入 35 字符的 `manage-package-manager-versions` 会超过 200。同类表象用 self-update、shim 和 `pnpm ls -g` 空列表留在描述里。

### use-agent-browser

- 文件：`ai-plugins/dev-skills/skills/use-agent-browser/SKILL.md`
- 版本：`1.6.0` → `1.6.1`
- 新 description（78 字符）：`当用户要用 agent-browser 打开网页、做可见浏览器验收，或排查 MCP 浏览器超时时使用。不要用于与浏览器无关的改码，也不承担残留进程批量清理。`
- 正文：`--input-mode human`、`highlight`、`--pin-tab` 已在「可视化与标签聚合」和标准工作流里。技能名里已有 agent-browser。不新增章节，不改已有句子。

### init-shadcn-docs-nuxt

- 文件：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/SKILL.md`
- 版本：`1.9.3` → `1.9.4`
- 新 description（126 字符）：`当用户要搭建、迁移或排查 shadcn-docs-nuxt 文档站，或处理 Nuxt Content、MDC、prerender、Windows 构建失败与 FUNCTION_INVOCATION_FAILED 时使用。不要用于普通 Nuxt 业务页。`
- 正文：`FUNCTION_INVOCATION_FAILED` 不在「故障检修入口」，所以留在 description。其余旧描述里的错误码已在该入口或 references。不把整份错误码清单再贴一次，不改已有句子。

### do-long-task

- 文件：`ai-plugins/common-tools/skills/do-long-task/SKILL.md`
- 版本：`1.5.1` → `1.5.2`
- 新 description（130 字符）：`当用户要执行、续跑、交接或验收同目录含 spec.md、plan.md、handoff.md 的任务包，包括 docs/plan、docs/prompts、docs/one-use，或生成 /goal 长任务提示词时使用。不要用于短改、问答和尚未执行的纯计划。`
- 正文：`docs/plan`、`docs/prompts`、`docs/one-use` 只出现在旧描述里，所以留在新 description，不追加到「什么时候用」。`/goal` 已在「提示词生成模式」。不改已有句子。

## Risks / Trade-offs

- [描述变短后低等级模型少看到错误码] → 不含技能名的路由词留在 description。四句都在 200 字符内，不用改正文来补路由。
- [196 字符的句子再放入 `manage-package-manager-versions` 会超过 200] → 这个词留在 use-pnpm 正文。描述保留 self-update、全局 shim、`pnpm ls -g` 空列表。不放宽到第二语言。
- [`FUNCTION_INVOCATION_FAILED` 不在故障检修入口] → 留在 init-shadcn-docs-nuxt 的 description。触发后的步骤仍在 `references/incident-repair.md`。不把整份旧清单贴回正文。
- [只改源、不更新全局副本] → 本变更完成时，本机 `~/.agents/skills` 的账单不变。这是发布边界，不是漏改。

## Migration Plan

1. 把 `use-pnpm` 的 description 换成写死的句子，`metadata.version` 改为 `1.0.1`。正文不改。
2. 用 JavaScript 字符串 length 重数。句子不是逐字相同、超过 200，或正文出现 diff，就停，不继续另外三条。
3. 通过后改另外三份 `SKILL.md` 的 description 和 version。正文不改。
4. 运行 `node ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs --apply`，再运行同脚本 `--check`。
5. 回退方式：还原四份 `SKILL.md` 和 `skill-registry.json`。不涉及已安装副本。

## Open Questions

2026-11-23 关闭。用户否决「收成单语」。双语 description 是 flash 模型的触发面。四份 `SKILL.md` 已恢复改前全文。本设计的短句不实施，生成器不跑，delta spec 不同步到主规范。前因后果见 `proposal.md` 的「放弃」。
