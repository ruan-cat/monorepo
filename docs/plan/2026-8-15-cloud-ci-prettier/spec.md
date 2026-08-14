# PR 云端 Prettier 精准格式化工作流规范

## 1. 背景

仓库本地开发链路已经通过 Prettier、lint-staged、simple-git-hooks 与 VS Code 扩展形成格式化闭环，但纯 GitHub origin 云分支上的修改不会经过本地工作树，因此在进入 `dev` 前仍需要一条云端格式化链路。

第一版 workflow 已证明 PR 自动格式化、提交和写回可行，但采用“全仓执行 `pnpm format`，再 restore PR 范围外副作用”的方式。随着仓库规模扩大，这会扫描大量与当前 PR 无关的文件，也会先制造再清理工作树副作用。

v2 将算法收敛为：先精确计算 PR 的可格式化文件，再把这些具体路径直接传给 Prettier，只暂存这些候选文件的实际格式化差异。

## 2. 现有工程约束

本方案继续复用仓库已有格式化配置真源：

- `prettier.config.mjs` 是唯一生效的 Prettier 配置。
- `prettier-plugin-lint-md` 由现有配置加载，不在 workflow 中复制插件配置。
- `endOfLine` 等格式规则继续来自项目配置。
- `.config/.prettierignore` 与 `.gitignore` 继续决定忽略范围。
- 当前 `.config/.prettierignore` 明确忽略 `**/*.json`，因此 JSON 虽属于候选扩展名，但仍会被生产 ignore 规则排除。
- 根 `package.json` 的 `format` script 定义了生产格式化的扩展名范围、`snippets` 排除范围、`--experimental-cli`、`--no-parallel` 与两个 ignore path。
- 本地提交继续由 lint-staged 与 simple-git-hooks 管理。

v2 不再执行全仓 `pnpm format`。workflow 只镜像根 `format` script 的“文件选择边界”和 CLI 稳定性参数，用项目本地 Prettier 对 PR 具体文件路径执行格式化；配置、parser、插件和 ignore 仍由仓库现有文件决定。

## 3. 目标

1. workflow 的唯一事件源是 Pull Request。
2. 仅处理目标分支为 `dev` 的 PR。
3. 只格式化当前 PR 的 Added、Copied、Modified、Renamed 后路径。
4. 只把根 `format` script 支持的扩展名、且不位于 `snippets` 路径段的文件传给 Prettier。
5. 不扫描整个仓库，也不依赖“格式化后 restore PR 外文件”来实现边界控制。
6. 只暂存精准候选文件，不使用无边界的 `git add --all`。
7. 若没有实际格式化差异，则成功结束，并跳过 commitlint workspace build、commit 与 push。
8. 若有差异，则准备 commitlint runtime，继续经过现有 lint-staged 与 commit-msg hooks 后写回 PR head。
9. fork PR 不获得自动写回能力。
10. 不向格式化任务暴露业务 secrets。

## 4. 非目标

本次不做以下事项：

- 不修改 Prettier 版本、插件版本或 `prettier.config.mjs`。
- 不修改 `.config/.prettierignore` 或 `.gitignore`。
- 不替换本地 lint-staged / VS Code / git hooks 流程。
- 不在 `push dev` 后补救格式化。
- 不扩张为 lint、typecheck、build 或 release 工作流。
- 不自动合并 PR。
- 不在 fork PR 上尝试写回。

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

该 workflow 不声明 `push`、`schedule` 或 `workflow_dispatch`。

## 6. Head checkout 契约

格式化提交必须写回真实 PR head，而不是 synthetic merge ref，因此显式 checkout：

- repository: `github.event.pull_request.head.repo.full_name`
- ref: `github.event.pull_request.head.ref`
- fetch-depth: `0`

## 7. PR 文件选择算法

### 7.1 计算 ACMR 集合

以：

```text
github.event.pull_request.base.sha...HEAD
```

执行：

```bash
git diff --name-only -z --diff-filter=ACMR <base>...HEAD
```

使用 NUL 分隔，避免空格等路径字符造成拆分错误。Deleted 文件不存在可格式化内容，因此不进入集合；Renamed 使用 rename 后路径。

### 7.2 筛选 Prettier 候选

候选扩展名与根 `format` script 保持一致：

```text
.js .jsx .ts .tsx .mts .json .css .scss .md .yml .yaml .html
```

任一路径段为 `snippets` 的文件被排除。

这层筛选只负责缩小扫描集合，不替代 Prettier ignore。候选文件仍必须继续经过：

```text
.config/.prettierignore
.gitignore
```

### 7.3 精准执行 Prettier

对候选路径执行项目本地 Prettier：

```bash
pnpm exec prettier \
  --experimental-cli \
  --write \
  --no-parallel \
  --ignore-path ./.config/.prettierignore \
  --ignore-path .gitignore \
  <PR candidate paths...>
```

具体文件路径以 `./` 前缀传入，并按约 100 KB 参数长度分块调用，避免超大 PR 触及系统 argv 长度限制。

workflow 不再运行全仓 glob，因此不会主动扫描与 PR 无关的历史文件。

## 8. 精准暂存契约

候选文件列表同时以 NUL 分隔写入 runner 临时文件。格式化后仅对该列表执行：

