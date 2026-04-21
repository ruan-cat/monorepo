<!-- 已完成 -->

# 2026-04-14 relizy canary initial independent release 测试设计

## 目标

在 Windows 环境中，以一个独立的、全新的 git worktree 作为测试容器，创建两个全新的 pnpm monorepo sandbox，验证 `relizy@1.3.0-canary.a8967ef.0` 在 **不使用 `relizy-runner`** 的前提下，是否已经具备以下能力：

- 在 `independent` 模式下，对没有任何预置 package baseline tag 的全新 monorepo 跑通 `changelog --dry-run`
- 在同样前提下跑通 `release --dry-run`
- 在同样前提下执行真实 `release`，并产出：
  - changelog markdown
  - release commit
  - package tags

本次测试的结论将直接用于判断 `ai-plugins/dev-skills/skills/init-release-base-relizy-and-bumpp` 中以下约束是否已经过时：

- “必须使用 `relizy-runner`”
- “不使用 runner 时必须手工补 baseline package tags”

## 非目标

- 不在本次测试阶段直接修改 `init-release-base-relizy-and-bumpp` skill
- 不验证 `bumpp` 的根包发版流程
- 不验证 GitHub Release / CI 工作流
- 不因本次结论删除 `release` / `bump` 显式追加 `--yes` 的约束

## 背景

当前仓库中的 `init-release-base-relizy-and-bumpp` skill 仍将 `relizy-runner` 作为默认且强制的安全层，理由有二：

1. Windows 下为 relizy 补齐 `grep` / `head` / `sed`
2. 在 `independent` 模式首发前，阻断缺失 baseline package tags 的仓库

用户已自行验证 PR #53，对应的路径分隔符误报问题不在本次测试范围内。本次测试聚焦 PR #58 所代表的 canary：`1.3.0-canary.a8967ef.0`，重点验证它是否已经覆盖：

- Windows GNU 工具依赖
- initial independent release 的 baseline tag 首发能力

## 方案选择

### 方案 A：最小真实场景法

只创建一个全新 monorepo，在当前 Windows 环境中直接直连 `relizy`，验证 dry-run 与真实首发。

优点：

- 最贴近真实用户环境
- 执行路径最短

缺点：

- 若本机 PATH 已经间接可见 GNU 工具，则无法证明 canary 已真正摆脱该依赖

### 方案 B：严格隔离法

只创建一个全新 monorepo，但在执行 relizy 时裁剪 PATH，尽量排除 `grep` / `head` / `sed` 的外部兜底。

优点：

- 对 Windows GNU 依赖问题的结论更强

缺点：

- 单层结果不够全面
- PATH 裁剪失败时容易和项目问题混淆

### 方案 C：双层验证法

创建两个结构一致的 sandbox monorepo，只改变执行环境：

- sandbox A：正常 Windows 环境
- sandbox B：裁剪 PATH 的严格环境

每个 sandbox 都执行同一套 dry-run 与真实首发验证。

结论：采用方案 C。

原因：本次目标不是单纯证明“能跑”，而是要反推当前 skill 中哪些旧约束可以删除、哪些仍要保留。双层验证法可以把“baseline tag 首发能力”和“GNU 工具依赖”拆开判断。

## 测试拓扑

### 隔离 worktree

测试从当前仓库创建一个新的分支 worktree，并放在仓库外的临时目录。worktree 作为测试总控容器，承载：

- 本设计文档
- 后续实施计划
- 测试脚本
- 测试结果索引
- 两个 sandbox monorepo

worktree 放在仓库外，是为了避免污染当前工作区，并方便测试结束后整体清理。

### sandbox A：正常 Windows 环境

创建一个全新的 pnpm monorepo，自带独立 `.git` 历史，目录结构最小化为：

- `package.json`
- `pnpm-workspace.yaml`
- `relizy.config.ts`
- `changelog.config.ts`
- `packages/alpha/package.json`
- `packages/beta/package.json`

关键约束：

- 安装 `relizy@1.3.0-canary.a8967ef.0`
- 不安装 `@ruan-cat/utils`
- 不使用 `relizy-runner`
- 根 scripts 全部直连 `relizy`

### sandbox B：裁剪 PATH 的严格环境

复制 sandbox A 的项目结构、依赖和 git 历史，只改变命令执行环境。执行 relizy 时主动裁剪 PATH，目标是：

- 保留 `node`
- 保留 `pnpm`
- 保留 `git`
- 尽量排除 `grep` / `head` / `sed`

目的不是人为制造非真实环境，而是尽量逼近“没有 runner 帮助补 PATH”的硬条件。

## sandbox monorepo 设计

### 包结构

使用两个 workspace package：

- `@sandbox/alpha`
- `@sandbox/beta`

版本初始都为 `0.0.0`

`relizy.config.ts` 使用 `independent` 模式，并从 `pnpm-workspace.yaml` 自动读取工作区 globs，尽量对齐当前 skill 模板的配置思路。

### 根 scripts

根 `package.json` 将提供以下命令：

