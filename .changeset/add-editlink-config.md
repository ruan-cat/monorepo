---
"@ruan-cat/vitepress-preset-config": minor
---

为 VitePress 预设配置添加 editLink 编辑链接功能

- 在默认配置中添加 `themeConfig.editLink` 配置，支持在文档页面显示编辑链接
- 更新站点配置的 GitHub 链接从 main 分支切换到 dev 分支
- 新增配置指南文档 `please-reset-themeConfig-editLink.md`，说明如何正确配置 editLink.pattern
- 编辑链接支持使用 `:path` 占位符动态生成对应页面的 GitHub 源文件链接
