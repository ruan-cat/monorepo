## Purpose

约束会进入 agent 冷启动技能列表的 YAML description：单语、有长度上限，用户会输入且技能名里没有的路由词留在 description 里。

## ADDED Requirements

### Requirement: 固定描述单语且不超过 200 字符

`use-pnpm`、`use-agent-browser`、`init-shadcn-docs-nuxt`、`do-long-task` 的 frontmatter `description` MUST 使用一种语言，JavaScript 字符串长度 MUST 小于或等于 200。同一份触发场景 MUST NOT 再用另一种语言复述。

#### Scenario: 描述收短后仍能判断何时使用

- **WHEN** 读取上述任一技能的 frontmatter `description`
- **THEN** 文本包含一类触发场景和一句不适用边界
- **AND** JavaScript 字符串长度小于或等于 200
- **AND** 不存在把同一段触发词再翻译一遍的第二语言段落

### Requirement: 路由词留在冷启动描述里

用户会输入、技能名里没有的路由词 MUST 留在 frontmatter `description`。实施时 MUST NOT 把这些词挪进正文，以此代替描述里的路由。这四份技能的已有正文句子 MUST 保持逐字不动。

#### Scenario: 收短描述时正文不改

- **WHEN** 实施者改完上述任一技能的 frontmatter
- **THEN** `description` 与本规范写死的句子逐字相同
- **AND** frontmatter 以下已有句子与改前逐字相同

### Requirement: use-pnpm 的固定描述使用指定文本

`ai-plugins/common-tools/skills/use-pnpm/SKILL.md` 的 frontmatter `description` MUST 等于下面这一句，`metadata.version` MUST 为 `1.0.1`。

`当用户要处理 pnpm 安装、workspace 命令、npm/npx/yarn 替换，或排查 pnpm 12 的 allowBuilds、blockExoticSubdeps、Corepack、self-update 假成功、全局 shim、pnpm ls -g 空列表、NVM Desktop 与 ERR_PNPM_* 时使用。不要用于与 pnpm 无关的 Node、Git 或业务代码。`

`allowBuilds`、`blockExoticSubdeps`、`Corepack`、`self-update`、全局 shim、`pnpm ls -g`、`NVM Desktop` 与 `ERR_PNPM_*` MUST 留在这句 description 里。`manage-package-manager-versions` 已在正文「When to Use」。实施时 MUST NOT 为它新增章节，也 MUST NOT 改写「When to Use」及之后已有句子。

#### Scenario: 试点句子替换后步骤不动

- **WHEN** 实施者改完 `use-pnpm` 的 frontmatter
- **THEN** `description` 与上面这句话逐字相同，字符数为 196
- **AND** frontmatter 以下已有句子与改前逐字相同

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

`当用户要搭建、迁移或排查 shadcn-docs-nuxt 文档站，或处理 Nuxt Content、MDC、prerender、Windows 构建失败与 FUNCTION_INVOCATION_FAILED 时使用。不要用于普通 Nuxt 业务页。`

`FUNCTION_INVOCATION_FAILED` MUST 留在这句 description 里，因为它不在正文「故障检修入口」。实施时 MUST NOT 把旧描述里的整份错误码清单再贴进正文，也 MUST NOT 改写「故障检修入口」及之后已有句子。

#### Scenario: 缺失错误码留在描述里

- **WHEN** 实施者改完 `init-shadcn-docs-nuxt` 的 frontmatter
- **THEN** `description` 与上面这句话逐字相同，字符数为 126
- **AND** description 包含 `FUNCTION_INVOCATION_FAILED`
- **AND** 「故障检修入口」与改前逐字相同

### Requirement: do-long-task 的固定描述使用指定文本

`ai-plugins/common-tools/skills/do-long-task/SKILL.md` 的 frontmatter `description` MUST 等于下面这一句，`metadata.version` MUST 为 `1.5.2`。

`当用户要执行、续跑、交接或验收同目录含 spec.md、plan.md、handoff.md 的任务包，包括 docs/plan、docs/prompts、docs/one-use，或生成 /goal 长任务提示词时使用。不要用于短改、问答和尚未执行的纯计划。`

`docs/plan`、`docs/prompts`、`docs/one-use` 只出现在旧描述里，MUST 留在这句 description 里。实施时 MUST NOT 把这三条目录追加进「什么时候用」。`/goal` 已写在「提示词生成模式」。实施时 MUST NOT 再抄一遍，也 MUST NOT 改写该节及其他已有句子。

#### Scenario: 目录路由留在描述里

- **WHEN** 实施者改完 `do-long-task` 的 frontmatter
- **THEN** `description` 与上面这句话逐字相同，字符数为 130
- **AND** description 包含 `docs/plan`、`docs/prompts`、`docs/one-use`
- **AND** 「什么时候用」与「提示词生成模式」和改前逐字相同

### Requirement: 注册表由生成器对齐 frontmatter

`ai-plugins/skill-registry.json` 中这四条技能的 `description` 与 `version` MUST 与对应 `SKILL.md` frontmatter 相同。实施时 MUST 运行 `ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs --apply`，再运行同脚本 `--check`。MUST NOT 只手改 description 而留下旧 version。

#### Scenario: 生成器检查通过

- **WHEN** 四份 `SKILL.md` 的 description 和 version 已经按本规范改完
- **THEN** `--check` 确认 `skill-registry.json` 是当前生成结果
- **AND** 注册表里同名技能的 `description` 与 `version` 和 frontmatter 一致
