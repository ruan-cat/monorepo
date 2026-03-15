# @ruan-cat/release-toolkit 更新日志

## 0.2.16

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/commitlint-config@4.9.4

## 0.2.15

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/commitlint-config@4.9.3

## 0.2.14

### Patch Changes

- Updated dependencies [[`23570fa`](https://github.com/ruan-cat/monorepo/commit/23570fa553b310b9d7b50c1240f19186765a37c4)]:
  - @ruan-cat/commitlint-config@4.9.2

## 0.2.13

### Patch Changes

- Updated dependencies [[`7a492e8`](https://github.com/ruan-cat/monorepo/commit/7a492e855342e564ad6f6c20a4ab8bbf5b7b1d0c)]:
  - @ruan-cat/commitlint-config@4.9.1

## 0.2.12

### Patch Changes

- Updated dependencies [[`6aef058`](https://github.com/ruan-cat/monorepo/commit/6aef058722e61024833e0cabdf85b7b02a047241)]:
  - @ruan-cat/commitlint-config@4.9.0

## 0.2.11

### Patch Changes

- Updated dependencies [[`4ab6b57`](https://github.com/ruan-cat/monorepo/commit/4ab6b5714614eab4e33ca1640bfb92003c5c0285)]:
  - @ruan-cat/commitlint-config@4.8.0

## 0.2.10

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/commitlint-config@4.7.1

## 0.2.9

### Patch Changes

- Updated dependencies [[`cae58ce`](https://github.com/ruan-cat/monorepo/commit/cae58ce56de4b10332ce0c64a0ada7daf8f5cc93)]:
  - @ruan-cat/commitlint-config@4.7.0

## 0.2.8

### Patch Changes

- Updated dependencies [[`a4c91b7`](https://github.com/ruan-cat/monorepo/commit/a4c91b7d3190634e87b5d584349f5b2b5f120fca)]:
  - @ruan-cat/commitlint-config@4.6.0

## 0.2.7

### Patch Changes

- Updated dependencies [[`ee135ad`](https://github.com/ruan-cat/monorepo/commit/ee135adccc5a83d5845db8b7f576e3b91b59869d)]:
  - @ruan-cat/commitlint-config@4.5.1

## 0.2.6

### Patch Changes

- Updated dependencies [[`787361f`](https://github.com/ruan-cat/monorepo/commit/787361f4596fb3d391f420299c3cd3ae831c2dbd)]:
  - @ruan-cat/commitlint-config@4.5.0

## 0.2.5

### Patch Changes

- Updated dependencies [[`0d708cc`](https://github.com/ruan-cat/monorepo/commit/0d708cc9971d63f330efef2998d9fbf6768260d3)]:
  - @ruan-cat/commitlint-config@4.4.0

## 0.2.4

### Patch Changes

- Updated dependencies [[`ac9c8e6`](https://github.com/ruan-cat/monorepo/commit/ac9c8e697ed28cf28c7da5af9aeb358335b91e11)]:
  - @ruan-cat/commitlint-config@4.3.0

## 0.2.3

### Patch Changes

- Updated dependencies [[`093abe7`](https://github.com/ruan-cat/monorepo/commit/093abe7cd2e13038e61417c00defb58fc758788a)]:
  - @ruan-cat/commitlint-config@4.2.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`431e30c`](https://github.com/ruan-cat/monorepo/commit/431e30c66ac7872cdca213b41c9faf13446c3fa3)]:
  - @ruan-cat/commitlint-config@4.1.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`b6cf2ef`](https://github.com/ruan-cat/monorepo/commit/b6cf2efd8f96e6e61ef113d2b13e98b26765b412)]:
  - @ruan-cat/commitlint-config@4.0.0

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
