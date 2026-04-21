# Changelog

本文件记录 `dev-skills` 插件的变更历史，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/) 与语义化版本。

## [6.3.1] - 2026-04-21

### Changed

- **init-release-base-relizy-and-bumpp**（`metadata.version` `3.0.0` -> `3.0.1`）：将 `templates/release.yaml` 的 GitHub Actions 模板升级到 Node 24 runtime 版本，`actions/checkout` 使用 `v6`，`pnpm/action-setup` 使用 `v6`，`actions/setup-node` 使用 `v6`。
- 根级 marketplace 与 `common-tools` / `dev-skills` 双平台 `plugin.json` 版本统一提升至 `6.3.1`。

## [6.3.0] - 2026-04-21

### Changed

- 版本号与根级 marketplace、`common-tools` / `dev-skills` 双平台 `plugin.json` 同步至 `6.3.0`。
- 本次 `dev-skills` 技能树无内容变更；功能更新集中在 `common-tools` 的 **add-favicon**。

## [6.2.0] - 2026-04-19

### Changed

- 版本号与根级 marketplace、`common-tools` / `dev-skills` 双平台 `plugin.json` 同步至 `6.2.0`。
- 本次 `dev-skills` 技能树无内容变更；功能更新集中在 `common-tools` 的 **release-ai-plugins**。

## [6.1.0] - 2026-04-19

### Changed

- 版本号与根级 marketplace、`common-tools` / `dev-skills` 双平台 `plugin.json` 同步至 `6.1.0`。
- 本次 `dev-skills` 技能树无内容变更；功能更新集中在 `common-tools` 的 **git-commit**。

## [6.0.0] - 2026-04-17

### Breaking Changes

- **init-release-base-relizy-and-bumpp**（`metadata.version` `2.0.0` → `3.0.0`，重大调整）：
- 根包 `bumpp` 的 push 策略不再写死在 `templates/bump.config.ts`；模板仅保留注释说明，要求通过官方 CLI `--push` / `--no-push` 显式控制。
- 根包 scripts 拆成两种合法入口：`release:root` 固定为 `bumpp --no-push --yes --release patch`，`release:bumpp` 固定为 `bumpp --push`。
- `SKILL.md`、`templates/config-writer.md` 与 `references/config-templates.md` 同步改口，不再把 `push: false` 写成默认生效配置。
- `references/release-workflow-architecture.md` 与 `references/verification-matrix.md` 新增“远程 tag 缺失会导致工作流未触发”的排障与验收口径，先查远程 tag，再查 `release.yaml` 提取逻辑。

### Changed

- 根级 marketplace 与 `common-tools` / `dev-skills` 双平台 `plugin.json` 版本统一提升至 `6.0.0`。

## [5.1.0] - 2026-04-15

### Changed

- 版本号与根级 marketplace、`common-tools`、双平台 `plugin.json` 同步至 `5.1.0`。
- 本次 `dev-skills` 技能树无内容变更；功能更新集中在 `common-tools` 的 **use-other-model**。

## [5.0.0] - 2026-04-15

### Changed

- **init-release-base-relizy-and-bumpp**（`metadata.version` `1.1.1` → `2.0.0`，重大调整）：
- 根包 changelog 的默认生成链路从 `conventional-changelog` 收口为 `changelogen`，不再把旧 preset 方案作为默认实现。
- `templates/bump.config.ts` 从固定命令字符串改为 `execute` 函数，并显式传入 `newVersion`，确保根 `CHANGELOG.md` 能按目标版本生成稳定标题。
- `templates/release.yaml` 保留原有注释风格，只最小补入 `set +e` / `set -e`，提升 Release notes 提取阶段的容错性。
- `references/dependency-conflict-precheck.md` 与相关模板/说明文档，把预检范围从“旧 angular preset 冲突”收缩为“遗留根包发版工具是否还残留”，避免把排查面扩到无关的 changelog preset 兼容问题。
- 同步将根级 marketplace、`common-tools` / `dev-skills` 双平台 `plugin.json` 版本统一提升至 `5.0.0`。

## [4.3.0] - 2026-04-15

### Changed

- **init-release-base-relizy-and-bumpp**（`metadata.version` `1.0.0` → `1.1.0`）：增强 `templates/release.yaml` 中根包 `v*` tag 的 GitHub Release notes 提取兼容性。根 `CHANGELOG.md` 现在除了原有的 `## <small>1.2.3 (...)`、`## [1.2.3](...)`、`## 1.2.3 (...)` 外，也兼容 `## [v1.2.3](...)`、`## v1.2.3`、`## v1.2.3 (...)` 以及对应的 `#` 一级标题写法，避免根包 release 因 changelog 标题形态不同而跳过内容提取。
- 同步将根级 marketplace、`common-tools` / `dev-skills` 双平台 `plugin.json` 版本统一提升至 `4.3.0`。

## [4.2.1] - 2026-04-10

### Changed

- 版本号与 marketplace 主版本同步至 `4.2.1`（本次 `dev-skills` 技能树无内容变更；`common-tools` 中 **clone-ruancat-repo**、**pr-ruancat-repo** 更新见该插件 CHANGELOG）。

## [4.2.0] - 2026-04-09

### Added

