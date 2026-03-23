# 11comm Relizy Init Workflow Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 设计并实现一个通用 workflow skill，用于给任意 monorepo 初始化 `relizy` 发版配置，并覆盖从仓库体检、配置落盘、README 补充、兼容层脚本、baseline tag 检查到验证命令的完整实施链路。`11comm` 与 `EAMS` 仅作为已验证案例沉淀到 skill 的 references 与 evals 中。

**Architecture:** 使用“通用工作流骨架 + 已验证案例分支”的混合方案。主 skill 负责识别目标 monorepo 的工作区结构、版本策略、tag 历史、平台约束与文档边界，然后按决策树生成或修改 `changelog.config.ts`、`relizy.config.ts`、根命令、README、兼容层或补丁方案，并在落盘后执行验证矩阵。案例层只提供决策依据，不把 skill 写死成 `11comm` 或 `EAMS` 的仓库专用脚本。

**Tech Stack:** Markdown skill docs, `relizy`, `changelogen`, `pnpm`, `git`, TypeScript root config files, `tsx`, README/report templates, Vitest eval fixtures, Windows shell compatibility analysis.

---

## 计划前提

- 本计划只编写“未来如何实现 skill”的计划文档，不在本任务中创建真实 skill 文件。
- 为了让计划具备可执行性，后续 skill 的主源路径暂定为 `.claude/skills/relizy-init-workflow/`。
- `.agents/skills` 与 `.agent/skills` 的镜像/分发策略不在本计划的阻塞范围内，后续如有需要再补。
- 本计划的案例输入以以下两个已验证仓库为准：
  - `D:\code\github-desktop-store\01s-11comm`
  - `D:\code\01s\202603-13hzb\yunxiao\01s-2603-13eams\eams-frontend-monorepo`

## 已验证案例摘要

### 11comm 路线

- 已验证的关键文件：
  - `D:\code\github-desktop-store\01s-11comm\relizy.config.ts`
  - `D:\code\github-desktop-store\01s-11comm\changelog.config.ts`
  - `D:\code\github-desktop-store\01s-11comm\package.json`
  - `D:\code\github-desktop-store\01s-11comm\scripts\relizy-runner.ts`
  - `D:\code\github-desktop-store\01s-11comm\tests\relizy-runner.test.ts`
  - `D:\code\github-desktop-store\01s-11comm\README.md`
- 已验证结论：
  - `relizy` 的 `selective` 不是“各子包独立版本”，要用 `independent` 才符合独立发布语义。
  - Windows PowerShell 下 `relizy@1.2.1` 会直接依赖 `grep` / `head` / `sed`。
  - 仓库缺失 package baseline tags 时，应在真正执行 `relizy release` 前阻断并打印补 tag 命令。
  - `private: true` 的 workspace 包不会被 `relizy` 扫描，若要纳入版本管理必须明确评估并记录破坏性变更。
  - 根级 `changelog.config.ts` 优先使用包根导入，而不是 `src/*` 深路径导入。

### EAMS 路线

- 已验证的关键文件：
  - `D:\code\01s\202603-13hzb\yunxiao\01s-2603-13eams\eams-frontend-monorepo\relizy.config.ts`
  - `D:\code\01s\202603-13hzb\yunxiao\01s-2603-13eams\eams-frontend-monorepo\changelog.config.ts`
  - `D:\code\01s\202603-13hzb\yunxiao\01s-2603-13eams\eams-frontend-monorepo\patches\relizy@1.2.1.patch`
- 已验证结论：
  - 也采用了 `independent` 模式，但 Windows 兼容问题走的是 `pnpm patch relizy` 路线，而不是仓库内 runner 包装层。
  - 包根导入 `@ruan-cat/commitlint-config` 与消费侧类型收窄的组合可以消除配置文件上的类型噪声。
  - 当仓库工作区范围更大时，`monorepo.packages` 要与真实 workspace layout 对齐，而不能硬抄 `11comm` 的 `apps/*`。

### 两条路线的通用启示

- skill 必须先做仓库体检，再决定用 runner 包装层、上游 patch，还是不做兼容。
- skill 必须先识别 tag 历史，再决定是直接 release，还是先要求补 baseline package tags。
- skill 必须把 `private` 变更当成破坏性行为处理，而不是悄悄改值。
- skill 必须明确 README 与 `CHANGELOG.md` 的边界，不能把 `rootChangelog: true` 误写成“改 README”。

