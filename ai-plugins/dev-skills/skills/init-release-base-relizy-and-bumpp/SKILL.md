---
name: init-release-base-relizy-and-bumpp
description: 为任意 pnpm monorepo 从零接入 relizy + bumpp 组合发版方案：子包独立版本由 relizy 管理，根包版本由 bumpp 管理，GitHub Release 由 CI 工作流自动创建。覆盖仓库侦察、配置落盘、依赖对齐、故障预检与验证。触发关键词：init relizy、init bumpp、接入发版、monorepo 发版初始化、relizy + bumpp、relizy.config、bump.config、changelog.config、独立版本、GitHub Release 自动化。
user-invocable: true
metadata:
  version: "3.0.0"
---

# Init Release Base — Relizy + Bumpp Monorepo 发版配置落地技能

本技能是**执行型**工作流：为 pnpm monorepo 一次性接入 **relizy（子包）+ bumpp（根包）** 的组合发版方案，从仓库体检、配置落盘、依赖对齐、故障预检，到 dry-run 验证与文档同步，覆盖完整接入链路。

## 设计理念

1. **本地控制 tag 生成**：开发者在本地运行 `pnpm release` 一条命令完成所有版本管理
2. **云端负责 GitHub Release**：GitHub Actions 检测到 tag 推送后，自动从 CHANGELOG.md 提取内容创建 Release
3. **单次 push**：串行主链路中的所有 tags（子包 + 根包）在一次 `git push --follow-tags` 中推送
4. **根包有两种合法入口**：串行主链路使用 `release:root` + `--no-push`；单独根包发版使用 `release:bumpp` + `--push`
5. **两工具协作**：relizy 负责子包（independent 模式），bumpp 负责根包，各司其职

## 与 `package-linter` 的关系

若同时新建或规范化子包，请先或并行参考仓库内 **`package-linter`** 技能，保证 `package.json` / `tsup` / `tsconfig` 与 monorepo 约定一致；本技能聚焦**发版域**的配置与决策。

## Runner：必须使用 `@ruan-cat/utils` 的 `relizy-runner`（禁止自建脚本）

兼容层（Windows GNU 工具补齐 + independent 基线 tag 预检）由 **`@ruan-cat/utils`** 包实现，通过 **`relizy-runner` bin** 调用。**不得**在目标仓库内新建 `scripts/relizy-runner.ts` 或任何本地 runner 副本。

- **权威说明**：`packages/utils/src/node-esm/scripts/relizy-runner/index.md`
- **调用约定**：须使用 `package.json` 的 `bin`（如 `npx relizy-runner …` / `pnpm exec relizy-runner …`），**禁止**使用 `tsx @ruan-cat/utils/relizy-runner` 等绕过 exports 的写法。

## `--yes` 与非交互发版

relizy 在 `release` / `bump` 等流程中可能弹出交互；在无 TTY 或 CI 下会挂起。**串行主链路中的 `release:sub` 与 `release:root` 须显式写出 `--yes`**，包括 `package.json` 脚本、README、验证命令。单独入口 `release:bumpp` 默认保留 bumpp 的交互式版本选择，并通过 `--push` 立即推送根 tag；若目标仓库确实需要全非交互，再自行显式追加 `--yes`。

## 发版流程架构

```plain
pnpm release
    │
    ├── 1. pnpm run release:sub（relizy）
    │   ├── 分析各子包 commits → bump → CHANGELOG → commit → tag
    │   └── 不 push（--no-push）
    │
    ├── 2. pnpm run release:root（bumpp）
    │   ├── bump 根包 patch → changelogen → commit → tag
    │   └── 不 push（--no-push）
    │
    └── 3. pnpm run git:push
        └── git push --follow-tags（一次性推送）
```

详细架构说明见 [`references/release-workflow-architecture.md`](references/release-workflow-architecture.md)。

单独根包发版时使用：

```plain
pnpm run release:bumpp
    ├── bumpp 交互式选择根包版本
    ├── 生成根包 commit + tag
    └── 立即 push（--push）
```

## 一次性落盘的配置文件