```bash
git --literal-pathspecs add --all \
  --pathspec-from-file="$FILE_LIST" \
  --pathspec-file-nul
```

随后使用 staged diff 判断是否存在真正需要提交的格式化变化。

该设计保证：

- 构建产物、安装副作用或其他未列入候选的工作树变化不会被暂存；
- 重命名、空格等特殊路径可以安全传递；
- 不需要再对 PR 外文件做 restore 收敛。

## 9. CI 提交校验运行时

根 commitlint 配置依赖 workspace `@ruan-cat/commitlint-config` 的构建产物，该包又依赖 `@ruan-cat/utils`。

v2 只在 staged diff 非空时执行：

```bash
pnpm --filter "@ruan-cat/commitlint-config..." build
```

因此 clean PR 不再承担这段 workspace build 成本。

## 10. 自动提交契约

当精准暂存后存在 staged diff：

1. 配置 `github-actions[bot]` identity。
2. 执行 `git diff --cached --check`。
3. 使用现有 hooks 创建 `style` 类型提交，不使用 `--no-verify`。
4. lint-staged 只看到已经精准暂存的候选文件。
5. 推送 `HEAD` 到 `github.event.pull_request.head.ref`。

自动提交标题：

```text
🌈 style: 自动格式化 PR #<number> 改动
```

## 11. 权限与安全边界

workflow 只声明：

```yaml
permissions:
  contents: write
```

写回 job 仅在以下条件为真时运行：

```text
github.event.pull_request.head.repo.full_name == github.repository
```

同仓库 origin PR 可以自动写回；fork PR 跳过该 job。workflow 不读取业务 secrets。

## 12. 并发与幂等

按 PR number 建立 concurrency group：

```text
cloud-pr-prettier-<PR number>
```

新事件取消同 PR 的旧运行，避免多个 runner 同时写同一 head branch。

幂等判断以精准 staged diff 为准。候选文件已经符合格式时：

- `changed=false`；
- commitlint workspace build skipped；
- commit skipped；
- push skipped。

## 13. 验收标准

### 13.1 Dirty 路径

加入一个未被 ignore 的明显脏格式 TypeScript 文件后：

- workflow 只枚举 PR ACMR 文件；
- 只向 Prettier 传递候选路径；
- staged diff 只包含真正被格式化的文件；
- commitlint runtime 构建成功；
- lint-staged、commit-msg、commit、push 成功；
- bot commit 不包含构建产物或其他副作用。

### 13.2 Clean 路径

PR 候选文件均已符合格式时：

- 精准格式化步骤成功；
- staged diff 为空；
- commitlint build、commit、push 全部 skipped；
- head 不因格式化产生新提交。

### 13.3 Ignore 契约

被 `.config/.prettierignore` 或 `.gitignore` 排除的候选文件必须继续被 Prettier 忽略。当前 `**/*.json` 不可作为生产正向格式化 fixture。

### 13.4 事件边界

- PR → `dev`：允许触发。
- 普通 push：workflow 没有 `push` trigger。
- fork PR：写回 job 条件跳过。

## 14. 云端实测记录

### 14.1 v1 基线

v1 已验证全仓 `pnpm format`、PR allowlist restore、hooks 与自动 push 的可行性，也暴露 commitlint workspace build 必须提前准备。该历史结果保留作为演进背景，但不再是最终算法。

### 14.2 v2 主 PR #123 clean 回归

主工作分支继续为：

```text
ci/cloud-pr-prettier-format
```

目标分支继续为 `dev`。

v2 workflow commit：

```text
5b1a451d9bf877b54c14a9a6b17840b36ad1dbc2
```

run `31841125291` 成功。日志确认：

- PR ACMR 文件数：3；
- Prettier 精准候选文件数：3；
- 候选正好是 workflow、plan、spec；
- 精准暂存后 staged diff 为空；
- commitlint workspace build skipped；
- commit skipped；
- push skipped。

这验证了 v2 clean 低开销路径。

### 14.3 v2 Dirty PR #126

临时 draft PR #126 仅用于 dirty 验收，目标为 `dev`，完成后关闭且未合并。

run `31841210430` 成功。日志确认：

- PR ACMR 文件数：4；
- Prettier 精准候选文件数：4；
- Prettier 实际修改 `docs/plan/2026-8-15-cloud-ci-prettier/test-fixtures/dirty.ts`；
- 精准暂存仅包含 `dirty.ts`；
- commitlint workspace build、lint-staged、commit-msg、commit、push 全部成功。

bot commit：

```text
eac5ac718b4443fa124ed8e8fe265632f83ee83e
```

GitHub commit diff 只有 `dirty.ts` 一个文件：

```diff
-export const cloudPrettierDirtyV2={cloud:"prettier-v2",nested:{value:2}}
+export const cloudPrettierDirtyV2 = { cloud: "prettier-v2", nested: { value: 2 } };
```

这验证了“候选范围可大于实际变化，但最终提交只包含真实格式化差异”的核心边界。

bot push 对应 run `31841276515` 没有 job，也没有产生第二个格式化提交。

## 15. 回滚

该能力仍由独立 workflow 提供。若出现异常，可单独 revert / 删除 `.github/workflows/cloud-pr-prettier.yml`，不会改变 Prettier 配置、package scripts、本地 hooks 或其他 CI。
