---
"@ruan-cat/vite-plugin-ts-alias": minor
"@ruan-cat/vuepress-preset-config": minor
"@ruan-cat/vitepress-preset-config": minor
"@ruan-cat/vercel-deploy-tool": minor
"@ruan-cat/utils": minor
"@ruan-cat/release-toolkit": minor
"@ruan-cat/generate-code-workspace": minor
"@ruan-cat/domains": minor
"@ruan-cat/claude-notifier": minor
"@ruan-cat/taze-config": minor
"@ruan-cat/commitlint-config": minor
---

全面调整全部包的 files 构建输出配置，统一排除规则，避免错误发布冗余文件

## 主要改进

- 优化 `files` 字段配置，更精确地控制发布到 npm 的文件列表
- 统一排除不必要的构建产物和缓存文件（如 `.vitepress/cache`、`.vitepress/dist` 等）
- 排除测试文件和文档文件（`**/tests/**`、`**/docs/**` 等）
- 使用 `dist/**` 替代 `dist/*` 以确保包含所有构建输出子目录
- 统一各包的文件排除规则格式

这些改动仅影响 npm 包的发布内容，不影响包的功能和 API，减少了包的体积并提升了发布质量。
