# Baseline Package Tags 与 Runner Precheck

## 为什么 baseline tags 是通用问题

在 `independent` 模式下，relizy 依赖每个子包已有至少一条 `@scope/pkg@x.y.z` 形式的 git tag，才能判断本次的 bump 范围。任何首次接入或新增子包的 monorepo 都可能缺少这些 tag，**与操作系统无关**。

这意味着：哪怕目标仓库是纯 Linux CI、没有任何 Windows 问题，baseline tag 缺失仍然会让 relizy 静默跳过应被 bump 的包，或直接失败——而这种失败往往没有清晰的错误提示。

## `relizy-runner`（`@ruan-cat/utils`）是推荐的预检机制

**不要**在目标仓库维护本地 runner 副本。请使用 **`@ruan-cat/utils`** 自带的 **`relizy-runner`**（实现见 monorepo 内 `packages/utils/src/node-esm/scripts/relizy-runner/index.ts`，文档见同目录 `index.md`）。其核心行为包括：

- 在 `release` / `bump` 前判断是否需要做 independent 基线 tag 预检。
- 通过 **`getWorkspacePackages()`** 解析根目录 **`pnpm-workspace.yaml`**，按 `一级目录/*` 形式的 glob 展开并读取各子包 `package.json` 的 `name` / `version`，再对每个包检查是否已有 `@scope/pkg@*` 形式的 git tag；缺失则打印补打命令并退出，**不执行 relizy**。

因此：**`pnpm-workspace.yaml` 与 `relizy.config.ts` 的 `monorepo.packages` 必须一致**；若 workspace 使用本实现未覆盖的复杂 glob，须先对齐 relizy 与 runner 的包发现范围（必要时查阅 `index.md` 与上游实现），避免预检漏包。

## 非 `relizy-runner` 场景的处理方式

若因特殊原因确认不使用 `@ruan-cat/utils` 的 `relizy-runner`，则必须在接入前手工完成以下检查：

```bash
# 查询每个目标包是否已有 tag
git tag --list "@scope/pkg@*"
```

所有目标包都有至少一条匹配 tag 后，才能执行 `relizy release`。这个流程无法自动化，依赖人工记忆，出错概率更高。
