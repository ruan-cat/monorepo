# @ruan-cat/taze-config

## 0.3.0

### Minor Changes

- 全面调整全部包的 files 构建输出配置，统一排除规则，避免错误发布冗余文件 ([`a0004e3`](https://github.com/ruan-cat/monorepo/commit/a0004e395be907502350efbe335f81d10ac299b9))

  ## 主要改进
  - 优化 `files` 字段配置，更精确地控制发布到 npm 的文件列表
  - 统一排除不必要的构建产物和缓存文件（如 `.vitepress/cache`、`.vitepress/dist` 等），统一排除掉 `.vitepress` 文件夹
  - 排除测试文件和文档文件（`**/tests/**`、`**/docs/**` 等）
  - 使用 `dist/**` 替代 `dist/*` 以确保包含所有构建输出子目录
  - 统一各包的文件排除规则格式

  这些改动仅影响 npm 包的发布内容，不影响包的功能和 API，减少了包的体积并提升了发布质量。

## 0.2.0

### Minor Changes

- unplugin-\* 规则的依赖包，均升级到 latest 最新版。 ([`dd30b17`](https://github.com/ruan-cat/monorepo/commit/dd30b1753a797b99b5dce88a1bdabe7c47ee2c0d))

## 0.1.0

### Minor Changes

- 初始化 taze 包。 ([`815a34a`](https://github.com/ruan-cat/monorepo/commit/815a34af862307a79038f8b13a548edb1c08529a))
