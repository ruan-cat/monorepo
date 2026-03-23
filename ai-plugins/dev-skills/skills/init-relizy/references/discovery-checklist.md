# 落盘前必须收集的信号

## 工作区与包图

- `pnpm-workspace.yaml`（或等价）中的 **全部 glob**。
- 每个匹配目录下 `package.json` 的 `name`、`private`、版本字段现状。
- 是否存在 `apps/*`、`packages/*`、`configs/*` 等多层级混排；**禁止**假设只有 `packages/*`。

## 工具链

- 现有 `changelog.config.*`、`relizy.config.*`。
- 是否已有 changesets、standard-version、release-it 等；若存在，评估是否迁移或并存（避免粗暴覆盖）。

## 版本与 tag

- 远程与本地是否已有 `@scope/pkg@x.y.z` 形式 tags。
- 在 `independent` 模式下，每个目标包是否具备可解释的 baseline tag。

## 可见性

- 哪些包为 `private: true`，哪些需要纳入发版。

## 环境

- 开发机 OS、CI 环境；Windows 下是否已暴露 `grep` / `head` / `sed` 依赖问题。

## 文档边界

- 根 README 与根 `CHANGELOG.md` 的现状。
- `formatCmd` 的实际命令是否会触及 `README.md`。
