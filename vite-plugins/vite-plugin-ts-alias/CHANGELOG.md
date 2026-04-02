# @ruan-cat/vite-plugin-ts-alias

## 0.3.0

### Minor Changes

- 1. **全部子包已升级依赖**（工作区内各发布包同步刷新 `dependencies` / `devDependencies` 等声明，与当前 lockfile 对齐）。 ([`af5aa60`](https://github.com/ruan-cat/monorepo/commit/af5aa603fcdd2a5b8f5caa8b3f74bcb996500120))
  2. 根工作区同步升级 `packageManager`（pnpm）版本，便于团队统一工具链。

## 0.2.0

### Minor Changes

- 全面调整全部包的 files 构建输出配置，统一排除规则，避免错误发布冗余文件 ([`a0004e3`](https://github.com/ruan-cat/monorepo/commit/a0004e395be907502350efbe335f81d10ac299b9))

  ## 主要改进
  - 优化 `files` 字段配置，更精确地控制发布到 npm 的文件列表
  - 统一排除不必要的构建产物和缓存文件（如 `.vitepress/cache`、`.vitepress/dist` 等），统一排除掉 `.vitepress` 文件夹
  - 排除测试文件和文档文件（`**/tests/**`、`**/docs/**` 等）
  - 使用 `dist/**` 替代 `dist/*` 以确保包含所有构建输出子目录
  - 统一各包的文件排除规则格式

  这些改动仅影响 npm 包的发布内容，不影响包的功能和 API，减少了包的体积并提升了发布质量。

## 0.1.0

### Minor Changes

- 发包。 ([`4987efd`](https://github.com/ruan-cat/monorepo/commit/4987efd59063e0cd11b470ece8808b869b7492f9))
