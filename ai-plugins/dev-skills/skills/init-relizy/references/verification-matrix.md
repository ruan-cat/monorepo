# 验证矩阵

完成一次接入后，至少执行以下验证（路径与包管理器以目标仓库为准）。

## 基础（已接入 `relizy-runner`，推荐）

| 命令                                          | 期望                                 |
| --------------------------------------------- | ------------------------------------ |
| `pnpm exec relizy-runner --help`              | 正常输出                             |
| `pnpm exec relizy-runner changelog --dry-run` | 无配置错误；若无可写变更则输出可解释 |

## Release dry-run（推荐与根脚本同路径）

```bash
pnpm exec relizy-runner release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes
```

## 基础（未使用 `relizy-runner`、直连 relizy）

仅当已满足「无额外层」严格前提时使用：

| 命令                                   | 期望                                 |
| -------------------------------------- | ------------------------------------ |
| `pnpm exec relizy --help`              | 正常输出                             |
| `pnpm exec relizy changelog --dry-run` | 无配置错误；若无可写变更则输出可解释 |

```bash
pnpm exec relizy release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes
```

## 结果解读

- 若提示无可 bump 包且无配置/平台错误 → **接入验证通过**，当前无变更可发。
- 若报类型错误 → 查 `type-compatibility` 与 tsconfig。
- 若报 `grep`/`head`/`sed` → 查 `windows-compatibility`（应优先改用 `relizy-runner`）。

## 可选

| 项                        | 何时                       |
| ------------------------- | -------------------------- |
| 上游 `relizy-runner` 单测 | 贡献 `@ruan-cat/utils` 时  |
| 目标子包 `typecheck`      | 仓库有该脚本时             |
| baseline tag 检查         | `independent` 且首次接入时 |
