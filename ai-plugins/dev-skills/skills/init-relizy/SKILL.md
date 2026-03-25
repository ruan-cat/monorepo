---
name: init-relizy
description: 为任意 pnpm monorepo 从零接入或补强 relizy（changelogen）发版链路：先仓库侦察与风险确认，再落盘配置、兼容策略、README 与验证命令。触发关键词：init relizy、接入 relizy、relizy monorepo、monorepo 发版初始化、changelog.config、relizy.config、独立版本、Windows relizy。
user-invocable: true
metadata:
  version: "1.3.0"
---

# Init Relizy — Monorepo 发版配置落地技能

本技能是**执行型**工作流：从仓库体检、策略确认、文件落盘、兼容分支选择，到 dry-run 验证与文档同步，覆盖完整接入链路。不是「只给建议」的咨询技能。

## 与 `package-linter` 的关系

若同时新建或规范化子包，请先或并行参考仓库内 **`package-linter`** 技能，保证 `package.json` / `tsup` / `tsconfig` 与 monorepo 约定一致；本技能聚焦 **relizy 发版域** 的配置与决策。

## Runner：必须使用 `@ruan-cat/utils` 的 `relizy-runner`（禁止自建脚本）

兼容层（Windows GNU 工具补齐 + independent 基线 tag 预检）由 **`@ruan-cat/utils`** 包实现，通过 **`relizy-runner` bin** 调用。**不得**在目标仓库内新建 `scripts/relizy-runner.ts` 或任何本地 runner 副本作为落地方案。

- **权威说明**（行为、参数、根脚本示例）：仓库内见 `packages/utils/src/node-esm/scripts/relizy-runner/index.md`；若需在线直链，可参考：<https://raw.githubusercontent.com/ruan-cat/monorepo/refs/heads/dev/packages/utils/src/node-esm/scripts/relizy-runner/index.md>
- **调用约定**：须使用 `package.json` 的 `bin`（如 `npx relizy-runner …` / `pnpm exec relizy-runner …`），**禁止**使用 `tsx @ruan-cat/utils/relizy-runner` 等会绕过 exports 的写法（详见该文档「必须使用 bin 命令调用」）。

## `--yes` 与非交互发版（技能必须显式传递）

**背景**：relizy 在 `release` / `bump` 等流程中可能弹出「是否继续」类交互；在无 TTY 或 CI 下会**一直等待 stdin**，表现为进程挂起。上游选项 **`--yes`** 表示 _Skip confirmation prompt_，与版本计算算法无关。

**与 `relizy-runner` 的关系**：较新版本的 `@ruan-cat/utils` 会在 **`release` / `bump`** 子命令上**自动追加** `--yes`（除非使用 runner 专用的 `--no-yes` 关闭）。即便如此，**执行本技能时仍须在一切落盘内容中显式写出 `--yes`**，包括：

1. 根 `package.json` 里所有 `relizy-runner release`、`relizy-runner bump`（若配置）及需要在非交互下运行的 `changelog` 示例；
2. README / 内部文档中的等价命令；
3. 本文件下文「验证命令基线」与 [`references/verification-matrix.md`](references/verification-matrix.md) 中的示例。

**原因**：脚本与文档自描述、与 CI 复制粘贴一致、兼容尚未内置自动注入的旧版 `@ruan-cat/utils`，并覆盖 **`changelog`** 等 runner 未默认注入 `--yes` 的路径。

**本地需要逐步人工确认**：使用 runner 的 **`--no-yes`**（由 runner 消费，不转发给 relizy），详见 `packages/utils/.../relizy-runner/index.md`。

**直连 `relizy`（无 runner）时**：凡涉及 `release` / `bump` 的示例命令，同样必须包含 `--yes`，除非文档明确是在演示交互模式。

## 三层目录

| 层级             | 路径                         | 用途                                                     |
| ---------------- | ---------------------------- | -------------------------------------------------------- |
| 流程与清单       | `SKILL.md`（本文件）         | 阶段划分、阻断条件、索引                                 |
| 可复制片段与表格 | [`templates/`](templates/)   | 侦察输出、确认清单、配置骨架、README 段落                |
| 原理与决策依据   | [`references/`](references/) | 决策树、陷阱、验证矩阵、匿名原型对照（含期望决策检查项） |

执行时：**先读本文件阶段 → 按需打开 templates 填表 → 遇概念问题查 references**。

## 非目标（必须遵守）

- 不默认执行 `npm publish`、不默认开启 provider release。
- 不把本技能写成某个私有或固定仓库的专用脚本；具体仓库仅可作为**匿名「已验证原型」**学习，见 [`references/validated-archetypes.md`](references/validated-archetypes.md)。
- 在 **`private` 策略未确认、兼容策略未决** 时，不盲目改写 release 脚本或宣称「已接入完成」。
- 不以「已验证无 baseline tag 问题」为由默认跳过 `@ruan-cat/utils` 的 `relizy-runner`；若坚持不用该 bin，必须有明确的手工验证记录（见 [`references/baseline-tags.md`](references/baseline-tags.md)）。
- **禁止**为接入 relizy 在目标仓库内**新建**本地 runner 脚本；统一通过 `@ruan-cat/utils` 依赖与 `relizy-runner` 命令完成运行。
- 不将 `selective` 与「各包独立版本线」混为一谈。

## 标准五阶段流程

