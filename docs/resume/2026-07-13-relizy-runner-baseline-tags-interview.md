# 2026-07-13 relizy-runner independent 基线 tag 自动修复面试谈资

## 一句话定位

这是一个“把开源发版工具的边界缺陷，转化为自建工程化兜底能力”的案例。

我在维护 `gzpc-big-screen` 这类 pnpm monorepo 项目时，遇到 `relizy` 在 independent 模式首次发版前无法正确处理 baseline tag 的问题。这个问题会导致子包发版脚本在没有任何业务代码错误的情况下被阻断。我的处理不是简单手工补 tag，而是把故障抽象成 `@ruan-cat/utils` 内的 `relizy-runner` 能力：在 release/bump 前自动识别缺失 baseline tags，按当前 package 版本创建 annotated tags，并兼容 `--no-push`、`--dry-run`、`--no-commit` 等真实发布链路参数。

## 背景怎么讲

项目背景：

`gzpc-big-screen` 是一个面向智慧城市大屏的 pnpm monorepo，内部有多个独立版本的子包，例如：

- `@gzpc/phase1-amap@0.2.2`
- `@gzpc/phase2-three@1.0.0`
- `@gzpc/guangzhou-data@0.1.0`
- `@gzpc/mini3d@0.1.0`
- `@gzpc/shared-config@0.1.0`
- `@gzpc/shared-theme@0.1.0`

发版命令是：

```bash
relizy-runner release --include-private --no-publish --no-provider-release --no-push --yes
```

这个命令的设计目标是：先跑子包发版，生成本地 release 产物与 tags，但不立即 push；最后由统一的 `git push --follow-tags` 推送。

问题在于 independent 模式首次发版时，`relizy` 需要每个子包先存在一个历史 baseline tag，否则版本计算会失败。旧逻辑只能打印手工命令并退出，实际使用体验是每个项目首次接入都要人工补一串 tags。

## 面试官最应该听到的冲突点

这个问题不是“缺几个 git tag”这么简单，真正的冲突点有三个：

1. **发版工具的抽象边界不完整**

   `relizy` 负责版本计算，但它在 independent 首次发版场景下没有把 baseline bootstrap 作为完整流程处理。工具链暴露了一个需要使用方兜底的边界。

2. **不能用轻量 tag 糊弄过去**

   项目的完整发版链路依赖 `git push --follow-tags`。这个命令只会自动携带 annotated tags，不会携带普通 lightweight tags。所以如果只是 `git tag "@pkg@version"`，本地看似成功，最终统一 push 时 baseline tag 仍可能丢失。

3. **不能为了验证破坏业务项目**

   `gzpc-big-screen` 当时存在用户未提交改动，不能直接改源码、不能污染 tags、不能留下 patch。验证必须临时、可回滚、可复核。

## 我的方案

我把能力加在 `@ruan-cat/utils` 的 `relizy-runner` 里，而不是在 `gzpc-big-screen` 写一次性脚本。

核心设计：

1. release/bump 前读取 workspace 包列表。
2. 对每个包检查是否存在以包名为前缀的历史 tag。
3. 找到缺失 baseline 的包后，生成 `@scope/name@version` tag 名。
4. 默认创建 annotated tag：

   ```bash
   git tag -a "@gzpc/phase1-amap@0.2.2" -m "chore(release): bootstrap @gzpc/phase1-amap@0.2.2"
   ```

5. 如果没有 `--no-push`，使用 atomic push：

   ```bash
   git push --atomic origin "<tag...>"
   ```

6. 如果带了 `--no-push`，只创建本地 annotated tags，交给后续统一 `git push --follow-tags` 携带。
7. 如果带了 `--dry-run` 或 `--no-commit`，不做真实 git 写入，只打印手工兜底命令并返回失败。
8. 如果创建/推送阶段失败，删除本轮已经创建的本地 tags。
9. 如果后续 relizy 执行失败，且本轮 tags 未推送，则删除本轮本地 tags；如果 tags 已推送成功，则保守地不删除远端或本地 tags，只输出提示。

## 技术细节亮点

### 1. 为什么必须是 annotated tag？

`git push --follow-tags` 的行为决定了 tag 类型选择。它只会推送 annotated tags。这个项目的发版脚本是：

```bash
pnpm run release:sub && pnpm run release:root && pnpm run git:push
```

其中 `git:push` 是：

```bash
git push --follow-tags
```

所以 baseline tag 必须是 annotated tag，否则“release:sub 成功、本地有 tag、最终远端没 tag”的隐性故障仍然会发生。

### 2. 为什么 push 要加 `--atomic`？

