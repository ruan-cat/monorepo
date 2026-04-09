# 验证矩阵

完成一次接入后，至少执行以下验证（路径与包管理器以目标仓库为准）。

## 阶段 0：依赖冲突预检

```bash
node --input-type=module -e "const m = await import('conventional-changelog-angular'); console.log('export type:', typeof m.default);"
```

| 输出                    | 含义                    | 处理                                                                                |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `export type: function` | angular@8.x，兼容       | 继续                                                                                |
| `export type: object`   | angular@6.x/7.x，不兼容 | 须先修复（见 [`dependency-conflict-precheck.md`](dependency-conflict-precheck.md)） |

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

## 阶段 3：conventional-changelog 验证

```bash
conventional-changelog -p angular -r 0 --dry-run
```

期望：正常输出 CHANGELOG 内容，无 `does not export a function` 错误。

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
- 若报 `does not export a function` → 查 `dependency-conflict-precheck`。

## 可选

| 项                            | 何时                            |
| ----------------------------- | ------------------------------- |
| 上游 `relizy-runner` 单测     | 贡献 `@ruan-cat/utils` 时       |
| 目标子包 `typecheck`          | 仓库有该脚本时                  |
| baseline tag 检查             | `independent` 且首次接入时      |
| GitHub Actions 工作流 dry-run | 推送 test tag 验证 release 创建 |