## 非目标

- 不把 skill 设计成只适用于 `11comm` 的仓库专用模板。
- 不在 skill 中默认开启 `npm publish` 或 provider release。
- 不在缺少 tag 历史、私有包策略未确认、Windows 兼容策略未决时盲目落盘 release 命令。
- 不要求所有 monorepo 都必须使用 runner；runner 只是兼容策略之一。

### Task 1: 锁定 Skill 契约与主文件结构

**Files:**

- Create: `.claude/skills/relizy-init-workflow/SKILL.md`
- Create: `.claude/skills/relizy-init-workflow/references/overview.md`
- Create: `.claude/skills/relizy-init-workflow/references/case-index.md`
- Create: `.claude/skills/relizy-init-workflow/evals/evals.json`
- Reference: `D:\code\github-desktop-store\gh.ruancat.monorepo\.claude\skills\package-linter\SKILL.md`
- Reference: `D:\code\github-desktop-store\gh.ruancat.monorepo\.claude\skills\release-ai-plugins\SKILL.md`

- [ ] **Step 1: 写出 skill 的触发条件和非目标**

在 `SKILL.md` 顶部明确这不是“只给建议”的 skill，而是“从仓库体检一路执行到配置落盘、README 补充、兼容层/补丁方案、baseline tag 检查与验证命令”的工作流 skill。

- [ ] **Step 2: 固定主文件结构**

在 `references/overview.md` 中定义 skill 的内部结构，至少包括：总览、决策树、案例对照、配置模板、README 模板、验证矩阵、风险说明。

- [ ] **Step 3: 建立案例索引**

在 `references/case-index.md` 记录 `11comm` 与 `EAMS` 的关键输入文件、采用策略、已知陷阱与验证命令。

- [ ] **Step 4: 先写 eval prompts，再写正文细节**

在 `evals/evals.json` 中先放入 3 个场景 prompt：

1. `11comm` 型：Windows、本地执行、缺 package baseline tags、需要 runner。
2. `EAMS` 型：Windows、本地执行、倾向 patch 上游依赖。
3. 通用型：无兼容问题、已有 tag 历史、只需标准配置落盘。

- [ ] **Step 5: 验证 skill 契约是否完整**

对照 `package-linter` 和 `release-ai-plugins` 的写法，确认 `SKILL.md` 的 description 既能强触发，又没有把 skill 收窄成仓库专用操作手册。

### Task 2: 设计“仓库体检 -> 版本模式决策”主流程

**Files:**

- Create: `.claude/skills/relizy-init-workflow/references/discovery-checklist.md`
- Create: `.claude/skills/relizy-init-workflow/references/version-mode-decision.md`
- Test: `.claude/skills/relizy-init-workflow/evals/evals.json`

- [ ] **Step 1: 写仓库体检清单**

在 `references/discovery-checklist.md` 中定义 skill 落盘前必须收集的信号：

- workspace globs
- 包管理器与 lockfile
- 现有 changelog / release 工具
- 子包 `private` 状态
- 现有 git tag 结构
- Windows / CI / shell 环境
- 根 README 与 CHANGELOG 的现有边界

- [ ] **Step 2: 写 versionMode 决策表**

在 `references/version-mode-decision.md` 中明确：

- “每个子包独立版本号” => 首选 `independent`
- `selective` 不等于独立版本线
- 只有在仓库本来就接受统一版本线时，才考虑 `unified` / `selective`

- [ ] **Step 3: 固化拒绝条件**

把以下条件写成 workflow 的显式阻断项：

- 用户要求独立版本，但仓库却尝试配置 `selective`
- `private` 变更未确认
- baseline package tags 缺失但用户未接受首次补 tag

- [ ] **Step 4: 用案例回放验证决策表**

手工检查 eval 期望：

- `11comm` 场景必须选择 `independent`
- `EAMS` 场景必须选择 `independent`
- skill 不得把 “只想 bump 有变更的包” 错误解释为 `selective = 独立版本`

### Task 3: 设计配置落盘模板与类型收口规则

**Files:**

