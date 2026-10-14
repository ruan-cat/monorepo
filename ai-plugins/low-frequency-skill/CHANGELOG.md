# Changelog

本文件记录 `low-frequency-skill` 插件的变更历史，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/) 与语义化版本。

## [Unreleased]

### Added

- 新增 `low-frequency-skill` 低频技能插件：收纳低频运行、低频维护的技能，统一集中升级维护。
- 自 `dev-skills` 迁移：**init-playwright**。
- 自 `common-tools` 迁移：**clone-ruancat-repo**、**get-git-branch**、**init-claude-code-statusline**、**init-simple-memorix**，技能内容与 `metadata.version` 均保持原样。
- 自外部项目（WorkBuddy `2026-6-30-common` 仓库）迁入：**init-tsconfig**、**factory-reset-vscode-fork-ide**，并按本仓库规范补齐 frontmatter，`metadata.version` 从 `1.0.0` 起步。
- 新增 **clean-vercel-deployment-storage**：批量清理 Vercel 部署存储（每项目保留最新生产部署）并配置 Deployment Retention 防额度复发，附 TS 批处理脚本（仅 Node 内置模块，tsx 调度）、REST API 端点速查与 2026-09-08 实战复盘。

### Changed

- **init-simple-memorix**：`metadata.version` `2.5.0` -> `2.7.0`，memorix MCP 的目标 mode 由 `full` 改为 `micro`（`memorix serve` 的默认档，9 工具 / ~4,516 token）。三个入口同步：
  - `src/install-mcp.ts`、`fallback/install-mcp.sh`、`fallback/install-mcp.ps1` 的 `MEMORIX_ARGS` 改为 `["serve", "--mode", "micro"]`。
  - **修正平台 server 键路径**：ZCode 用嵌套的 `mcp.servers`、Codex 用 `mcp_servers`（下划线，不是 `mcpServers`）。旧实现只认顶层 `mcpServers`，对这两个平台会新增一个目标程序不识别的键（dry-run 报 updated，实际不生效）。
  - **修正 Qoder 配置路径**：`~/AppData/Roaming/Qoder/SharedClientCache/mcp.json` -> `~/.qoder/mcp.json`（原路径在本机不存在）。
  - **只调整 `--mode` 的值，不再整体替换 `args`**：保留 Codex 的 `["/c", "memorix.cmd", ...]` 启动器前缀；裸 `serve`（等价 micro）判定为已满足，不产生无谓 diff。
  - **写回保真**：按原文件的缩进、行尾与「结尾是否带换行」序列化，避免 100KB 级配置文件整文件重排。
  - **修复 `fallback/install-mcp.sh` 的数据丢失缺陷**：新增 memorix entry 时改用 `setpath` 在原文基础上补建，旧实现的 `reduce` 会把 `github` / `codegraph` 等既有 server 条目整体丢弃。
  - **重写 `fallback/install-mcp.ps1` 为定点文本编辑**：PS 5.1 的 `ConvertFrom-Json` 无法解析 `~/.claude.json`（含仅大小写不同的重复键），`ConvertTo-Json` 又固定输出 4 空格 + CRLF；同时该脚本必须以 **UTF-8 with BOM** 保存，否则 PS 5.1 按 ANSI 解码会把中文注释解析成非法 token。
  - `references/memorix-setup-notes.md`、`references/workbuddy-mcp-notes.md` 中 12 处 `full mode` 表述改为 mode 中性（默认 micro）。

## [11.0.0] - 2026-10-15

### Changed

- `low-frequency-skill` 技能树本身无内容变更，插件主版本随发布链路同步至 `11.0.0`。
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `11.0.0`。

## [10.25.1] - 2026-10-13

### Changed

- `low-frequency-skill` 技能树本身无内容变更，插件主版本随发布链路同步至 `10.25.1`。
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.25.1`。

## [10.25.0] - 2026-10-13

### Changed

- **init-simple-memorix**：`metadata.version` `2.5.0` -> `2.7.0`。
- init-simple-memorix memorix MCP 目标 mode 由 full 改为 micro，并修正 ZCode / Codex / Qoder 平台 server 键路径与写回保真，详见上方 `[Unreleased]` 条目。
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.25.0`。

## [10.24.0] - 2026-10-01

### Changed

- `low-frequency-skill` 技能树本身无内容变更，插件主版本随发布链路同步至 `10.24.0`。
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.24.0`。

## [10.23.0] - 2026-09-30

### Changed

- `low-frequency-skill` 技能树本身无内容变更，插件主版本随发布链路同步至 `10.23.0`。
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.23.0`。

## [10.22.0] - 2026-09-30

### Changed

- `low-frequency-skill` 技能树本身无内容变更，插件主版本随发布链路同步至 `10.22.0`。
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.22.0`。

## [10.21.0] - 2026-09-30

### Changed

- `low-frequency-skill` 技能树本身无内容变更，插件主版本随发布链路同步至 `10.21.0`。
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.21.0`。

## [10.20.0] - 2026-09-30

### Changed

- **init-simple-memorix**：`metadata.version` `2.4.0` -> `2.5.0`。
- use-pnpm 与 init-simple-memorix 事故知识加固：布局迁移外溢、shim 劫持与解析链劫持分流
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.20.0`。

## [10.19.0] - 2026-09-29

### Changed

- `low-frequency-skill` 技能树本身无内容变更，插件主版本随发布链路同步至 `10.19.0`。
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.19.0`。

## [10.18.0] - 2026-09-15

### Changed

- `low-frequency-skill` 技能树本身无内容变更，插件主版本随发布链路同步至 `10.18.0`。
- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` / `low-frequency-skill` 的九份三平台 `plugin.json` 版本统一提升至 `10.18.0`。

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