- `changelog:dry`: `relizy changelog --dry-run`
- `release:dry`: `relizy release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes`
- `release:real`: `relizy release --no-publish --no-provider-release --no-push --yes`

这里故意不引入 `relizy-runner`，以便直接验证 upstream canary 的行为。

### git 历史布置

两个 sandbox 使用同一组历史：

1. 初始脚手架提交
2. 只改 `packages/alpha` 的 `feat:` 提交，作为 independent 首发触发点
3. 可选的根目录非包变更提交，用于观察是否误影响 `beta`

关键前提：

- 不预置任何 `@sandbox/*@x.y.z` baseline tags
- 直接让 relizy 面对“全新 monorepo 首发”状态

## 执行矩阵

### 阶段 0：环境留痕

两个 sandbox 都先记录以下信息：

- `node -v`
- `pnpm -v`
- `git --version`
- `pnpm exec relizy --version`
- `where git`
- `where grep`
- `where head`
- `where sed`

这组信息用于证明 A/B 的环境差异真实存在，而不是测试后主观解释。

### 阶段 1：直连 CLI dry-run

两个 sandbox 都执行：

```bash
pnpm exec relizy --help
pnpm exec relizy changelog --dry-run
pnpm exec relizy release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes
```

判定：

- 若这里失败，且失败点与 GNU 工具或 baseline tags 有关，则无需继续宣称 canary 已可替代 runner
- 若这里通过，仅说明 dry-run 链路可用，不能直接推导真实首发可用

### 阶段 2：真实首发

两个 sandbox 都执行：

```bash
pnpm exec relizy release --no-publish --no-provider-release --no-push --yes
```

判定必须同时满足：

- 命令退出码为 `0`
- 生成真实 changelog markdown
- 生成真实 release commit
- 生成真实 package tags
- 只 bump `alpha`
- `beta` 不应被误 bump

### 阶段 3：结果核验

每个 sandbox 都采集并保存：

- `git status --short`
- `git log --oneline --decorate -n 5`
- `git tag --list`
- 根目录与 `packages/*` 下的 `CHANGELOG.md`
- `packages/alpha/package.json`
- `packages/beta/package.json`
- 失败时的完整 stdout / stderr

## 结果解释规则

### 情形 1：A、B 都通过

说明 `1.3.0-canary.a8967ef.0` 已同时覆盖：

- Windows GNU 工具依赖问题
- initial independent release 的 baseline tag 首发问题

可考虑在 skill 中降级或删除以下约束：

- “必须使用 `relizy-runner`”
- “不使用 runner 时必须手工补 baseline package tags”

### 情形 2：A 通过，B 失败

说明 canary 解决了 baseline tag 首发问题，但未完全摆脱 Windows GNU 工具依赖。

此时只能放宽 baseline tag 阻断，不能删除 `relizy-runner` 的 Windows 兼容层定位。

### 情形 3：A、B 都失败，且失败点为 baseline tags / package detection

说明 canary 仍不具备真正的 initial independent release 能力。

skill 中关于 baseline tags 的阻断仍必须保留。

### 情形 4：A、B 都失败，且失败点为 GNU 工具

说明 PR #58 在当前 canary 上仍不足以替代 runner 的 PATH 补齐能力。

skill 中“必须使用 `relizy-runner`”的约束不应删除。

### 情形 5：dry-run 通过，但真实首发失败

说明 upstream 可能只修复了探测流程，未修完整 release 链路。

这种情况下，skill 不能据此放弃 runner 或 baseline 防护。

## 明确保留项

无论本次测试结果如何，`release` / `bump` 显式追加 `--yes` 的约束都不在本次删除范围内。

原因：

- 该约束服务于无 TTY / CI / script 场景下避免交互挂起
- 它与 Windows GNU 工具问题、baseline tag 首发问题不是同一个问题域

## 风险与缓解

1. PATH 裁剪可能误伤 `pnpm` 或 `git`
   - 缓解：裁剪前先记录真实可执行路径，仅保留最小必需目录
2. relizy 真实首发可能同时修改根与子包 changelog
   - 缓解：把 changelog 结果作为证据采集项，而不是预先假设只改某一个位置
3. 全新 monorepo 的提交语义若不足以触发 bump，可能导致“无包可发”假阳性
   - 缓解：明确准备一个只改 `alpha` 的 `feat:` 提交，作为触发样本

## 完成标准

在用户审阅并批准本 spec 后，进入实施计划阶段时，必须满足以下交付目标：

- 有一个仓库外的隔离 worktree 作为测试容器
- 有两个结构一致、环境不同的 sandbox monorepo
- 两个 sandbox 都完成 dry-run 与真实首发验证
- 产出可复核的环境证据、release 证据与失败证据
- 给出明确结论：当前 skill 中哪些约束可以删、哪些仍要保留

## 下一步

1. 用户审阅本设计文档
2. 若无修改，进入 `writing-plans` 阶段，把执行步骤细化为可实施计划
3. 计划获批后，再创建 worktree 并开始实际测试
