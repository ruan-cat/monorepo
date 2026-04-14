# 配置文件角色与插槽

## `changelog.config.ts`

- 承载 changelogen 的 `types`、`templates` 等与 commit 解析相关的配置。
- 通过 `@ruan-cat/commitlint-config` 的 `changelogogenUseTypes` 复用类型常量。
- 被 `relizy.config.ts` 和 `changelogithub.config.ts` 共同引用，是类型定义的**单一来源**。

## `relizy.config.ts`

- 使用 `defineConfig`；`types` 等从 `changelog.config` 引用。
- `monorepo.packages`：通过 `readWorkspacePackageGlobs()` 自动从 `pnpm-workspace.yaml` 读取，**无需手动维护包列表**。
- **`release`**：技能要求接入时写入默认 `release` 块（`changelog` / `commit` / `push` / `gitTag` / `clean` / `noVerify` / `publish` / `providerRelease` / `social` / `prComment`），便于与 `relizy-runner` 及显式「不 publish / 不 provider release」的发版习惯对齐。
- `changelog.formatCmd`：指向 `pnpm run format:changelog`。
- 保持文件**简短**；冗长类型与兼容逻辑放在 changelog 侧或独立模块。

## `bump.config.ts`

- 使用 bumpp 的 `defineConfig`。
- `push: false`：不单独推送，由 `git:push` 统一 push。
- `tag: "v%s"`：根包使用 `v*` 格式 tag，与 relizy 的 `@scope/pkg@version` 区分。
- `execute`：使用函数调用 `changelogen --output CHANGELOG.md -r <newVersion>`，bump 后自动生成根包 CHANGELOG section。
- `commit: "📢 publish(root): release v%s"`：使用 `publish(root)` scope 与子包的 `publish` 区分。
- `all: true`：将暂存区的全部文件都提交。

## `changelogithub.config.ts`

- 复用 `changelog.config.ts` 的 `types`，过滤掉非 object 类型的 type 条目。
- `output: false`：不让 changelogithub 生成 CHANGELOG.md 文件（由 relizy 和 changelogen 各自负责）。
- `capitalize: false`：不将 commit message 首字母大写。

## `.github/workflows/release.yaml`

- 检测 tag 推送后自动从 `CHANGELOG.md` 提取内容创建 GitHub Release。
- 支持两种 tag 格式：`v*`（根包）和 `@scope/pkg@version`（子包）。
- 使用 `gh release create`（而非 changelogithub / relizy provider-release），避免 scoped tag 中 `@` 导致的歧义。
- 幂等检查：release 已存在则跳过。

## 根 `package.json`

- `scripts`：完整发版命令集（详见 [`templates/package-scripts.md`](../templates/package-scripts.md)）。
- 脚本指向 `@ruan-cat/utils` 提供的 **`relizy-runner` bin**，不自建 runner 脚本。

## 根 `tsconfig.json`（可选）

- 仅在根目录配置文件需要被 tsc 检查且现网无合适 include 时添加。
- `include` 尽量窄，避免整仓类型检查。

## 导入优先级

1. 包根导出（`package.json` exports）。
2. 仅当包根无合适导出或类型不可用时，再考虑深路径。
3. 若根入口有副作用，记为风险，不默认退回深路径。