- Create: `.claude/skills/relizy-init-workflow/references/config-templates.md`
- Create: `.claude/skills/relizy-init-workflow/references/type-compatibility.md`
- Reference: `D:\code\github-desktop-store\01s-11comm\relizy.config.ts`
- Reference: `D:\code\github-desktop-store\01s-11comm\changelog.config.ts`
- Reference: `D:\code\01s\202603-13hzb\yunxiao\01s-2603-13eams\eams-frontend-monorepo\relizy.config.ts`

- [ ] **Step 1: 写通用模板骨架**

在 `references/config-templates.md` 中给出以下文件的模板骨架和插槽说明：

- `changelog.config.ts`
- `relizy.config.ts`
- 根 `package.json` 的 release 命令
- 需要时的根 `tsconfig.json`

- [ ] **Step 2: 写导入策略**

明确优先级：

1. 优先使用包根导入
2. 仅当包根没有 exports 或类型不可用时，才考虑深路径导入
3. 若根入口有副作用，记录为已知风险，但不默认退回 `src/*` 深路径

- [ ] **Step 3: 写消费侧类型收口规则**

在 `references/type-compatibility.md` 中规定：

- `relizy` 的 `types` 配置需要过滤掉 `true`
- `changelogithub` 的 `types` 配置只保留对象型 entries
- 当根目录配置文件本身需要 TypeScript 解析时，可以补最小根级 `tsconfig.json`，但必须限制 `include` 范围

- [ ] **Step 4: 用 11comm / EAMS 回放模板**

校验模板能表达：

- `11comm` 的 `apps/*`
- `EAMS` 的 `apps/*`、`old/*`、`packages/*`、`configs/*`
- 根级 changelog 与各子包 changelog 并存

### Task 4: 设计 Windows 兼容与 baseline tag 分支

**Files:**

- Create: `.claude/skills/relizy-init-workflow/references/windows-compatibility.md`
- Create: `.claude/skills/relizy-init-workflow/references/baseline-tags.md`
- Create: `.claude/skills/relizy-init-workflow/references/package-visibility.md`
- Reference: `D:\code\github-desktop-store\01s-11comm\scripts\relizy-runner.ts`
- Reference: `D:\code\01s\202603-13hzb\yunxiao\01s-2603-13eams\eams-frontend-monorepo\patches\relizy@1.2.1.patch`

- [ ] **Step 1: 写兼容策略矩阵**

在 `references/windows-compatibility.md` 中定义 3 类分支：

- runner 包装层
- `pnpm patch relizy`
- 无兼容层，直接使用原始命令

每种分支都要写清适用条件、优点、缺点、维护成本与回滚方式。

- [ ] **Step 2: 写 baseline tag 检查规则**

在 `references/baseline-tags.md` 中明确：

- `independent` 模式下，必须先识别每个子包是否已有 `@scope/pkg@x.y.z` tag
- 若缺失，应阻断第一次 release，并打印应执行的 `git tag` / `git push origin ...` 命令
- 补 tag 发生前，不得伪装成“正常 dry-run”

- [ ] **Step 3: 写 package visibility 风险规则**

在 `references/package-visibility.md` 中写明：

- `private: true` 的 workspace 不会被 `relizy` 扫描
- 若要改成可参与版本管理，必须在 README 或报告中记录为破坏性变更
- skill 不应自行忽略这个风险

- [ ] **Step 4: 用案例验证分支选择**

确保：

- `11comm` eval 选出 runner + baseline tag precheck
- `EAMS` eval 能选出 patch 方案
- skill 不会对所有 Windows 仓库都强推 runner

### Task 5: 设计 README、报告与用户提示模板

**Files:**

- Create: `.claude/skills/relizy-init-workflow/references/readme-template.md`
- Create: `.claude/skills/relizy-init-workflow/references/breaking-change-report.md`
- Reference: `D:\code\github-desktop-store\01s-11comm\README.md`
- Reference: `D:\code\github-desktop-store\01s-11comm\apps\admin\src\docs\reports\2026-03-23-relizy-independent-release-breaking-change.md`

- [ ] **Step 1: 写 README 最小章节模板**

在 `references/readme-template.md` 中定义 skill 落盘后 README 至少应补充：

- 发版命令
- 为什么使用兼容层或 patch
- 首次接入时如何补 baseline package tags
- 哪些功能启用，哪些功能显式关闭（如 `--no-publish`）

- [ ] **Step 2: 写“为什么需要兼容层”模板**

模板必须明确区分：

