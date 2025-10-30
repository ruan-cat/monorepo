# @ruan-cat/release-toolkit 更新日志

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

### Patch Changes

- Updated dependencies [[`a0004e3`](https://github.com/ruan-cat/monorepo/commit/a0004e395be907502350efbe335f81d10ac299b9)]:
  - @ruan-cat/commitlint-config@3.3.0

## 0.1.7

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/commitlint-config@3.2.2

## 0.1.6

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/commitlint-config@3.2.1

## 0.1.5

### Patch Changes

- Updated dependencies [[`bdf7ee0`](https://github.com/ruan-cat/monorepo/commit/bdf7ee01a7ecbee3a7a5a1681f7ae3049e07d242)]:
  - @ruan-cat/commitlint-config@3.2.0

## 0.1.4

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/commitlint-config@3.1.1

## 0.1.3

### Patch Changes

- Updated dependencies [[`ac7ed5d`](https://github.com/ruan-cat/monorepo/commit/ac7ed5d52bd15aff0b786b44b93f90e68680edcb)]:
  - @ruan-cat/commitlint-config@3.0.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`57f3122`](https://github.com/ruan-cat/monorepo/commit/57f3122daacfe70572ecefdcebe524c147055270), [`3bfeae6`](https://github.com/ruan-cat/monorepo/commit/3bfeae6693f5441811b1240d351cc4c23c8735e7)]:
  - @ruan-cat/commitlint-config@2.0.0

## 0.1.1

### Patch Changes

- 初始化 @ruan-cat/release-toolkit 包。 ([e9a977f](https://github.com/ruan-cat/monorepo/commit/e9a977fdeb0fad5d97fd49207471d7613ebff269))

## 0.1.0

### Minor Changes

- 🎉 **init**: 首次发布 @ruan-cat/release-toolkit - 基于 changelogen 增强 changesets 工作流的发布工具包
  - ✨ 实现自定义 changesets 插件支持语义化提交解析
  - 🔄 提供 GitHub Release 自动同步功能
  - ⚙️ 集成 @ruan-cat/commitlint-config 的 emoji + conventional commits 配置
  - 📝 完整的 TypeScript 类型支持
  - 🚀 开箱即用的预配置方案