| 文件                             | 用途                  | 模板                                                                       |
| -------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| `bump.config.ts`                 | 根包发版（bumpp）     | [`templates/bump.config.ts`](templates/bump.config.ts)                     |
| `changelog.config.ts`            | 共享 changelog 配置   | [`templates/changelog.config.ts`](templates/changelog.config.ts)           |
| `changelogithub.config.ts`       | changelogithub 集成   | [`templates/changelogithub.config.ts`](templates/changelogithub.config.ts) |
| `relizy.config.ts`               | 子包发版（relizy）    | [`templates/relizy.config.ts`](templates/relizy.config.ts)                 |
| `.github/workflows/release.yaml` | GitHub Release 自动化 | [`templates/release.yaml`](templates/release.yaml)                         |

## 依赖清单

接入时须安装以下 devDependencies（版本以 registry 最新为准）：

```bash
pnpm add -D bumpp changelogen changelogithub relizy @ruan-cat/commitlint-config @ruan-cat/utils @types/node pnpm-workspace-yaml
```

## 根包 scripts 模板

详见 [`templates/package-scripts.md`](templates/package-scripts.md)。关键命令：

```json
{
	"release": "pnpm run release:sub && pnpm run release:root && pnpm run git:push",
	"release:sub": "relizy-runner release --no-publish --no-provider-release --no-push --yes",
	"release:root": "bumpp --no-push --yes --release patch",
	"release:bumpp": "bumpp --push",
	"changelog:root": "changelogen --output CHANGELOG.md",
	"git:push": "git push --follow-tags"
}
```

## 三层目录

| 层级             | 路径                         | 用途                                           |
| ---------------- | ---------------------------- | ---------------------------------------------- |
| 流程与清单       | `SKILL.md`（本文件）         | 阶段划分、阻断条件、索引                       |
| 可复制片段与模板 | [`templates/`](templates/)   | 配置文件模板、侦察输出、确认清单、scripts 模板 |
| 原理与决策依据   | [`references/`](references/) | 决策树、陷阱、验证矩阵、故障预检、架构说明     |

## 非目标（必须遵守）

- 不默认执行 `npm publish`、不默认开启 provider release。
- 不把本技能写成某个私有或固定仓库的专用脚本。
- 在 **`private` 策略未确认、兼容策略未决** 时，不盲目落盘。
- **禁止**在目标仓库内新建本地 runner 脚本。
- 不将 `selective` 与「各包独立版本线」混为一谈。

## 标准六阶段流程

```plain
Task Progress:
- [ ] 阶段 1 — 侦察：收集工作区、锁文件、现有发版工具、tag、private、README/CHANGELOG 边界（用 templates/workspace-discovery.md）
- [ ] 阶段 2 — 确认：仅对高风险项确认（versionMode、全量纳管、private、兼容策略）（用 templates/package-eligibility.md）
- [ ] 阶段 3 — 故障预检：检查是否存在 commit-and-tag-version、conventional-changelog-cli 等遗留根包发版工具（见 references/dependency-conflict-precheck.md）
- [ ] 阶段 4 — 落盘：依赖安装、5 个配置文件写入、根 scripts 配置、必要时最小 tsconfig（用 templates/config-writer.md + 各 templates/*.ts）
- [ ] 阶段 5 — 验证：help、changelog dry-run、release dry-run（见 references/verification-matrix.md）
- [ ] 阶段 6 — 收尾：修改清单、破坏性说明、残余风险、下一步（用 templates/docs-sync.md）
```

## 显式阻断条件（不得跳过）

以下任一成立时，**停止自动落盘**，改为只输出方案与用户确认：

- 用户要求「各子包独立版本」，却拟使用 `selective` 充当独立版本方案。
- 拟纳入 relizy 的包涉及 `private: true` 变更，但未获确认。
- 确认不使用 `relizy-runner`，但未完成手工 baseline tag 确认。
- Windows 下已观测到 `grep` / `head` / `sed` 类失败，但未选择兼容策略。
- **检测到遗留根包发版工具**（如 `commit-and-tag-version`、`conventional-changelog-cli`、`standard-version`、`release-it`），但尚未确认是删除还是隔离（见 [`references/dependency-conflict-precheck.md`](references/dependency-conflict-precheck.md)）。

## 核心决策（速查）

1. **versionMode**：「每包独立版本线」→ `independent`；「只 bump 变更包且共享一次发布语义」≠ 独立版本线。
2. **兼容策略**：**首选** `relizy-runner`（Windows GNU 工具 + baseline tag 预检）。
3. **文档边界**：`rootChangelog` 与 README 更新是两条链路；`formatCmd` 不应宽到误改 README。
4. **根包发版**：由 bumpp 独立负责，`bump.config.ts` 不写死 push；串行入口 `release:root` 用 `--no-push`，单独入口 `release:bumpp` 用 `--push`，并通过 `execute` 函数调用 `changelogen --output CHANGELOG.md -r <newVersion>`。
5. **GitHub Release**：由 CI 使用 `gh release create` 从 CHANGELOG.md 提取，不依赖 changelogithub / relizy provider-release。

