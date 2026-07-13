# Baseline Package Tags 与 Runner Bootstrap

## 为什么 baseline tags 是通用问题

在 `independent` 模式下，relizy 依赖每个子包已有至少一条 `@scope/pkg@x.y.z` 形式的 git tag，才能判断本次的 bump 范围。任何首次接入或新增子包的 monorepo 都可能缺少这些 tag，**与操作系统无关**。

这意味着：哪怕目标仓库是纯 Linux CI、没有任何 Windows 问题，baseline tag 缺失仍然会让 relizy 静默跳过应被 bump 的包，或直接失败——而这种失败往往没有清晰的错误提示。

## `relizy-runner`（`@ruan-cat/utils`）是推荐的自动准备机制

**不要**在目标仓库维护本地 runner 副本。请使用 **`@ruan-cat/utils`** 自带的 **`relizy-runner`**。其核心行为包括：

- 在 `release` / `bump` 前判断是否需要准备 independent 基线 tag；`changelog` 不触发该流程。
- 解析根目录 **`pnpm-workspace.yaml`**，按 `一级目录/*` 形式的 glob 展开并读取各子包 `package.json` 的 `name` / `version`，再对每个包检查是否已有 `@scope/pkg@*` 形式的 git tag。
- 对没有任何历史 tag 的包，按当前 package.json 版本创建 annotated tag：`@scope/pkg@x.y.z`，message 为 `chore(release): bootstrap <tag>`。
- 带 `--no-push` 时只创建本地 annotated tags，后续串行主链路的 `git push --follow-tags` 会携带这些 tags。
- 不带 `--no-push` 时，runner 会使用 atomic push 推送本轮创建的 tags，避免远端出现半成功的 tag 集合。
- 带 `--dry-run` 或 `--no-commit` 时，runner 不写入任何 tag；若缺少基线 tag，会打印手工兜底命令并停止，不执行 relizy。
- 若创建或推送失败，runner 会尽力删除本轮尚未推送的本地 bootstrap tags；若 tags 已推送成功，后续 relizy 失败时不会自动删除远端或本地 tags。

因此：**`pnpm-workspace.yaml` 与 `relizy.config.ts` 的 `monorepo.packages` 必须一致**；若 workspace 使用本实现未覆盖的复杂 glob，须先对齐 relizy 与 runner 的包发现范围，避免自动准备漏包。

## dry-run 的特殊含义

`release --dry-run --no-commit` 是验证命令，不是 bootstrap 命令。首次接入时如果 dry-run 输出缺少 baseline tags，这是 runner 在保护禁写语义：它会告诉你缺哪些 tag，但不会自动创建。

处理方式二选一：

1. 执行真实 `release:sub --no-push`，让 runner 创建本地 annotated baseline tags，再由主链路末尾的 `git push --follow-tags` 推送。
2. 按 runner 打印的 `git tag -a ... -m ...` 与 `git push --atomic origin ...` 命令手工兜底。

## 非 `relizy-runner` 场景的处理方式

若因特殊原因确认不使用 `@ruan-cat/utils` 的 `relizy-runner`，则必须在接入前手工完成以下检查：

```bash
# 查询每个目标包是否已有 tag
git tag --list "@scope/pkg@*"
```

所有目标包都有至少一条匹配 tag 后，才能执行 `relizy release`。这个流程无法自动化，依赖人工记忆，出错概率更高。
