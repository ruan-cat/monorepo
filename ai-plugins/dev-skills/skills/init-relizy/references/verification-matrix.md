# 验证矩阵

完成一次接入后，至少执行以下验证（路径与包管理器以目标仓库为准）。

## 基础

| 命令                                   | 期望                                 |
| -------------------------------------- | ------------------------------------ |
| `pnpm exec relizy --help`              | 正常输出                             |
| `pnpm exec relizy changelog --dry-run` | 无配置错误；若无可写变更则输出可解释 |

## Release dry-run

```bash
pnpm exec relizy release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes
```

- 若提示无可 bump 包且无配置/平台错误 → **接入验证通过**，当前无变更可发。
- 若报类型错误 → 查 `type-compatibility` 与 tsconfig。
- 若报 `grep`/`head`/`sed` → 查 `windows-compatibility`。

## 可选

| 项                   | 何时                       |
| -------------------- | -------------------------- |
| Runner 单测或 smoke  | 存在 runner 时             |
| 目标子包 `typecheck` | 仓库有该脚本时             |
| baseline tag 检查    | `independent` 且首次接入时 |