## templates/ 索引

| 文件                                                                       | 用途                              |
| -------------------------------------------------------------------------- | --------------------------------- |
| [`templates/bump.config.ts`](templates/bump.config.ts)                     | bumpp 根包发版配置模板            |
| [`templates/changelog.config.ts`](templates/changelog.config.ts)           | 共享 changelog 配置模板           |
| [`templates/changelogithub.config.ts`](templates/changelogithub.config.ts) | changelogithub 配置模板           |
| [`templates/relizy.config.ts`](templates/relizy.config.ts)                 | relizy 子包发版配置模板           |
| [`templates/release.yaml`](templates/release.yaml)                         | GitHub Actions Release 工作流模板 |
| [`templates/package-scripts.md`](templates/package-scripts.md)             | 根包 scripts 完整模板与说明       |
| [`templates/workspace-discovery.md`](templates/workspace-discovery.md)     | 侦察结果结构化输出                |
| [`templates/package-eligibility.md`](templates/package-eligibility.md)     | 纳管范围与 private 确认           |
| [`templates/config-writer.md`](templates/config-writer.md)                 | 配置与脚本落盘骨架                |
| [`templates/runtime-compat.md`](templates/runtime-compat.md)               | 兼容策略记录                      |
| [`templates/docs-sync.md`](templates/docs-sync.md)                         | README 发版章节模板               |

## references/ 索引

| 文件                                                                                             | 内容                                 |
| ------------------------------------------------------------------------------------------------ | ------------------------------------ |
| [`references/overview.md`](references/overview.md)                                               | 技能知识地图与推荐落地顺序           |
| [`references/release-workflow-architecture.md`](references/release-workflow-architecture.md)     | relizy + bumpp 组合发版架构详解      |
| [`references/dependency-conflict-precheck.md`](references/dependency-conflict-precheck.md)       | 遗留根包发版工具预检                 |
| [`references/discovery-checklist.md`](references/discovery-checklist.md)                         | 侦察信号清单                         |
| [`references/version-mode-decision.md`](references/version-mode-decision.md)                     | independent / selective / 统一版本线 |
| [`references/config-templates.md`](references/config-templates.md)                               | 配置插槽与文件角色                   |
| [`references/type-compatibility.md`](references/type-compatibility.md)                           | types 与 changelogen 收口            |
| [`references/windows-compatibility.md`](references/windows-compatibility.md)                     | relizy-runner / patch / 无层         |
| [`references/baseline-tags.md`](references/baseline-tags.md)                                     | 独立模式与 package tags              |
| [`references/package-visibility.md`](references/package-visibility.md)                           | private 与扫描范围                   |
| [`references/readme-and-changelog-boundaries.md`](references/readme-and-changelog-boundaries.md) | 根 CHANGELOG 与 README               |
| [`references/verification-matrix.md`](references/verification-matrix.md)                         | 验证命令矩阵                         |
| [`references/rollback-and-risks.md`](references/rollback-and-risks.md)                           | 回滚与止损                           |
| [`references/validated-archetypes.md`](references/validated-archetypes.md)                       | 原型对照与期望决策检查项             |

## 验证命令基线（根目录执行）

详见 [`references/verification-matrix.md`](references/verification-matrix.md)。

**relizy 子包验证（使用 relizy-runner）**：

```bash
pnpm exec relizy-runner --help
pnpm exec relizy-runner changelog --dry-run --yes
pnpm exec relizy-runner release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes
```

**bumpp 根包验证**：

```bash
pnpm exec bumpp --help
pnpm exec bumpp --dry-run --release patch
pnpm exec changelogen --output CHANGELOG.md -r 0.0.1
git ls-remote --tags origin "v0.0.1"
```

期望根包 changelog 生成版本标题 `## v0.0.1`，而不是区间标题 `## v0.0.0...main`。

若本地已有根包 tag，但 GitHub Actions 的 `release.yaml` 未触发，应先检查远程 tag 是否存在，而不是第一时间怀疑工作流的 CHANGELOG 提取逻辑。

若输出为「无可 bump 包」且无配置/跨平台错误，应解释为**验证通过但当前无变更可发**。