如果一次创建 7 个 baseline tags，但 `git push origin <tags...>` 只成功了一部分，远端和本地会进入不一致状态。后续再删除本地 tag 也不能说明远端干净。

所以我把非 `--no-push` 分支改成：

```bash
git push --atomic origin "<tag...>"
```

它要么全部成功，要么全部失败，避免多包发版最怕的“半成功”。

### 3. 为什么 dry-run/no-commit 不创建 tag？

`--dry-run` 和 `--no-commit` 的语义都是“不要产生真实发布写入”。如果 runner 在这些模式下偷偷创建 tag，会让预览命令变成有副作用命令。

所以我的策略是：发现缺失 baseline tag 时直接返回 1，并打印可以人工执行的 annotated tag 命令。这保留了诊断价值，但不破坏用户对 dry-run 的预期。

### 4. 为什么 relizy 后续失败要回滚本地 tags？

这个能力不是只为了让前置检查通过，而是为了保证发布命令失败时工作区不被污染。

在 `--no-push` 场景下，baseline tags 只存在本地。如果 relizy 后续因为 dirty status、入口缺失或其他原因失败，这些本地 tags 应该删除，避免下次运行误以为 baseline 已经被正确准备。

## 验证证据

### 单测

针对 `relizy-runner` 增加/更新了 43 个测试，覆盖：

- tag 名生成
- 缺失 tag 过滤
- annotated tag 创建
- `--no-push` 本地保留
- `--dry-run` / `--no-commit` 禁止写 tag
- 创建 tag 失败回滚
- push 失败回滚
- relizy 后续失败回滚本地 tags
- tags 已成功推送后 relizy 失败不误删远端/本地 tags

验证命令结果：

```log
pnpm exec vitest run --config vitest.relizy-runner.config.ts
Test Files  1 passed (1)
Tests       43 passed (43)
```

补充说明：仓库现有 `vitest.workspace.ts` 存在项目名重复问题，直接指定测试文件会在 Vitest 启动阶段失败。因此本次用临时 `test.projects` 配置隔离目标测试，验证后删除临时配置，不把临时文件留进最终改动。

### 类型检查与构建

```log
pnpm --filter @ruan-cat/utils exec tsc --noEmit -p tsconfig.json
通过

pnpm --filter @ruan-cat/utils build
通过
```

### 真实项目临时 patch 验证

在 `gzpc-big-screen` 内用 pnpm patch 注入本地构建后的 `@ruan-cat/utils`，不直接修改业务源码。验证期间跑：

```bash
pnpm run release:sub
```

第一次在 dirty workspace 下验证失败回滚：

```log
[release:relizy] 已创建本地 annotated 基线 tags：@gzpc/phase1-amap@0.2.2, ...
[release:relizy] 检测到 --no-push，本地 tags 暂不推送；后续执行 git push --follow-tags 会携带这些 annotated tags。
...
Git status is dirty!
Deleted tag '@gzpc/shared-theme@0.1.0'
Deleted tag '@gzpc/shared-config@0.1.0'
...
[release:relizy] 已删除本轮未推送的本地 bootstrap tags；远端 tag 未做任何删除。
```

第二次临时 stash 掉验证 patch 元数据和用户未提交文档，让 git 状态干净，但保留 patched node_modules，验证成功路径：

```log
[release:relizy] 已创建本地 annotated 基线 tags：@gzpc/phase1-amap@0.2.2, ...
[release:relizy] 基线 tag 检查通过。
[release:relizy] relizy 执行完毕。
```

随后用：

```bash
git cat-file -t "@gzpc/phase1-amap@0.2.2"
```

确认 tag 类型为：

```log
tag
```

这说明创建的是 annotated tag，不是 lightweight tag。

验证后删除本轮 7 个 `@gzpc/*` tags，恢复 stash，删除临时 patch 文件，重新 `pnpm install`，最终 `gzpc-big-screen` 工作区只剩用户原本的 `docs/prompts/01.md` 改动。

## 面试时的 STAR 讲法

### Situation

我维护一个基于 pnpm workspace 的前端 monorepo，里面有多个 independent version 子包。发布链路用 `relizy` 做子包版本管理，用 `bumpp` 管根版本，最后统一 `git push --follow-tags`。

### Task

目标不是手工补一次 tag，而是让团队以后首次接入 independent 模式时，发版命令能自己准备 baseline tags，并且不破坏 dry-run、不污染本地 tags、不影响最终 CI/GitHub workflow。

### Action

我做了四件事：

