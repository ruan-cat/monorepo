## 放弃

2026-11-23 放弃本变更，不实施，不同步主规范。

### 当初的出发点

四条技能的 YAML `description` 会进入 agent 冷启动列表。当时测得合计约 1536 token，而且中文触发段后面各有一段英文复述。正文要等技能被选中才加载。本变更打算把每条 description 收成一种语言、200 字符以内，并认为触发词补进正文就能保住原有触发。

### 被推翻的前提

双语 description 是 flash 模型的触发面，不是可删的重复。英文段是同一份触发条件的翻译。Flash 模型靠冷启动列表里的字面词选技能。英文话术和一批错误码一旦离开 description，技能就选不中，正文里的执行步骤不会被加载。把缺失触发词补进正文，补的是选中之后的层，补不回选中本身。

`do-long-task` 在 common-tools 7.13.0 的变更说明里，已经把这种写法记为「中文在前、英文保留的双语触发说明」。

### 已经发生过的实施与回退

四份 `SKILL.md` 曾按写死的中文短句改过 description 和 `metadata.version`。用户指出 flash 触发风险后，这四份文件已用 git 恢复到改前双语全文：

- `use-pnpm` `1.0.0`
- `use-agent-browser` `1.6.0`
- `init-shadcn-docs-nuxt` `1.9.3`
- `do-long-task` `1.5.1`

`generate-skill-registry.mjs` 没有运行。`ai-plugins/skill-registry.json` 没有被本变更改写。

### 为什么不能改口径继续做

冷启动会读取 description，这句观察还在。本变更的做法是删掉第二语言。这个做法和 flash 模型的触发面冲突。继续执行 `tasks.md` 会把刚恢复的双语再删一次。`specs/skill-description-budget/spec.md` 写的是同一套已否决规则。主规范 `openspec/specs/` 里没有 `skill-description-budget`。同步会把这套规则新增成现行规范，所以归档时不同步。

若以后还要降低这四条 description 的固定成本，另开变更。两条语言都留在 description 里。

## Why

`use-pnpm`、`use-agent-browser`、`init-shadcn-docs-nuxt`、`do-long-task` 的 YAML `description` 在每个挂载了它们的 agent 冷启动时都会进入技能列表。四条描述今天合计约 1536 token，而且都是中文触发段后再写一段英文复述。正文只在技能被触发时加载，不是这轮要砍的固定成本。

## What Changes

- 四条技能的 `description` 收成单语、不超过 200 字符。四句成品写在 `design.md` 的「四条的落笔」和 `specs/skill-description-budget/spec.md`，实施时不得再改写。
- 用户会打出来、技能名里又没有的路由词留在 description。正文只在技能被选中之后才加载，不把这些词挪进正文冒充还在冷启动列表里。四句都装得下，所以这四份正文的已有句子不改。
- `ai-plugins/skill-registry.json` 不手改。四份 frontmatter 落盘后，用 `generate-skill-registry.mjs --apply` 重算 description 和 version，再 `--check`。
- 不卸载这四个技能，不改正文流程，不在本变更里发版或 `skills update -g`。

## Capabilities

### New Capabilities

- `skill-description-budget`: 全局冷启动会读到的技能 `description` 必须单语、有长度上限，并且不能用第二语言把同一份触发词再写一遍。

### Modified Capabilities

- 无。`openspec/specs/` 里现有的 `automd-install-generator` 与 `changelog-parsing-verification` 不覆盖技能描述。

## Impact

- `ai-plugins/common-tools/skills/use-pnpm/SKILL.md`
- `ai-plugins/common-tools/skills/do-long-task/SKILL.md`
- `ai-plugins/dev-skills/skills/use-agent-browser/SKILL.md`
- `ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/SKILL.md`
- `ai-plugins/skill-registry.json`
- 全局安装副本要等后续发布链路才会变。本变更只改源。
