# PR 云端 Prettier 格式化工作流规范

## 1. 背景

仓库已经在本地开发链路中通过 Prettier、lint-staged、simple-git-hooks 与 VS Code 扩展形成完整格式化闭环，但纯 GitHub origin 云分支上的文件修改不会经过本地工作树，因此无法自然触发这些本地机制。

PR #117 与 PR #119 暴露了这一缺口：ChatGPT Web 等云端开发可以直接在远端分支完成大量新增和修改，而这些内容在进入 `dev` 前缺少一次与仓库本地 `pnpm format` 等价的统一格式化步骤。

本规范补充一条仅由 Pull Request 触发的 GitHub Actions 格式化链路，使同仓库 origin 云分支在合并到 `dev` 前自动获得 Prettier 处理。

## 2. 现有工程约束

本方案必须复用仓库已有格式化真源，不再建立第二套 Prettier 参数或配置：

- 根 `package.json` 的 `format` script 是格式化命令入口。
- `prettier.config.mjs` 是唯一生效的 Prettier 配置。
- `prettier-plugin-lint-md` 固定为 `1.0.1`，并由配置顶层字符串加载。
- `endOfLine` 固定为 `lf`。
- 本地提交继续由 `lint-staged.config.mjs` 与 `simple-git-hooks.mjs` 管理。

因此 GitHub workflow 不复制扩展名、插件或 parser 规则，而是调用 `pnpm format`。

## 3. 目标

1. 仅 Pull Request 可以触发该 workflow，不增加 `push`、`schedule` 或 `workflow_dispatch` 入口。
2. 仅处理目标分支为 `dev` 的 PR。
3. 对同仓库 origin 分支自动执行仓库根 `pnpm format`。
4. 只保留本 PR 原本 ACMR 文件集合中的格式化结果，禁止将仓库中与 PR 无关的历史格式差异带入当前 PR。
5. 若格式化产生改动，则自动提交并推送回 PR head branch。
6. 若没有格式化差异，则成功结束，不制造空提交。
7. 自动提交后再次执行时必须幂等：第二次格式化不得继续产生新的内容变化。
8. fork PR 不获得自动写回能力，避免依赖 fork 场景下不可写的 `GITHUB_TOKEN`。
9. 不向格式化任务暴露仓库业务 secrets。

## 4. 非目标

本次不做以下事项：

- 不修改 Prettier 版本、插件版本或 `prettier.config.mjs`。
- 不替换本地 lint-staged / VS Code / git hooks 流程。
- 不在 `push dev` 后补救格式化；格式化必须发生在 PR 合并前。
- 不把 workflow 扩张为 lint、typecheck、build 或 release 工作流。
- 不自动合并 PR。
- 不在 fork PR 上尝试向 fork 分支推送。

## 5. 触发契约

```yaml
on:
  pull_request:
    branches:
      - dev
    types:
      - opened
      - synchronize
      - reopened
      - ready_for_review
```

该 workflow 不声明任何其他事件。

## 6. Head checkout 契约

`pull_request` 默认 checkout 的是 PR merge ref。格式化工作流需要把提交写回真实 head branch，因此必须显式 checkout：

- repository: `github.event.pull_request.head.repo.full_name`
- ref: `github.event.pull_request.head.ref`
- fetch-depth: `0`

禁止在 synthetic merge commit 上创建格式化提交。

## 7. PR 文件边界算法

### 7.1 输入集合

在运行 `pnpm format` 前，以：

```text
github.event.pull_request.base.sha...HEAD
```

计算 `--diff-filter=ACMR` 文件集合。

只记录 Added、Copied、Modified、Renamed 后的新路径；Deleted 文件不可能再被 Prettier 写入，因此不进入集合。

### 7.2 执行格式化

调用根项目唯一格式化入口：

```bash
pnpm format
```

这一步允许 Prettier 扫描其既有 glob 范围，确保 GitHub Actions 与本地开发共享同一命令真源。

### 7.3 副作用收敛

`pnpm format` 可能发现当前 PR 之外的历史未格式化文件。workflow 必须比较格式化后的 working tree：

- 若文件属于 PR ACMR 集合：保留格式化结果。
- 若文件不属于 PR ACMR 集合：执行 `git restore --source=HEAD --worktree -- <path>`。

因此最终提交只能包含“PR 原本修改文件的格式化差异”。

## 8. 自动提交契约

当副作用收敛后仍有 diff：

1. 配置 `github-actions[bot]` identity。
2. `git add --all`。
3. 使用仓库 Conventional Commit 规则创建 `style` 类型提交。
4. 允许现有 simple-git-hooks 继续执行 `lint-staged` 与 `commitlint`，不使用 `--no-verify` 绕过本地工程约束。
5. 将 `HEAD` 推送回 `github.event.pull_request.head.ref`。

建议自动提交标题：

```text
🌈 style: 自动格式化 PR #<number> 改动
```

`style` / `🌈` 来自仓库 `configs-package/commitlint-config/src/commit-types.ts`。

## 9. 权限与安全边界

workflow 只需要：

```yaml
permissions:
  contents: write
```

不配置其他写权限，也不读取业务 secrets。

写回 job 仅在：

```text
github.event.pull_request.head.repo.full_name == github.repository
```

时运行。

这是明确的信任边界：同仓库 origin 分支可自动格式化和写回；fork PR 保持只读/跳过。

## 10. 并发与幂等

按 PR number 建立 concurrency group：

```text
cloud-pr-prettier-<PR number>
```

新事件取消同 PR 的旧运行，避免连续 synchronize 时出现两个 runner 同时向同一 head branch 推送。

格式化提交本身必须是幂等结果；后续重新运行若 `git diff --quiet`，不得再次提交。

## 11. 验收标准

### 11.1 正向格式化

临时 PR 加入明显不符合 Prettier 的 JSON/Markdown/TypeScript 文件后：

- workflow 被 PR 事件触发；
- `pnpm format` 执行成功；
- 自动产生 `🌈 style:` 提交；
- PR head 文件变为仓库规范格式；
- 与 PR 无关文件没有进入提交。

### 11.2 无可变更内容

临时 PR 只包含已经格式化的文件或 Prettier 忽略文件：

- workflow 成功；
- `git diff --quiet` 为真；
- 不产生自动提交。

### 11.3 事件边界

- PR → `dev`：允许触发。
- 普通 push：不触发该 workflow。
- fork PR：不执行写回 job。

## 12. 回滚

该能力是独立 workflow。若出现异常，可以单独 revert / 删除 `.github/workflows/cloud-pr-prettier.yml`，不会改变 Prettier 配置、package scripts、本地 hooks 或其他 CI 的行为。
