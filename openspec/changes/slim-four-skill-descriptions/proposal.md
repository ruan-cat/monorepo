## Why

`use-pnpm`、`use-agent-browser`、`init-shadcn-docs-nuxt`、`do-long-task` 的 YAML `description` 在每个挂载了它们的 agent 冷启动时都会进入技能列表。四条描述今天合计约 1536 token，而且都是中文触发段后再写一段英文复述。正文只在技能被触发时加载，不是这轮要砍的固定成本。

## What Changes

- 四条技能的 `description` 收成单语、不超过 200 字符。另外三条的成品句子写在 `design.md` 的「三条的落笔」和 `specs/skill-description-budget/spec.md`，实施时不得再改写。
- 只出现在描述里、正文还没有的错误码和触发词，逐字补进该技能已有的「何时使用」章节。已有正文步骤不改写。
- `ai-plugins/skill-registry.json` 里这四条的 `description` 与新的 frontmatter 对齐。
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
