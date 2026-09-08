# Changelog

本文件记录 `low-frequency-skill` 插件的变更历史，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/) 与语义化版本。

## [Unreleased]

### Added

- 新增 `low-frequency-skill` 低频技能插件：收纳低频运行、低频维护的技能，统一集中升级维护。
- 自 `dev-skills` 迁移：**init-playwright**。
- 自 `common-tools` 迁移：**clone-ruancat-repo**、**get-git-branch**、**init-claude-code-statusline**、**init-simple-memorix**，技能内容与 `metadata.version` 均保持原样。
- 自外部项目（WorkBuddy `2026-6-30-common` 仓库）迁入：**init-tsconfig**、**factory-reset-vscode-fork-ide**，并按本仓库规范补齐 frontmatter，`metadata.version` 从 `1.0.0` 起步。
- 新增 **clean-vercel-deployment-storage**：批量清理 Vercel 部署存储（每项目保留最新生产部署）并配置 Deployment Retention 防额度复发，附 TS 批处理脚本（仅 Node 内置模块，tsx 调度）、REST API 端点速查与 2026-09-08 实战复盘。

## [10.17.1] - 2026-09-09

### Changed

- `low-frequency-skill` 技能树本身无内容变更，插件主版本随发布链路同步至 `10.17.1`。
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.17.1`。

## [10.17.0] - 2026-09-09

### Added

- **clean-vercel-deployment-storage**：`metadata.version` `1.0.0` -> `1.0.1`。
- 新增 clean-vercel-deployment-storage 技能：批量清理 Vercel 部署存储并配置 Retention 自动清理
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.17.0`。

## [10.16.0] - 2026-09-08

### Added

- `low-frequency-skill` 技能树本身无内容变更，插件主版本随发布链路同步至 `10.16.0`。
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.16.0`。
