## Purpose

约束会进入 agent 冷启动技能列表的 YAML description：单语、有长度上限，避免同一份触发词用第二种语言再付一次。

## ADDED Requirements

### Requirement: 固定描述单语且不超过 200 字符

`use-pnpm`、`use-agent-browser`、`init-shadcn-docs-nuxt`、`do-long-task` 的 frontmatter `description` MUST 使用一种语言，字符数 MUST 小于或等于 200。同一份触发场景 MUST NOT 再用另一种语言复述。

#### Scenario: 描述收短后仍能判断何时使用

- **WHEN** 读取上述任一技能的 frontmatter `description`
- **THEN** 文本包含一类触发场景和一句不适用边界
- **AND** 字符数小于或等于 200
- **AND** 不存在把同一段触发词再翻译一遍的第二语言段落

### Requirement: 只存在于描述中的触发词必须留在正文

若某个错误码或触发词只写在被删的描述里、正文还没有，实施时 MUST 把该词逐字补进该技能已有的何时使用章节。已有的操作步骤 MUST 保持逐字不动。

#### Scenario: 错误码不随描述一起消失

- **WHEN** 收短 `use-pnpm` 的 description，且某个错误码只出现在旧描述中
- **THEN** 该错误码出现在 `use-pnpm` 正文已有的何时使用章节
- **AND** 该章节以外的操作步骤与改前逐字相同

### Requirement: use-agent-browser 的固定描述使用指定文本

`ai-plugins/dev-skills/skills/use-agent-browser/SKILL.md` 的 frontmatter `description` MUST 等于下面这一句，`metadata.version` MUST 为 `1.6.1`。

`当用户要用 agent-browser 打开网页、做可见浏览器验收，或排查 MCP 浏览器超时时使用。不要用于与浏览器无关的改码，也不承担残留进程批量清理。`

`--input-mode human`、`highlight`、`--pin-tab` 已写在正文「可视化与标签聚合」及标准工作流中。实施时 MUST NOT 为这些词新增章节，也 MUST NOT 改写「概述与边界」及之后已有句子。

#### Scenario: 描述替换后正文命令纪律不变

- **WHEN** 实施者改完 `use-agent-browser` 的 frontmatter
- **THEN** `description` 与上面这句话逐字相同，字符数为 78
- **AND** frontmatter 以下已有句子与改前逐字相同

### Requirement: init-shadcn-docs-nuxt 的固定描述使用指定文本

`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/SKILL.md` 的 frontmatter `description` MUST 等于下面这一句，`metadata.version` MUST 为 `1.9.4`。

`当用户要搭建、迁移或排查 shadcn-docs-nuxt 文档站，或处理 Nuxt Content、MDC、prerender 与 Windows 构建失败时使用。不要用于普通 Nuxt 业务页。`

旧描述里的错误码和信号已经写在正文「故障检修入口」。实施时 MUST NOT 把那份错误码清单再贴进正文，也 MUST NOT 改写该节及之后已有句子。

#### Scenario: 错误码清单留在原检修入口

- **WHEN** 实施者改完 `init-shadcn-docs-nuxt` 的 frontmatter
- **THEN** `description` 与上面这句话逐字相同，字符数为 99
- **AND** 「故障检修入口」与改前逐字相同

### Requirement: do-long-task 的固定描述使用指定文本

`ai-plugins/common-tools/skills/do-long-task/SKILL.md` 的 frontmatter `description` MUST 等于下面这一句，`metadata.version` MUST 为 `1.5.2`。

`当用户要执行、续跑或交接含 spec.md、plan.md、handoff.md 的任务包，或生成 /goal 长任务提示词时使用。不要用于短改、问答和尚未执行的纯计划。`

`docs/plan`、`docs/prompts`、`docs/one-use` 只出现在旧描述里。实施时 MUST 在「什么时候用」已有列表末尾追加一条，不改写已有条目：

`- 任务包所在目录包括 docs/plan、docs/prompts、docs/one-use。`

`/goal` 已写在「提示词生成模式」。实施时 MUST NOT 再抄一遍，也 MUST NOT 改写该节及其他已有句子。

#### Scenario: 只补目录条目，不重写使用边界

- **WHEN** 实施者改完 `do-long-task`
- **THEN** `description` 与上面这句话逐字相同，字符数为 85
- **AND** 「什么时候用」原有条目逐字保留，并多出上面这一条目录条目
- **AND** 「提示词生成模式」与改前逐字相同

### Requirement: 注册表描述与 frontmatter 一致

`ai-plugins/skill-registry.json` 中这四条技能的 `description` MUST 与对应 `SKILL.md` frontmatter 的描述相同。

#### Scenario: 注册表不保留旧的双语长描述

- **WHEN** 四份 `SKILL.md` 的 description 已经收短
- **THEN** `skill-registry.json` 里同名技能的 `description` 与 frontmatter 一致
