---
name: release-ai-plugins
description: >-
  固定化 ai-plugins 的版本发布流程：同步 skill metadata.version、六个插件
  manifest、三个 marketplace、两个 CHANGELOG，并在新增 skill 时强制校验 README。
  适用于 release-ai-plugins、插件升级、版本更新、发布插件、更新日志、manifest、marketplace、
  CHANGELOG、README 发布一致性、cursor-plugin。
  English: Use when releasing or upgrading the common-tools or dev-skills plugins,
  synchronizing Claude/Cursor/Codex manifests and marketplaces, updating CHANGELOG
  files, or validating README and installation-document consistency.
metadata:
  version: "0.17.4"
---

# AI Plugins 发布流程

这是一个高频机械任务，禁止凭记忆逐项手改。每次执行必须使用同目录的
`scripts/release-ai-plugins.ps1`，并按本文件的固定顺序完成。脚本失败即停止，
未通过最后验收不得声称完成。

## 固定输入

- `-Version`：插件发布版本，必须是 `MAJOR.MINOR.PATCH`。
- `-Skill`：本次确实修改过的 skill 名称；可重复传入。省略时由脚本从
  `git diff HEAD` 和未跟踪文件自动发现，发现不到就失败。
- `-ChangeType`：`added`、`major`、`minor` 或 `patch`，用于升级每个被修改 skill 的
  `metadata.version`。
- `-Summary`：写入两个 CHANGELOG 的简短变更说明。
- `-NewSkill`：新增 skill 名称；新增时必须同时更新对应插件根目录 README，脚本会
  将 README 缺失视为阻断错误。
- `-Apply`：明确允许写文件。没有 `-Apply` 时只能 DryRun。

## 强制执行顺序

1. 读取并核对输入；确认 skill 位于 `ai-plugins/common-tools/skills` 或
   `ai-plugins/dev-skills/skills`，且每个目录都有 `SKILL.md`。
2. 计算每个 `-Skill` 的旧版本并按 `-ChangeType` 只升级这些 skill 的
   `metadata.version`。不得顺手升级未修改 skill。
3. 更新以下九个固定 JSON（不得扩展或遗漏白名单）：
   - `ai-plugins/common-tools/.claude-plugin/plugin.json`
   - `ai-plugins/common-tools/.cursor-plugin/plugin.json`
   - `ai-plugins/common-tools/.codex-plugin/plugin.json`
   - `ai-plugins/dev-skills/.claude-plugin/plugin.json`
   - `ai-plugins/dev-skills/.cursor-plugin/plugin.json`
   - `ai-plugins/dev-skills/.codex-plugin/plugin.json`
   - `.claude-plugin/marketplace.json`
   - `.cursor-plugin/marketplace.json`
   - `.agents/plugins/marketplace.json`
4. 让 Claude/Cursor marketplace 和六个 `plugin.json` 的版本全部等于
   `-Version`。Codex marketplace 没有版本字段，只校验两个插件的 `name`、
   `source.path`、`policy.installation`、`policy.authentication` 和 `category`。
5. 在 `ai-plugins/common-tools/CHANGELOG.md` 与 `ai-plugins/dev-skills/CHANGELOG.md`
   顶部写入同一版本和日期；没有文件则创建。条目必须列出版本同步、被修改 skill
   的旧新版本和 `-Summary`。
6. `-NewSkill` 非空时，必须先把 skill 名称写入对应插件 README，再运行脚本；脚本
   会验证 README 已包含该名称，缺失则失败。
7. 运行脚本的最终验收：九个 JSON 可解析且版本关系正确、skill metadata 与输入
   一致、README 条件满足、CHANGELOG 顶部版本正确、`git diff --check` 通过。

## 使用边界与核心职责

适用场景：发布 `common-tools` 或 `dev-skills` 新版本、同步 Claude/Cursor/Codex
市场与 manifest、维护发布说明，以及修正安装文档中的插件路径。

不适用场景：只安装、列出或验证 `skills add`，只确认安装 URL，只同步本机 skills，
或只修复本地 skills 链接。若这些文档或命令变更同时属于版本发布一致性工作，仍按本技能执行。

核心职责固定为四项：版本号管理、CHANGELOG 维护、三平台清单校验、README/安装文档同步。

## 插件市场变更边界

本节只约束 `ai-plugins` 的市场维护与发布，不应被复制到通用 AI 记忆模板或一般项目的 AI 记忆文档；当前仓库可在项目级记忆中保留简短入口，并由本技能执行细则。

每次新增或修改市场时，先建立“客户端 → marketplace → plugin manifest → 已发布组件 → 安装/更新/卸载文档 → 真实验证命令 → 清理动作”的映射。共享 skills 目录可以复用，但 Claude Code、Cursor 和 Codex 的字段、hooks、commands、agents 与路径假设必须按各自 schema 维护，禁止跨客户端复制专属配置。

