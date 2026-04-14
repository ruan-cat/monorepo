<!-- 有价值的报告 不予删除 -->

# 2026-04-14 relizy canary initial independent release 测试报告

## 测试目标

验证 `relizy@1.3.0-canary.a8967ef.0` 在 Windows 下绕过 `packages/utils/src/node-esm/scripts/relizy-runner/index.ts` 兼容层时，是否已经可以在全新 pnpm monorepo 内完成 independent mode 的首发流程。

本次验收要求不是只看 `--dry-run`，而是同时覆盖：

1. `pnpm exec relizy changelog --dry-run`
2. `pnpm exec relizy release --dry-run`
3. `pnpm exec relizy release --no-publish --no-provider-release --no-push --yes`

真实 release 的成功标准是同时产出：

1. changelog markdown
2. 版本提交
3. package tags

## 测试拓扑

- 隔离 worktree：`D:\temp\codex-worktrees\monorepo-relizy-canary-test`
- 测试分支：`test/relizy-canary-initial-independent-release`
- sandbox 根目录：`.tmp/relizy-canary`
- 被测版本：`relizy@1.3.0-canary.a8967ef.0`
- monorepo 结构：
  - 根 `package.json`
  - `pnpm-workspace.yaml`
  - `packages/alpha`
  - `packages/beta`

两套 sandbox 使用同一份最小 git 历史：

1. `chore: init relizy canary sandbox`
2. `feat(alpha): add first independent release trigger`
3. `docs: add root note`

两套 sandbox 的唯一区别是执行环境：

1. sandbox A：正常 Windows PATH
2. sandbox B：裁剪 PATH，仅保留 `node`、`pnpm`、`git` 及 Windows 系统目录

## 夹具与执行脚本

- sandbox 脚手架：`scripts/relizy-canary/new-sandboxes.ps1`
- 矩阵执行器：`scripts/relizy-canary/run-matrix.ps1`
- 矩阵产物目录：`artifacts/relizy-canary`

为了把“没有远程仓库”这个无关变量排除掉，夹具最终增加了一个本地 bare remote：

- bare remote：`.tmp/relizy-canary/origin.git`
- sandbox `origin` 指向本地 bare remote，而不是外网 GitHub URL

这样做的目的不是规避 relizy 的逻辑，而是避免它在 provider 推断阶段因为没有 `origin` 直接崩掉，确保测试真正走到 independent release 的首发判定逻辑。

## 执行过程

### 第一阶段：先排除 `origin` 缺失噪音

在最初一轮矩阵里，两套 sandbox 都先失败在同一个前置问题：

```log
error: No such remote 'origin'
Failed to generate/release ... Cannot read properties of undefined (reading 'provider')
```

这个失败说明当时还没有真正测到“Windows independent 首发”本体，只是先被 provider 推断拦住了。

因此脚手架补充了本地 bare `origin`，重新生成 sandbox 并重新跑矩阵。

### 第二阶段：补 `origin` 后的真实失败点

补完 `origin` 之后，`No such remote 'origin'` 与 `provider` 空引用不再出现。两套 sandbox 都继续向下执行，但统一失败在首发提交范围计算：

```log
fatal: ambiguous argument 'cee998d846cd223a729bcf9214dbf1b41d649ca1^...main': unknown revision or path not in the working tree.
Use '--' to separate paths from revisions, like this:
'git <command> [<revision>...] -- [<file>...]'
```

对应的 relizy / changelogen 调用栈都指向同一条链路：

```log
getGitDiff
getPackageCommits
getPackages
bumpIndependentMode
```

这里的 `cee998d846cd223a729bcf9214dbf1b41d649ca1` 是 sandbox 的初始提交。问题点不在分支缺失，因为 sandbox 当前分支就是 `main`，而且 `origin/main` 也存在。真正的问题是 relizy 仍然去取初始提交的父提交范围，即 `initialCommit^...main`。对首个提交来说，`^` 不存在，于是整条首发链路终止。

## 环境留痕

### sandbox A

- `where bash`：可见
- `where sh`：可见
- `where sed`：不可见
- `where grep`：不可见
- `relizy --help`：通过
- `changelog --dry-run`：失败
- `release --dry-run`：失败
- 真实 `release`：失败

### sandbox B

- `where bash`：不可见
- `where sh`：不可见
- `where sed`：不可见
- `where grep`：不可见
- `relizy --help`：通过
- `changelog --dry-run`：失败
- `release --dry-run`：失败
- 真实 `release`：失败

这说明在本次测试路径里，sandbox B 已经成功排除了外部 GNU 工具兜底，但 relizy 仍然能走到和 sandbox A 相同的后续失败点。

## 结果核验

矩阵执行完成后，两套 sandbox 的产物一致：

1. 根目录 `CHANGELOG.md` 未生成
2. `git tag --list` 为空
3. `packages/alpha/package.json` 版本仍为 `0.0.0`
4. `packages/beta/package.json` 版本仍为 `0.0.0`
5. 没有新的 release commit

关键日志证据位于：

- `artifacts/relizy-canary/summary.txt`
- `artifacts/relizy-canary/sandbox-a/15-relizy-release-real.stderr.log`
- `artifacts/relizy-canary/sandbox-b/15-relizy-release-real.stderr.log`
- `artifacts/relizy-canary/sandbox-b/08-where-bash.meta.txt`
- `artifacts/relizy-canary/sandbox-b/10-where-sed.meta.txt`
- `artifacts/relizy-canary/sandbox-b/11-where-grep.meta.txt`

## 结论

`relizy@1.3.0-canary.a8967ef.0` 在本次“全新 monorepo + independent 首发 + Windows”测试里，没有完成 end-to-end 成功。

可以确认的结论有两层：

1. 当前阻塞点已经不是最初的 `origin` 缺失问题；该噪音在本地 bare remote 夹具下已被排除。
2. sandbox B 在没有 `bash`、`sh`、`sed`、`grep` 可见的情况下，仍然和 sandbox A 失败在同一个首发提交范围错误上。

因此，本次测试更接近下面这个判断：

1. canary 至少已经能在本测试路径里越过一部分 Windows GNU 工具依赖门槛
2. 但它仍然不能完成全新仓库的 independent 首发 release

## 对 `init-release-base-relizy-and-bumpp` skill 的影响

基于这次测试，当前还不能把 `packages/utils/src/node-esm/scripts/relizy-runner/index.ts` 兼容层整体判定为“已经过时”。

更准确的影响边界是：

1. 不能因为 PR #58 已合并就直接删除 skill 中的首发防护或 runner 兼容层说明。
2. 不能宣称 `relizy@1.3.0-canary.a8967ef.0` 已经足以在 Windows 全新 monorepo 中独立完成 initial independent release。
3. 如果后续要下调 runner 的必要性，需要先等 upstream 修掉这次复现到的 `initialCommit^...main` 范围错误，并重新跑完同一套矩阵。

保守结论是：在“brand-new independent first release”这个最关键场景里，现阶段仍然不应把 skill 的旧保护措施全部移除。
