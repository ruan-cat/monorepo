# 配置文件角色与插槽

## `changelog.config.ts`

- 承载 changelogen 的 `types`、`templates` 等与 commit 解析相关的配置。
- 通过包根导入复用类型与常量，避免重复定义。

## `relizy.config.ts`

- 使用 `defineConfig`；`types` 等通常从 `changelog.config` 引用。
- `monorepo.packages`：**必须与** `pnpm-workspace.yaml` 实际 workspace **一致**。
- **`release`**：技能要求接入时写入默认 `release` 块（`changelog` / `commit` / `push` / `gitTag` / `clean` / `noVerify` / `publish` / `providerRelease` / `social` / `prComment`），与 [`templates/config-writer.md`](../templates/config-writer.md) 中骨架一致，便于与 `relizy-runner` 及显式「不 publish / 不 provider release」的发版习惯对齐；若 relizy 版本字段有差异，以类型定义与上游文档为准并做等价调整。
- 保持文件**简短**；冗长类型与兼容逻辑放在 changelog 侧或独立模块。

## 根 `package.json`

- `scripts`：`release`、`changelog` 等入口与仓库一致。
- **推荐**：脚本指向 `@ruan-cat/utils` 提供的 **`relizy-runner` bin**（勿自建 `scripts/relizy-runner.ts`），并在 README 说明用途（Windows 兼容 + 基线 tag 预检）；权威用法见 `packages/utils/.../relizy-runner/index.md`。

## 根 `tsconfig.json`（可选）

- 仅在根目录配置文件需要被 tsc 检查且现网无合适 include 时添加。
- `include` 尽量窄，避免整仓类型检查。

## 导入优先级

1. 包根导出（`package.json` exports）。
2. 仅当包根无合适导出或类型不可用时，再考虑深路径。
3. 若根入口有副作用，记为风险，不默认退回深路径。
