# @ruan-cat/claude-notifier

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

- 将默认图标更改为 Alice 版本 ([`4ab0797`](https://github.com/ruan-cat/monorepo/commit/4ab0797e04fe189b4b51b2d6e90ed391852a2885))

  **新功能**：
  - 添加了三个新的图标预设：`alice/success.gif`, `alice/error.gif`, `alice/timeout.gif`
  - 所有命令现在默认使用 Alice 风格的动态图标

  **具体变更**：
  - `task-complete` 命令：默认图标从 `success` 改为 `alice/success.gif`
  - `error` 命令：默认图标从 `error` 改为 `alice/error.gif`
  - `timeout` 命令：默认图标从 `error` 改为 `alice/timeout.gif`
  - `long-task` 命令：默认图标从 `clock` 改为 `alice/timeout.gif`

  **用户影响**：
  - 用户在不指定 `-i, --icon` 参数时，将自动使用 Alice 风格的动态 GIF 图标
  - 仍然支持通过 `-i` 参数指定其他预设图标或自定义图标路径
  - 旧的图标预设（success, warning, error, info, clock）仍然可用

### Patch Changes

- 修复云端环境中文档构建失败的问题 ([`590984f`](https://github.com/ruan-cat/monorepo/commit/590984f774e84b62869d81a42a95bb07e07092b4))

  在根包的 package.json 中添加 @ruan-cat/claude-notifier 作为 devDependencies，确保 turbo deploy-vercel 命令能够正确识别并执行该包的 build:docs 任务。

  **技术细节**：
  - Turbo 的 `^build:docs` 依赖解析基于 package.json 的依赖声明
  - 只有在根包中声明的工作区包才会被包含在根任务的依赖图中
  - 本次修复确保 GitHub Actions 工作流能够正确部署 claude-notifier 的文档站点

  **相关文档**：
  - 详细事故报告：docs/incident-reports/2025-10-28-claude-notifier-build-docs-failure.md

## 0.1.1

### Patch Changes

- 修复生产环境资源路径问题，并重构路径查找逻辑： ([`b3dbf75`](https://github.com/ruan-cat/monorepo/commit/b3dbf7563c3bed8e3a71892c1b39c810e5131ee8))
  - 修复：生产环境下无法找到 assets 内的图片和音频资源
  - 重构：提取公共的路径查找逻辑到 `src/config/utils.ts`
  - 新增：`findResourceDir()` 工具函数，统一处理开发环境和生产环境的路径差异
  - 优化：简化 `sounds.ts` 和 `icons.ts` 的代码，提升可维护性
  - 文档：更新 `architecture.md`，详细说明路径查找策略和技术背景

## 0.1.0

### Minor Changes

- 初始化本包。 ([`396eec8`](https://github.com/ruan-cat/monorepo/commit/396eec8b4a4634b116583d3ed784be05de0f7107))
  - 默认用小爱丽丝作为图标 icon。
  - 目前无法播出曼波的声音，自定义声音的功能疑似在 window10 系统内无法使用。
