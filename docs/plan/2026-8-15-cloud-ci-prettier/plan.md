# PR 云端 Prettier 精准格式化落地计划

## 1. 交付范围

本计划对应 `spec.md`。最终长期保留 3 个文件：

- `.github/workflows/cloud-pr-prettier.yml`
- `docs/plan/2026-8-15-cloud-ci-prettier/spec.md`
- `docs/plan/2026-8-15-cloud-ci-prettier/plan.md`

主工作分支保持：

```text
ci/cloud-pr-prettier-format
```

主 PR 保持 #123，目标分支保持 `dev`。

不修改：

- `package.json` 的 `format` script
- `prettier.config.mjs`
- `.config/.prettierignore`
- `.gitignore`
- `lint-staged.config.js`
- `simple-git-hooks.mjs`
- Prettier / lint-md / simple-git-hooks 依赖版本

## 2. 方案演进

### Phase A：v1 基线验证

- [x] 建立仅面向 PR → `dev` 的 workflow。
- [x] 显式 checkout 真实 PR head branch。
- [x] 验证同仓库 `GITHUB_TOKEN` 可以创建格式化提交并写回 head。
- [x] 验证 fork head 通过 job 条件排除。
- [x] 验证 `contents: write` 足够完成写回。
- [x] 发现自动 commit 前必须准备 workspace commitlint runtime。
- [x] 通过 `pnpm --filter "@ruan-cat/commitlint-config..." build` 修复 commit-msg runtime。
- [x] 验证 JSON fixture 被 `.config/.prettierignore` 的 `**/*.json` 排除。
- [x] 使用 TypeScript fixture 完成真实 dirty 写回。
- [x] 使用 clean fixture 验证无差异时不产生空提交。

v1 的核心算法为“全仓 `pnpm format` → restore PR 范围外副作用”。该版本完成了能力验证，但不是最终性能方案。

### Phase B：识别 v2 优化目标

`dev` 后续提交 `da1a19a1704ee543730fc39df849568870ca84ee` 明确要求优化：

- 不再对整个 monorepo 执行格式化；
- 先提取 PR 实际修改文件；
- 只把这些路径传给 Prettier；
- 只有真实格式差异才提交。

据此将 #123 在原分支上继续迭代，不新建主 PR。

### Phase C：实现精准文件选择

- [x] 使用 `git diff --name-only -z --diff-filter=ACMR <base>...HEAD` 获取 PR post-image 路径。
- [x] 使用 NUL 分隔处理路径，避免空格等字符造成拆分错误。
- [x] 文件扩展名范围镜像根 `format` script：`.js`、`.jsx`、`.ts`、`.tsx`、`.mts`、`.json`、`.css`、`.scss`、`.md`、`.yml`、`.yaml`、`.html`。
- [x] 排除任一路径段为 `snippets` 的文件。
- [x] 保留 `.config/.prettierignore` 与 `.gitignore` 作为最终 ignore 真源。

### Phase D：只对候选路径运行 Prettier

- [x] 移除全仓 `pnpm format`。
- [x] 改为 `pnpm exec prettier`，仅追加具体 PR 候选路径。
- [x] 保留 `--experimental-cli`、`--write`、`--no-parallel`。
- [x] 保留两个 `--ignore-path`。
- [x] 对候选路径使用 `./` 前缀。
- [x] 按约 100 KB argv 长度分块执行，避免大型 PR 触发系统参数长度限制。

### Phase E：精准暂存

- [x] 将候选文件保存为 NUL 分隔临时列表。
- [x] 使用 `git --literal-pathspecs add --all --pathspec-from-file=... --pathspec-file-nul` 只暂存候选文件。
- [x] 移除提交前的无边界 `git add --all`。
- [x] 不再需要“PR 外副作用 restore”步骤。
- [x] 使用 staged diff 判断是否存在真实格式化变化。

### Phase F：降低 clean 路径成本

- [x] 将 `pnpm --filter "@ruan-cat/commitlint-config..." build` 移到 `changed == true` 条件之后。
- [x] clean PR 不再构建 `@ruan-cat/utils` 与 `@ruan-cat/commitlint-config`。
- [x] 有 staged diff 时仍继续执行完整 lint-staged + commit-msg hooks。
- [x] 不使用 `--no-verify`。

## 3. v2 云端验收

### 3.1 主 PR #123：clean 回归

workflow v2 实现 commit：

```text
5b1a451d9bf877b54c14a9a6b17840b36ad1dbc2
```

run：

```text
31841125291
```

验收：

- [x] checkout 成功。
- [x] monorepo setup 成功。
- [x] PR ACMR 文件数为 3。
- [x] Prettier 精准候选文件数为 3。
- [x] 候选仅为 workflow、plan、spec。
- [x] 精准格式化步骤成功。
- [x] 精准暂存后 staged diff 为空。
- [x] commitlint workspace build skipped。
- [x] commit skipped。
- [x] push skipped。

该结果证明 v2 clean 路径不会再为无差异 PR 执行额外 workspace build。

### 3.2 临时 Dirty PR #126：精准写回