静态 JSON/schema 校验只是前置门禁，不是发布完成证据。除本技能的版本、CHANGELOG 和文档同步外，还必须运行目标客户端的真实 CLI 或官方安装验证路径；临时添加的 marketplace 或插件必须执行对应 remove 命令，并检查没有残留。若受环境、账号或客户端限制而无法取得真实安装证据，明确记录为“未验证”，不得用静态校验替代。

## 版本与文件契约

- 插件主版本采用 `MAJOR.MINOR.PATCH`，来源是 `.claude-plugin/marketplace.json` 的
  `metadata.version`，必须同步到 Cursor marketplace 与六个 `plugin.json` 的 `version`。
- Skill 的 `metadata.version` 独立演进，只在该 Skill 确实变更时升级；扫描范围是
  `ai-plugins/common-tools/skills/**/SKILL.md` 和 `ai-plugins/dev-skills/skills/**/SKILL.md`。
- 固定发布白名单就是本文件步骤 3 列出的九个 JSON、两个 CHANGELOG，以及新增 skill
  对应的插件根 README。禁止凭记忆扩展文件范围。

## README 与安装文档同步

发布时至少检查以下路径：

- `ai-plugins/docs/README.md`
- `ai-plugins/docs/use-vercel-skills-install.md`
- `.claude-plugin/README.md`
- `.cursor-plugin/README.md`
- `.agents/plugins/README.md`
- 根 `README.md`

安装命令和 source 路径必须使用 `ai-plugins/...`；禁止残留
`claude-code-marketplace/...` 旧路径。新增 skill 还必须出现在对应插件根 README。

## CHANGELOG 契约

两个 CHANGELOG 遵循 Keep a Changelog：版本标题必须是 `## [版本] - YYYY-MM-DD`，
随后使用 `### Added`、`### Changed`、`### Fixed` 等分类和扁平 bullet。技能名、
文件名、命令、版本号、字段名统一使用反引号。

每条 bullet 只承载一个独立信息块；版本同步与功能变化分开书写；禁止把多个文件、
原因和效果压进一个超长段落。major 变更必须拆成行为、配置、风险边界和版本同步等独立条目。
具体示例和排版检查见 [`references/release-contract.md`](references/release-contract.md)。

## Codex marketplace 契约

`.agents/plugins/marketplace.json` 以仓库根为相对路径解析，两个插件必须使用：

- `./ai-plugins/common-tools`
- `./ai-plugins/dev-skills`

Codex marketplace 本身没有版本字段，禁止虚构 `metadata.version`；仍须校验两个条目的
`name`、`source.path`、`policy.installation`、`policy.authentication` 和 `category`。
两个 `.codex-plugin/plugin.json` 只声明 `skills: "./skills"`，禁止复制 Claude Code 的
`hooks`、`commands` 或 `agents` 字段。Codex 展示元数据使用中文，真实 URL/图标存在时才填写。
发布 smoke test 与字段矩阵见 [`references/release-contract.md`](references/release-contract.md)。

## 唯一入口

在仓库根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1 `
  -Version 8.3.3 -ChangeType patch -Skill release-ai-plugins `
  -Summary "强化发布流程并增加脚本化校验" -DryRun
```

PowerShell 7 环境可把命令开头替换为 `pwsh -NoProfile -File`；脚本兼容 Windows PowerShell 5.1。

确认 DryRun 输出的清单后，追加 `-Apply` 才允许写入。新增 skill 时追加
`-NewSkill <skill-name>`，并先修改对应的 `ai-plugins/<plugin>/README.md`。

脚本不是替代验收的黑盒：Apply 后仍须阅读输出、检查 `git diff`，并确认没有修改白名单之外的文件。

## 禁止完成条件

- 只改了部分 manifest 或漏掉 Codex manifest。
- 只改了一个 CHANGELOG，或 CHANGELOG 顶部不是本次版本。
- 未提供被修改 skill 的旧新 metadata 版本证据。
- 新增 skill 未出现在对应 README。
- 仅凭构建成功、口头说明或 `git status` 声称完成。

## 相关资源

- [`scripts/release-ai-plugins.ps1`](scripts/release-ai-plugins.ps1)：唯一写入入口。
- [`references/release-contract.md`](references/release-contract.md)：详细字段矩阵、CHANGELOG 示例和 Codex smoke test。
- [Semantic Versioning](https://semver.org/lang/zh-CN/)
- [Keep a Changelog](https://keepachangelog.com/zh-CN/)

## 验收清单

- [ ] DryRun 已执行且输出了 skill、九个 JSON、两个 CHANGELOG、README 检查结果。
- [ ] `-Apply` 后再次执行验证，所有步骤均为 PASS。
- [ ] `git diff --check` 无输出，且 `git status --short` 只包含预期文件。
