# Changelog

本文件记录 `dev-skills` 插件的变更历史，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/) 与语义化版本。

## [2.15.0] - 2026-03-22

### Changed

- 版本号与 marketplace 主版本同步至 2.15.0（本次无 `dev-skills` 技能内容变更）。

## [2.14.0] - 2026-03-22

### Added

- `init-shadcn-docs-nuxt` 技能：初始化或重构基于 `shadcn-docs-nuxt` 的组件库文档站（Nuxt 配置、Tailwind、MDC、Windows 排错、`templates/` 与 `references/`），支持用户主动调用（`user-invocable`）。

### Changed

- Monorepo 为 `ai-plugins` 增加专用 `tsconfig.json`（`noCheck`、根级 `tsconfig` exclude）、根目录脚本 `pnpm run typecheck:ai-plugins`，并在 `CLAUDE.md` / `AGENTS.md` 说明模板 TypeScript 与将来「真实可维护脚本」拆分的策略。

## [2.13.0] - 2026-03-22

### Added

- `init-pure-admin-iconify` 技能：补充「照抄 pure-admin」策略、文件映射表与 `templates/` 目录，将可复制的 `ReIcon` 相关源码与入口注册示例从文档拆分为独立模板文件，便于落地与维护。

### Changed

- `init-pure-admin-iconify` 技能文档：以模板路径与复制规则替代内联大段代码，并保留依赖安装、Vite 插件、验证清单与常见坑位说明。