```plain
Task Progress:
- [ ] 阶段 1 — 侦察：收集工作区、锁文件、现有发版工具、tag、`private`、README/CHANGELOG 边界（用 templates/workspace-discovery.md）
- [ ] 阶段 2 — 第一次确认：仅对高风险项确认（versionMode、全量纳管、`private`、兼容策略、是否写 README）（用 templates/package-eligibility.md）
- [ ] 阶段 3 — 落盘：依赖（含 `@ruan-cat/utils` + `relizy`）、changelog.config.ts、relizy.config.ts（含 `release` 默认块）、根脚本指向 `relizy-runner` 且 **显式包含 `--yes`**（见上节）、可选 pnpm patch、必要时最小 tsconfig（用 templates/config-writer.md + references/config-templates.md）
- [ ] 阶段 4 — 验证：帮助、changelog dry-run、release dry-run（必要时 --no-publish 等），见 references/verification-matrix.md
- [ ] 阶段 5 — 收尾：修改清单、破坏性说明、残余风险、下一步（用 templates/docs-sync.md）
```

## 显式阻断条件（不得跳过）

以下任一成立时，**停止自动落盘**，改为只输出方案与用户确认：

- 用户要求「各子包独立版本」，却拟使用 `selective` 充当独立版本方案（见 [`references/version-mode-decision.md`](references/version-mode-decision.md)）。
- 拟纳入 relizy 的包涉及 `private: true` 变更，但未获书面/对话确认（见 [`references/package-visibility.md`](references/package-visibility.md)）。
- 确认不使用 `relizy-runner`（`@ruan-cat/utils`），但未完成手工 baseline tag 确认且未建立补 tag 机制（见 [`references/baseline-tags.md`](references/baseline-tags.md)）。
- Windows 下已观测到 `grep` / `head` / `sed` 类失败，但未选择任何兼容策略（见 [`references/windows-compatibility.md`](references/windows-compatibility.md)）。

## 核心决策（速查）

1. **versionMode**：「每包独立版本线」→ `independent`；「只 bump 变更包且共享一次发布语义」≠ 独立版本线，见决策表。
2. **兼容策略**：**首选** `@ruan-cat/utils` 提供的 **`relizy-runner` bin**（同时解决 Windows GNU 工具问题与 baseline tag 预检）；次选 `pnpm patch`（仅解决 Windows 工具问题，需另行处理 baseline tag）；无额外层仅在满足严格前提时可用（见 [`references/windows-compatibility.md`](references/windows-compatibility.md)）。
3. **文档边界**：`rootChangelog` 与 README 更新是两条链路；`formatCmd` 不应宽到误改 README，见 [`references/readme-and-changelog-boundaries.md`](references/readme-and-changelog-boundaries.md)。

## templates/ 索引

| 文件                                                                   | 用途                                                                  |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`templates/workspace-discovery.md`](templates/workspace-discovery.md) | 侦察结果结构化输出                                                    |
| [`templates/package-eligibility.md`](templates/package-eligibility.md) | 纳管范围与 `private` 确认                                             |
| [`templates/config-writer.md`](templates/config-writer.md)             | 配置与脚本落盘骨架（含 `@ruan-cat/utils` / `relizy-runner` 接入步骤） |
| [`templates/runtime-compat.md`](templates/runtime-compat.md)           | 兼容策略记录（`relizy-runner` bin 为默认推荐）                        |
| [`templates/docs-sync.md`](templates/docs-sync.md)                     | README 发版章节模板                                                   |

## references/ 索引

| 文件                                                                                             | 内容                                      |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| [`references/overview.md`](references/overview.md)                                               | 技能知识地图与推荐落地顺序                |
| [`references/discovery-checklist.md`](references/discovery-checklist.md)                         | 侦察信号清单                              |
| [`references/version-mode-decision.md`](references/version-mode-decision.md)                     | `independent` / `selective` / 统一版本线  |
| [`references/config-templates.md`](references/config-templates.md)                               | 配置插槽与文件角色                        |
| [`references/type-compatibility.md`](references/type-compatibility.md)                           | `types` 与 changelogen 收口               |
| [`references/windows-compatibility.md`](references/windows-compatibility.md)                     | `relizy-runner` / patch / 无层            |
| [`references/baseline-tags.md`](references/baseline-tags.md)                                     | 独立模式与 package tags                   |
| [`references/package-visibility.md`](references/package-visibility.md)                           | `private` 与扫描范围                      |
| [`references/readme-and-changelog-boundaries.md`](references/readme-and-changelog-boundaries.md) | 根 CHANGELOG 与 README                    |
| [`references/verification-matrix.md`](references/verification-matrix.md)                         | 验证命令矩阵                              |
| [`references/rollback-and-risks.md`](references/rollback-and-risks.md)                           | 回滚与止损                                |
| [`references/validated-archetypes.md`](references/validated-archetypes.md)                       | 三类原型对照 + 期望决策检查项（无仓库名） |

## 验证命令基线（根目录执行）

具体标志与失败归因见 [`references/verification-matrix.md`](references/verification-matrix.md)。

**已接入 `relizy-runner`（推荐）时**，优先用 bin 做与发版同路径的验证：

```bash
pnpm exec relizy-runner --help
pnpm exec relizy-runner changelog --dry-run --yes
pnpm exec relizy-runner release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes
```

**未使用 runner、直连 relizy 时**（须已满足 [`references/windows-compatibility.md`](references/windows-compatibility.md) 中「无额外层」前提）：

```bash
pnpm exec relizy --help
pnpm exec relizy changelog --dry-run
pnpm exec relizy release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes
```

若输出为「无可 bump 包」且无配置/跨平台错误，应解释为**验证通过但当前无变更可发**，而非配置失败。
