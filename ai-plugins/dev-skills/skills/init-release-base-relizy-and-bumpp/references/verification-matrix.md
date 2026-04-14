# 验证矩阵

完成一次接入后，至少执行以下验证（路径与包管理器以目标仓库为准）。

## 阶段 0：遗留根包发版工具预检

```bash
pnpm why commit-and-tag-version
pnpm why conventional-changelog-cli
pnpm why standard-version
pnpm why release-it
```

若任一命令命中结果，说明仓库内仍保留旧的根包发版工具，须先删除或隔离（见 [`dependency-conflict-precheck.md`](dependency-conflict-precheck.md)）。

## 阶段 1：relizy 子包验证（使用 relizy-runner，推荐）

| 命令                                                | 期望                                 |
| --------------------------------------------------- | ------------------------------------ |
| `pnpm exec relizy-runner --help`                    | 正常输出                             |
| `pnpm exec relizy-runner changelog --dry-run --yes` | 无配置错误；若无可写变更则输出可解释 |

### Release dry-run

```bash
pnpm exec relizy-runner release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes
```

## 阶段 2：bumpp 根包验证

| 命令                                        | 期望                   |
| ------------------------------------------- | ---------------------- |
| `pnpm exec bumpp --help`                    | 正常输出               |
| `pnpm exec bumpp --dry-run --release patch` | 正常输出版本号变更预览 |

## 阶段 3：changelogen 验证

```bash
pnpm exec changelogen --output CHANGELOG.md -r 0.0.1
```

期望：正常更新根 `CHANGELOG.md`，并生成版本标题 `## v0.0.1`，而不是区间标题 `## v0.0.0...main`。

## 阶段 1 备选（未使用 relizy-runner、直连 relizy）

仅当已满足「无额外层」严格前提时使用：

| 命令                                   | 期望       |
| -------------------------------------- | ---------- |
| `pnpm exec relizy --help`              | 正常输出   |
| `pnpm exec relizy changelog --dry-run` | 无配置错误 |

```bash
pnpm exec relizy release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes
```

## 结果解读

- 若提示无可 bump 包且无配置/平台错误 → **接入验证通过**，当前无变更可发。
- 若报类型错误 → 查 `type-compatibility` 与 tsconfig。
- 若报 `grep`/`head`/`sed` → 查 `windows-compatibility`（应优先改用 `relizy-runner`）。
- 若发现仓库中仍保留旧的根包发版工具 → 查 `dependency-conflict-precheck`。

## 可选

| 项                            | 何时                            |
| ----------------------------- | ------------------------------- |
| 上游 `relizy-runner` 单测     | 贡献 `@ruan-cat/utils` 时       |
| 目标子包 `typecheck`          | 仓库有该脚本时                  |
| baseline tag 检查             | `independent` 且首次接入时      |
| GitHub Actions 工作流 dry-run | 推送 test tag 验证 release 创建 |
