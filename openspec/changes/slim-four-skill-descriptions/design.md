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

1. 先删第二语言段落，再把留下的那一种语言收成两句。错误码清单从描述移到正文已有的何时使用章节。备选是只删英文、保留中文长清单：use-pnpm 的中文段本身仍然远超 200 字符，固定成本掉不下来。
2. 试点只改 `use-pnpm`。它是四条里最肥的，也是「长清单 + 全文翻译」最清楚的样本。试点描述达到 200 字符并且正文步骤未改，再改另外三条。
3. `skill-registry.json` 的描述与 frontmatter 保持同一字符串。注册表是发现清单，留着旧描述会让另一条读取路径继续付旧成本。
4. 全局安装副本不在本变更更新。源改完之后，冷启动账单要等发布链路才变。

## 三条的落笔

实施时使用下面的成品句子，不要再改写。字符数已按 JavaScript 字符串长度点过。触发词若已在正文出现，就不新增章节。

### use-agent-browser

- 文件：`ai-plugins/dev-skills/skills/use-agent-browser/SKILL.md`
- 版本：`1.6.0` → `1.6.1`
- 新 description（78 字符）：`当用户要用 agent-browser 打开网页、做可见浏览器验收，或排查 MCP 浏览器超时时使用。不要用于与浏览器无关的改码，也不承担残留进程批量清理。`
- 正文：`--input-mode human`、`highlight`、`--pin-tab` 已在「可视化与标签聚合」和标准工作流里。不新增章节，不改已有句子。

### init-shadcn-docs-nuxt

- 文件：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/SKILL.md`
- 版本：`1.9.3` → `1.9.4`
- 新 description（99 字符）：`当用户要搭建、迁移或排查 shadcn-docs-nuxt 文档站，或处理 Nuxt Content、MDC、prerender 与 Windows 构建失败时使用。不要用于普通 Nuxt 业务页。`
- 正文：错误码和信号已在「故障检修入口」。不把旧描述里的错误码清单再贴一次，不改已有句子。

### do-long-task

- 文件：`ai-plugins/common-tools/skills/do-long-task/SKILL.md`
- 版本：`1.5.1` → `1.5.2`
- 新 description（85 字符）：`当用户要执行、续跑或交接含 spec.md、plan.md、handoff.md 的任务包，或生成 /goal 长任务提示词时使用。不要用于短改、问答和尚未执行的纯计划。`
- 正文：在「什么时候用」已有列表末尾追加一条，不改写已有条目：`- 任务包所在目录包括 docs/plan、docs/prompts、docs/one-use。`
- `/goal` 已在「提示词生成模式」。不重复添加，不改该节。

## Risks / Trade-offs

- [描述变短后低等级模型少看到错误码] → 错误码逐字留在正文何时使用章节，触发后仍能读到。
- [200 字符装不下全部产品名] → 产品名和一类场景留在描述，枚举放正文。不放宽到第二语言。
- [只改源、不更新全局副本] → 本变更完成时，本机 `~/.agents/skills` 的账单不变。这是发布边界，不是漏改。

## Migration Plan

1. 改 `use-pnpm` 的 description，并按需把缺失错误码补进正文何时使用章节。
2. 用同一口径重测字符数。超过 200 或正文步骤出现非逐字改动，就停，不继续另外三条。
3. 通过后改另外三份 `SKILL.md`，再改 `skill-registry.json`。
4. 回退方式：还原这五个文件的 description 相关 diff。不涉及已安装副本。

## Open Questions

无。发布时机留到本变更之外，不改变本设计的做法。