旧测试 PR #124 因测试分支被 force-reset / recreated 后 GitHub 不允许 reopen，因此复用同一个测试分支并新建一次性 draft PR #126。它不是新的主 PR，测试完成后立即关闭且不合并。

测试分支：

```text
test/cloud-pr-prettier-format-dirty
```

fixture：

```text
docs/plan/2026-8-15-cloud-ci-prettier/test-fixtures/dirty.ts
```

输入：

```ts
export const cloudPrettierDirtyV2={cloud:"prettier-v2",nested:{value:2}}
```

首次 run：

```text
31841210430
```

验收：

- [x] run 成功。
- [x] PR ACMR 文件数为 4。
- [x] Prettier 精准候选文件数为 4。
- [x] Prettier 实际只改动 `dirty.ts`。
- [x] 精准暂存只包含 `dirty.ts`。
- [x] commitlint workspace build 成功。
- [x] lint-staged 成功。
- [x] commit-msg 成功。
- [x] 自动 commit 成功。
- [x] push 成功。

bot commit：

```text
eac5ac718b4443fa124ed8e8fe265632f83ee83e
```

GitHub commit diff 确认只有 1 个文件：

```text
docs/plan/2026-8-15-cloud-ci-prettier/test-fixtures/dirty.ts
```

格式化结果：

```ts
export const cloudPrettierDirtyV2 = { cloud: "prettier-v2", nested: { value: 2 } };
```

bot push 对应 run `31841276515` 没有 job，也没有产生第二个格式化提交。

PR #126 已关闭，未合并。

## 4. Workflow 最终验证矩阵

| 场景 | 最终状态 |
| --- | --- |
| PR → `dev`，同仓库 head，存在格式差异 | 已实测：精准格式化、精准 stage、hooks、commit、push 成功 |
| PR → `dev`，同仓库 head，无格式差异 | 已实测：build / commit / push 全部 skipped |
| PR 包含多个候选但只有一个真正变化 | 已实测：bot commit 只包含实际变化文件 |
| workspace commitlint 尚未构建 | v1 已实测失败；v2 仅在需要 commit 时按依赖链构建 |
| `.prettierignore` 排除 JSON | 已实测：尊重 ignore，不强制格式化 |
| PR 外历史脏文件 | v2 不再扫描，因此不再需要 restore |
| PR → `dev`，fork head | 设计：job 条件直接跳过 |
| 普通 push | 设计：workflow 不声明 `push` trigger |
| 连续 synchronize | 设计：PR number concurrency 取消旧运行 |

## 5. 故障处理

### Prettier 失败

精准候选中的某个文件导致 Prettier 返回非零状态时，workflow 失败，不构建提交运行时、不提交、不推送。优先根据 Prettier 日志修复候选文件或项目配置。

### commitlint runtime 缺失

正式 workflow 在 staged diff 非空时执行：

```bash
pnpm --filter "@ruan-cat/commitlint-config..." build
```

该命令准备目标包及其 workspace 依赖。不要使用 `--no-verify` 绕过 hooks。

### 候选范围异常

依次检查：

1. `git diff --diff-filter=ACMR <base>...HEAD` 是否包含该路径；
2. 文件扩展名是否属于根 `format` script 的生产范围；
3. 路径中是否存在 `snippets` 段；
4. `.config/.prettierignore` 或 `.gitignore` 是否排除该文件。

### 非候选文件被工作步骤修改

它不会被精准 stage。自动提交只从候选 NUL 列表暂存文件，不再依赖全仓 restore。

### push 被拒绝

优先检查：

1. PR 是否来自 fork；
2. branch protection 是否禁止 GitHub Actions 写入；
3. repository Actions 设置是否把 `GITHUB_TOKEN` 限制为只读。

不要通过额外业务 secrets 或扩大 token 权限绕过仓库策略。

## 6. 人工审核清单

主 PR #123 合并前由维护者确认：

- [ ] workflow 的唯一事件源只有 `pull_request`。
- [ ] base branch filter 是 `dev`。
- [ ] checkout 的是真实 PR head，不是 synthetic merge ref。
- [ ] `contents: write` 是唯一显式写权限。
- [ ] fork PR 不进入写回 job。
- [ ] workflow 不读取业务 secrets。
- [ ] 已移除全仓 `pnpm format`。
- [ ] Prettier 只接收 PR 精准候选路径。
- [ ] 候选扩展名和 `snippets` 边界与根 `format` script 一致。
- [ ] `.config/.prettierignore` 与 `.gitignore` 继续生效。
- [ ] staging 只使用候选 NUL 列表。
- [ ] clean 路径跳过 commitlint workspace build。
- [ ] dirty 路径继续经过 lint-staged + commitlint hooks。
- [ ] 临时 PR #126 已关闭且未合并。

## 7. 合并与清理

最终只合并主 PR #123 到 `dev`。

主工作分支：

```text
ci/cloud-pr-prettier-format
```

测试分支：

```text
test/cloud-pr-prettier-format-dirty
test/cloud-pr-prettier-format-clean
```

测试 PR 不应合并进 `dev`。测试 origin branches 可由维护者按仓库日常策略删除。
