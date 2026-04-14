<!-- 已完成 -->

# AI Plugins 多平台重构计划

## 目标

- 以 `ai-plugins` 作为唯一对外技能分发根目录。
- 支持双插件（`common-tools`、`dev-skills`）在 Claude 与 Cursor 两个平台分发。
- 保持单一总版本发布模型，并重做版本升级技能。

## 关键改动范围

- 目录重命名与技能迁移：
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/claude-code-marketplace](D:/code/github-desktop-store/gh.ruancat.monorepo/claude-code-marketplace)
  - 目标目录：[D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins](D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins)
- 根级 marketplace：
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/.claude-plugin/marketplace.json](D:/code/github-desktop-store/gh.ruancat.monorepo/.claude-plugin/marketplace.json)
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/.cursor-plugin/marketplace.json](D:/code/github-desktop-store/gh.ruancat.monorepo/.cursor-plugin/marketplace.json)
- 插件级 manifest（每个插件双平台）：
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/common-tools/.claude-plugin/plugin.json](D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/common-tools/.claude-plugin/plugin.json)
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/common-tools/.cursor-plugin/plugin.json](D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/common-tools/.cursor-plugin/plugin.json)
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/dev-skills/.claude-plugin/plugin.json](D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/dev-skills/.claude-plugin/plugin.json)
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/dev-skills/.cursor-plugin/plugin.json](D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/dev-skills/.cursor-plugin/plugin.json)
- 版本升级技能重做：
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/.claude/skills/release-ai-plugins/SKILL.md](D:/code/github-desktop-store/gh.ruancat.monorepo/.claude/skills/release-ai-plugins/SKILL.md)
- 文档重构：
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/docs/README.md](D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/docs/README.md)
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/docs/use-vercel-skills-install.md](D:/code/github-desktop-store/gh.ruancat.monorepo/ai-plugins/docs/use-vercel-skills-install.md)
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/.claude-plugin/README.md](D:/code/github-desktop-store/gh.ruancat.monorepo/.claude-plugin/README.md)
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/.cursor-plugin/README.md](D:/code/github-desktop-store/gh.ruancat.monorepo/.cursor-plugin/README.md)
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/README.md](D:/code/github-desktop-store/gh.ruancat.monorepo/README.md)
- Markdown 类型支持确认：
  - [D:/code/github-desktop-store/gh.ruancat.monorepo/tsconfig.md.json](D:/code/github-desktop-store/gh.ruancat.monorepo/tsconfig.md.json)

## 结构原则

- Cursor 侧严格遵循官方插件规范（含 marketplace/plugin 字段与发现规则），不盲目复用 Claude 字段。
- 使用单一总版本（marketplace 主版本）同步到双平台 marketplace 与双插件 manifest。
- `SKILL.md` 的 `metadata.version` 按实际变更独立演进。

## 迁移流程

1. 将 `claude-code-marketplace` 重命名为 `ai-plugins`。
2. 按功能迁移 skills：
   - `common-tools`: `git-commit`、`get-git-branch`、`init-claude-code-statusline`、`init-prettier-git-hooks`、`init-ai-md`、`rebase2main`、`use-other-model`
   - `dev-skills`: `nitro-api-development`、`openspec`
3. 为两个插件各自补齐 Claude/Cursor plugin manifest。
4. 更新根级 `.claude-plugin/marketplace.json`，新增根级 `.cursor-plugin/marketplace.json`。
5. 重写 `release-ai-plugins` 技能为“多平台+多插件+单主版本”发布器。
6. 按职责拆分并迁移文档；在根 README 保留并强化 `Claude Code Plugin Version` badge。
7. 运行路径与引用一致性校验（安装命令、source 路径、文档链接、tsconfig.md 覆盖范围）。

## 验收标准

- `ai-plugins` 成为唯一对外技能根目录。
- `common-tools` 与 `dev-skills` 在 Claude/Cursor 的 marketplace 清单均可被正确识别。
- 发布技能可一键同步双平台 marketplace + 双插件 manifest 的主版本。
- 文档职责边界清晰，安装命令与路径全部可用。
- 根 README 保持 `Claude Code Plugin Version` badge 可见且入口链接完整。
