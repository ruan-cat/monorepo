# `release-ai-plugins` v0.17.4 原文保留

这是升级前 `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md` 的迁移保留层。
以下内容保留旧版入口的完整行为约束，便于回溯迁移；新入口把 registry/MCP 规则加入主流程，
没有把旧版内容当作当前规范继续执行。

````markdown
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
- `-Skill`：本次确实修改过的 skill 名称；可重复传入。省略时由脚本从 `git diff HEAD`
  和未跟踪文件自动发现，发现不到就失败。
- `-ChangeType`：`added`、`major`、`minor` 或 `patch`，用于升级每个被修改 skill 的
  `metadata.version`。
- `-Summary`：写入两个 CHANGELOG 的简短变更说明。
- `-NewSkill`：新增技能名；新增时必须同时更新对应插件根 README，缺失即阻断。
- `-Apply`：明确允许写文件。没有 `-Apply` 时只能 DryRun。

## 强制执行顺序

1. 确认 skill 在 `ai-plugins/common-tools/skills` 或 `ai-plugins/dev-skills/skills`，且有 `SKILL.md`。
2. 只升级 `-Skill` 列出的、确实变更的 skill `metadata.version`。
3. 更新六个插件 `plugin.json`、Claude/Cursor marketplace 和 Codex marketplace。
4. Claude/Cursor marketplace 与六个 `plugin.json` 版本等于 `-Version`；Codex marketplace 无版本字段，
   只校验两个插件的 `name`、`source.path`、`policy.installation`、`policy.authentication` 和 `category`。
5. 在两个插件 CHANGELOG 顶部写入同一版本和日期，条目列出版本同步、技能旧新版本和摘要。
6. `-NewSkill` 非空时，先把名称写入对应插件 README，再运行脚本。
7. 最终验收九个 JSON 可解析、skill metadata 与输入一致、README/CHANGELOG 正确、`git diff --check` 通过。

## 使用边界与核心职责

适用：发布 `common-tools` 或 `dev-skills` 新版本、同步 Claude/Cursor/Codex 市场与 manifest、维护发布说明、
修正安装文档路径。不适用：只安装或列出 `skills add`、只确认安装 URL、只同步本机 skills 或只修复本地链接。
核心职责固定为版本号管理、CHANGELOG、三平台清单校验、README/安装文档同步。

## 插件市场变更边界

先建立“客户端 → marketplace → plugin manifest → 已发布组件 → 安装/更新/卸载文档 → 真实验证命令 → 清理动作”
映射。共享 skills 可以复用，但 Claude Code、Cursor、Codex 的 schema、hooks、commands、agents 和路径假设必须分别维护。
静态 JSON/schema 校验不是发布完成证据；必须运行目标客户端真实 CLI/官方安装路径，临时安装后 remove 并检查残留；无法取得证据时记录“未验证”。

## 版本与文件契约

- 插件主版本来自 `.claude-plugin/marketplace.json` 的 `metadata.version`，同步到 Cursor marketplace 与六个 `plugin.json`。
- Skill `metadata.version` 独立演进，只在 Skill 确实变更时升级。
- 固定白名单是九个 JSON、两个 CHANGELOG，以及新增 Skill 对应插件根 README。

## README 与安装文档同步

检查 `ai-plugins/docs/README.md`、`ai-plugins/docs/use-vercel-skills-install.md`、`.claude-plugin/README.md`、
`.cursor-plugin/README.md`、`.agents/plugins/README.md` 和根 README。安装命令/source 使用 `ai-plugins/...`，禁止 `claude-code-marketplace/`。

## CHANGELOG 契约

两个 CHANGELOG 遵循 Keep a Changelog：标题为 `## [版本] - YYYY-MM-DD`，使用 Added/Changed/Fixed 和扁平 bullet。
技能名、文件名、命令、版本号、字段名使用反引号；每条 bullet 只承载一个独立信息块，major 变更拆分行为、风险和版本同步条目。

## Codex marketplace 契约

`.agents/plugins/marketplace.json` 使用 `./ai-plugins/common-tools`、`./ai-plugins/dev-skills`，无 marketplace 版本字段。
两个 `.codex-plugin/plugin.json` 只声明 `skills: "./skills"`，禁止复制 Claude Code 的 `hooks`、`commands`、`agents`，展示元数据使用中文。

## 唯一入口

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1 `
  -Version 8.3.3 -ChangeType patch -Skill release-ai-plugins `
  -Summary "强化发布流程并增加脚本化校验" -DryRun
```
````

确认 DryRun 后追加 `-Apply`；新增 skill 时先更新 `ai-plugins/<plugin>/README.md`。脚本不是黑盒，Apply 后仍须阅读输出、检查 diff、确认没有白名单外文件。

## 禁止完成条件

- 只改部分 manifest、漏掉 Codex manifest、只改一个 CHANGELOG 或顶部版本不正确。
- 没有被修改 skill 的旧新 metadata 版本证据，或新增 skill 未出现在 README。
- 仅凭构建成功、口头说明或 `git status` 声称完成。

## 相关资源与验收

- [`scripts/release-ai-plugins.ps1`](scripts/release-ai-plugins.ps1)：唯一写入入口。
- [`references/release-contract.md`](references/release-contract.md)：字段矩阵、CHANGELOG 示例和 Codex smoke test。
- [Semantic Versioning](https://semver.org/lang/zh-CN/)
- [Keep a Changelog](https://keepachangelog.com/zh-CN/)

验收要求：DryRun 已执行；Apply 后所有步骤 PASS；`git diff --check` 无输出；`git status --short` 只包含预期文件。

```

迁移原因：新入口压缩了重复的基础发布说明并新增 registry 阶段；该文件保留旧版现象、边界、反例和验收依据。
```
