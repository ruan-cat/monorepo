---
"@ruan-cat/vitepress-preset-config": minor
---

1. 自动识别提示词文件，并增加顶部导航栏入口。
2. 优化 VitePress 项目路径解析和 YAML frontmatter 处理

## 新增功能

- 自动识别提示词文件，并增加顶部导航栏入口。在 vitepress 项目的 srcDir 目录内，编写 prompts/index.md 文件时，就默认增加顶部导航栏。
- **项目根目录解析优化**：新增 `getProjectRootFromArgs()` 函数，支持从命令行参数解析 VitePress 项目根目录
- **源目录获取功能**：实现 `getVitepressSourceDirectory()` 函数，支持获取 VitePress 的源目录（srcDir），正确处理配置文件中的 `srcDir` 选项
- **智能 YAML frontmatter 合并**：重写 `writeYaml2PromptsIndexMd()` 函数，使用 `gray-matter` 库实现 YAML frontmatter 的智能读取、解析和合并

## 功能改进

- 使用 `lodash-es` 的 `merge` 函数实现深度数据合并，保留已有数据的同时更新新字段
- 增强了路径解析的健壮性，支持从命令行参数、向上查找等多种方式获取项目路径
- 更清晰的日志输出，便于调试和追踪执行过程

## 依赖变更

- 新增依赖：`gray-matter@^4.0.3` - 用于处理 Markdown 文件的 YAML frontmatter
- 移除对 `@ruan-cat/utils` 中 `writeYaml2md` 函数的依赖

## 技术细节

本次更新使函数能够：

1. 正确解析 `vitepress dev src/docs` 命令中的项目路径
2. 支持配置文件中的 `srcDir` 选项
3. 智能合并已有的 YAML frontmatter 数据，避免数据丢失
4. 自动创建不存在的目录和文件