1. 阅读 release 脚本和 `relizy` 行为，确认根因是 independent 首次发版缺少 baseline bootstrap。
2. 在 `@ruan-cat/utils` 的 `relizy-runner` 中加入 bootstrap tag 准备能力。
3. 使用 annotated tags 和 `git push --atomic`，匹配 `git push --follow-tags` 的真实发布链路。
4. 用单测和真实项目 pnpm patch 双重验证，并在验证后清理所有 tags、patch 和依赖树。

### Result

最终效果是：

- `release:sub` 能自动创建缺失 baseline tags。
- `--no-push` 能保留本地 annotated tags，后续统一 push 能携带。
- dry-run/no-commit 不产生真实写入。
- 失败路径能回滚本轮本地 tags。
- 这个能力沉淀在 `@ruan-cat/utils`，不是只服务一个项目的一次性脚本。

## 简历里可以怎么写

可以加到 `@ruan-cat/utils` 或 `@ruan-cat/* 系列 npm 包` 下面：

1. 针对 `relizy` 在 monorepo independent 首次发版时缺少 baseline tag 导致 release 阻断的问题，增强自研 `relizy-runner` CLI，在 release/bump 前自动识别缺失子包 baseline tags，并按当前 package 版本创建 annotated tags，兼容 `--no-push`、`--dry-run`、`--no-commit` 等发布参数。
2. 基于 `git push --follow-tags` 只推送 annotated tags 的机制，避免使用 lightweight tags 造成“本地成功、远端缺失”的隐性发布故障；同时使用 `git push --atomic` 避免多 tag 推送半成功。
3. 使用 Vitest 为发版工具补齐 40+ 个单测，并通过 pnpm patch 在真实业务 monorepo 内验证 release:sub 链路，完成创建、失败回滚、annotated tag 类型校验和临时补丁清理闭环。

## 面试官可能追问与回答

### Q1：为什么不直接给 relizy 提 PR？

可以回答：

我之前已经给 `relizy` 提过 Windows 路径相关 PR，也知道上游修复更理想。但这次问题直接阻断了我自己的项目发版，而且上游版本节奏不可控。我选择先在自建 runner 层做兼容兜底，同时保留文档说明：这是历史兼容层，如果未来 relizy 完整支持 first-release bootstrap，就可以逐步下线这段逻辑。

重点是：生产问题先闭环，再推动上游，不把项目交付绑在外部维护节奏上。

### Q2：你怎么证明没有污染业务项目？

可以回答：

我没有直接改 `gzpc-big-screen` 源码，而是用 pnpm patch 临时替换依赖包产物。验证前记录 HEAD、git status 和 tags；验证后删除所有 `@gzpc/*` tags，删除 patch 文件，恢复 pnpm lock/workspace 元数据，重新 `pnpm install`。最后 git status 只剩用户验证前已经存在的 `docs/prompts/01.md` 改动。

### Q3：为什么不在项目里写一个 scripts/bootstrap-tags.ts？

可以回答：

因为这不是 `gzpc-big-screen` 独有问题，而是所有使用 `relizy + independent + first release` 的 monorepo 都可能遇到的问题。放进 `@ruan-cat/utils` 的 runner 层能复用到多个项目，也能和发版参数解析、Windows GNU 工具兜底、`--yes` 注入保持在同一个发布入口内。

### Q4：这个方案有什么边界？

可以回答：

边界主要有两个：

1. 如果 tags 已经推送到远端，后续 relizy 再失败，我不会自动删除远端 tags。远端 tag 是共享状态，自动删除风险比保守提示更高。
2. 如果上游 relizy 未来完整支持 first-release bootstrap，这个 runner 逻辑应该作为兼容层逐步收敛，而不是永久抢上游职责。

## 可拔高的能力表达

这个案例能体现四类能力：

1. **工程化抽象能力**：不是修一个项目，而是把故障沉淀为通用 CLI 能力。
2. **发布链路理解能力**：理解 annotated tag、`--follow-tags`、atomic push、多包 release 的真实影响。
3. **风险控制能力**：对 dry-run、no-commit、no-push、失败回滚、远端状态都做了明确边界。
4. **验证闭环能力**：单测、类型检查、构建、真实项目 patch 验证、tag 类型检查和清理复核都有证据。

## 面试时可以这样收尾

我想展示的不是“我会写一个脚本补 git tag”，而是我能把发布链路里的隐性假设拆出来：tag 类型、push 方式、失败回滚、CI 触发、真实业务项目验证。这个问题看起来很小，但它卡在版本发布链路上，一旦处理粗糙，就会导致远端 tag 不完整、CI 不触发、下次发版状态错乱。所以我把它做成了一个有单测、有文档、有真实验证的工程化能力。