- 兼容层不是为了修改 `relizy` 发版逻辑
- 兼容层只是用于补前置约束
- 哪些仓库不需要兼容层
- 哪些仓库和 `11comm` 一样应该同步加兼容层

- [ ] **Step 3: 写破坏性变更报告模板**

在 `references/breaking-change-report.md` 中定义当出现以下行为时，skill 必须建议或生成报告：

- `private: true` -> `false`
- 首次统一版本线切换
- 改变 tag 体系

- [ ] **Step 4: 写 README / CHANGELOG 边界提醒**

明确写入：

- `rootChangelog: true` 代表根目录 `CHANGELOG.md`
- `formatCmd` 不能宽到顺手改 `README.md`
- README 更新与 changelog 输出是两条链路

### Task 6: 设计验证矩阵、eval 断言与验收标准

**Files:**

- Create: `.claude/skills/relizy-init-workflow/references/verification-matrix.md`
- Modify: `.claude/skills/relizy-init-workflow/evals/evals.json`
- Test: `D:\code\github-desktop-store\01s-11comm\tests\relizy-runner.test.ts`

- [ ] **Step 1: 写验证矩阵**

在 `references/verification-matrix.md` 中定义 skill 完成一次接入后至少要考虑的验证命令：

- 根配置文件类型检查
- `relizy release --dry-run`
- package baseline tag 检查
- 如存在 runner，则执行 runner 测试或最小 smoke test
- 目标子包的 `typecheck`

- [ ] **Step 2: 写 eval 断言**

为 3 个 eval 场景补充断言，至少检查：

- 选中的 `versionMode` 是否正确
- 是否选择了正确的兼容策略
- 是否在缺 tag 时要求补 baseline tags
- 是否输出了 README 与破坏性变更说明要求

- [ ] **Step 3: 增加“错误决策”断言**

加入失败型断言，防止 skill：

- 把 `selective` 误判为独立版本方案
- 在 `private: true` 风险未确认时自动改包
- 在 Windows PowerShell 下忽略 `grep` / `head` / `sed` 依赖

- [ ] **Step 4: 定义最终验收标准**

验收通过必须同时满足：

- 能正确处理 `11comm` 场景
- 能正确处理 `EAMS` 场景
- 能处理一个没有案例包袱的通用 monorepo 场景
- 输出结果包含配置落盘、文档补充、兼容策略与验证命令

### Task 7: 组织最终落地顺序与回滚说明

**Files:**

- Modify: `.claude/skills/relizy-init-workflow/SKILL.md`
- Modify: `.claude/skills/relizy-init-workflow/references/overview.md`
- Create: `.claude/skills/relizy-init-workflow/references/rollback-and-risks.md`

- [ ] **Step 1: 写实现顺序**

在 `references/overview.md` 中固定后续真正实现 skill 的顺序：

1. 先补 references 与 evals
2. 再写主 `SKILL.md`
3. 再跑案例验证
4. 最后才讨论镜像分发

- [ ] **Step 2: 写回滚与止损规则**

在 `references/rollback-and-risks.md` 中写明：

- 发现 `private` 风险未获批准时停止落盘
- 发现 tag 历史不完整时停止 release 命令改写
- 发现上游 `relizy` 升级导致兼容矩阵失效时，回退到“只生成方案、不自动落盘”的模式

- [ ] **Step 3: 写未来实现阶段的 Done 定义**

定义“plan 完成”不等于“skill 完成”。真正完成应满足：

- `SKILL.md`、references、evals 全部落盘
- 至少跑通 `11comm` / `EAMS` / 通用 monorepo 三组案例
- 用户审阅通过后，才进入真正的 skill 发布或同步阶段

## 验收输出

本计划落地后的预期成果不是立即生成 skill，而是得到一份可以直接执行的 skill 实施蓝图。真正进入实现阶段时，必须能回答以下问题：

- 这个 skill 何时触发，何时拒绝继续？
- 它如何识别 monorepo 的工作区、tag 历史与 Windows 风险？
- 它什么时候选择 runner，什么时候选择 patch？
- 它如何把 `11comm` 与 `EAMS` 的经验抽象为通用决策，而不是仓库专用硬编码？
- 它如何把 README、破坏性变更说明、验证命令纳入同一条 workflow？

只有这些问题都在实现阶段被证实可执行，这个 `relizy-init-workflow` skill 才算真正完成。