- **init-release-base-relizy-and-bumpp**（新技能，`metadata.version` `1.0.0`）：从零接入 relizy + bumpp 组合发版方案的执行型技能。relizy 负责子包独立版本管理，bumpp 负责根包版本管理，GitHub Release 由 CI 工作流自动创建。包含 5 个配置文件模板（`bump.config.ts`、`changelog.config.ts`、`changelogithub.config.ts`、`relizy.config.ts`、`.github/workflows/release.yaml`）、根包 scripts 完整模板、`commit-and-tag-version` 依赖冲突预检机制、发版架构详解文档。

### Removed

- **init-relizy**（`metadata.version` `1.3.0`）：**已过时，已删除**。原技能仅支持单独使用 relizy 发版，缺少 bumpp 根包管理与 GitHub Release 自动化能力。**请使用 `init-release-base-relizy-and-bumpp` 替代**。
  - 全局缓存删除命令：`Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\cache\ruan-cat-tools\dev-skills\*\skills\init-relizy"`（Windows PowerShell）
  - 或：`rm -rf ~/.claude/plugins/cache/ruan-cat-tools/dev-skills/*/skills/init-relizy`（macOS/Linux bash）

## [4.1.0] - 2026-04-02

### Changed

- 版本号与 marketplace 主版本同步至 `4.1.0`（本次 `dev-skills` 技能树无内容变更；功能更新见 `common-tools` **clone-ruancat-repo** 与 **pr-ruancat-repo**）。

## [4.0.1] - 2026-03-30

### Changed

- 版本号与 marketplace 主版本同步至 `4.0.1`（本次 `dev-skills` 技能树无内容变更）。

## [3.2.2] - 2026-03-29

### Changed

- 版本号与 marketplace 主版本同步至 `3.2.2`（本次 `dev-skills` 技能树无内容变更）。

## [3.2.1] - 2026-03-28

### Changed

- 版本号与 marketplace 主版本同步至 `3.2.1`（本次 `dev-skills` 技能树无内容变更）。

## [3.2.0] - 2026-03-25

### Changed

- **init-relizy**（`metadata.version` `1.2.0` → `1.3.0`）：新增「`--yes` 与非交互发版」专节，要求技能在根脚本、README 与验证示例中**显式传递 `--yes`**，并说明与 `relizy-runner` 自动注入及 `--no-yes` 的关系；更新 `templates/config-writer.md`（含 `changelog` / `changelog:dry` 与非 runner 备选）、`templates/docs-sync.md`、`references/verification-matrix.md`、`references/windows-compatibility.md`；技能内验证基线为 `changelog --dry-run --yes`。

## [3.1.0] - 2026-03-25

### Changed

- 版本号与 marketplace 主版本同步至 `3.1.0`（本次 `dev-skills` 技能树无内容变更，仅与 `common-tools` 的插件发版保持一致）。

## [3.0.0] - 2026-03-25

### Changed

- 版本号与 marketplace 主版本同步至 `3.0.0`（破坏性变更见 `common-tools` **init-prettier-git-hooks** 模板 `endOfLine: "lf"`；本次 `dev-skills` 技能树无功能变更）。

## [2.16.2] - 2026-03-24

### Changed

- **init-relizy**（`metadata.version` `1.1.0` → `1.2.0`）：兼容层**不再**提供可复制本地 `templates/relizy-runner.ts`；统一要求使用 **`@ruan-cat/utils`** 的 **`relizy-runner` bin**（见 monorepo 内 `packages/utils/src/node-esm/scripts/relizy-runner/index.md`）。更新 `SKILL.md`、`templates/config-writer.md`、`references/config-templates.md`、`references/baseline-tags.md`、`references/windows-compatibility.md`、`references/verification-matrix.md`、`references/validated-archetypes.md` 等；`relizy.config` 骨架补充默认 **`release`** 配置块。

## [2.16.1] - 2026-03-24

### Changed

- **init-relizy**（`metadata.version` `1.0.0` → `1.1.0`）：将评测场景并入 `references/validated-archetypes.md`，移除 `evals/` 目录；将 **runner 兼容层** 列为推荐默认（同时覆盖 Windows GNU 工具链与 baseline package tag 预检）；新增可复制模板 `templates/relizy-runner.ts`；重写 `references/baseline-tags.md`、`references/windows-compatibility.md`，更新 `templates/config-writer.md`、`templates/runtime-compat.md` 与 `SKILL.md` 决策/阻断表述。

### Fixed

- **init-relizy**：`2.16.0` 变更说明中误写 `evals/evals.json`；实际交付仅为 `templates/` + `references/`（已在本次修订中更正上文条目）。

## [2.16.0] - 2026-03-24

### Added

- `init-relizy` 技能：为任意 pnpm monorepo 接入或补强 relizy（changelogen）发版链路（`SKILL.md`、`templates/`、`references/`），含侦察、决策、兼容分支、baseline tag、`private` 风险、README/CHANGELOG 边界与验证矩阵；案例以匿名原型对照呈现，不绑定具体仓库。

## [2.15.1] - 2026-03-23

### Changed

- 版本号与 marketplace 主版本同步至 2.15.1（本次无 `dev-skills` 技能内容变更）。

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
