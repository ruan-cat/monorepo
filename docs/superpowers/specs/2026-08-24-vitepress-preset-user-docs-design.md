# 2026-08-24 VitePress 预设用户文档设计

## 目标

把 `packages/vitepress-preset-config/src/docs` 从“包说明、维护记录和历史实验混排”的站点，整理为主要服务包使用者的文档站。用户应能按“快速开始 → 配置 → 功能 → 常见问题”完成一次从安装到定制的阅读路径。

## 读者与范围

- 主要读者：准备在 VitePress 1.6 与 Vue 3.5 项目中使用 `@ruan-cat/vitepress-preset-config` 的开发者。
- 保留范围：所有现有 Markdown、示例、路线图、提示词、事故复盘和待修复问题继续留在仓库，且原有链接仍可访问。
- 非目标：不修改预设代码、公开 API、依赖、主题行为或构建脚本；不把内部记录删掉或改写成面向用户的承诺。

## 信息架构

首页只承担定位和分流职责，给出四个明确入口：

1. **快速开始**：安装要求、最小目录、可复制配置、开发与构建命令。
2. **配置**：站点与主题、自动侧边栏及特殊页面、内置插件与 Teek 扩展、文档同步辅助函数。
3. **功能**：Demo、Mermaid、Twoslash、主题中注册的客户端能力。
4. **常见问题**：导入入口、主题文件、编辑链接、Windows 相对路径、Twoslash 行号限制、内置插件覆盖规则。

维护资料（`lesson/`、`bug-to-fix/`、`roadmap/`、`prompts/`）不再由自动侧边栏扫描，也不从首页或用户入口页链接。它们保留为可直接访问的仓库历史资料。

## 页面与文件调整

| 目标页面       | 文件策略                                                                               | 负责回答的问题                                                                                 |
| -------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 快速开始       | 新建 `guide/index.md`、`guide/quick-start.md`                                          | 如何安装、放置配置文件、运行与构建文档站？                                                     |
| 配置索引       | 新建 `config/index.md`                                                                 | 配置项该写在标准 VitePress 配置还是 `extraConfig`？                                            |
| 站点与主题     | 新建 `config/site-and-theme.md`                                                        | 标题、导航、编辑链接、主题入口与自定义样式如何设置？                                           |
| 导航与特殊页面 | 新建 `config/navigation-and-special-pages.md`                                          | 自动侧边栏、`prompts/index.md`、`CHANGELOG.md` 的触发条件和边界是什么？                        |
| 文档同步       | 新建 `config/document-sync.md`                                                         | `addChangelog2doc`、`copyReadmeMd`、`copyClaudeFiles` 分别做什么、在何处运行、路径限制是什么？ |
| 扩展配置       | 将 `feat/set-user-config-extra-config.md` 移至 `config/extra-config.md` 并更新索引链接 | 如何配置或关闭内置插件与 Teek？                                                                |
| 功能索引与子页 | 将现有 `feat/` 页面整理到 `features/`，补充用途、最小示例和前置条件                    | Demo、Mermaid、Twoslash 如何使用？                                                             |
| 常见问题       | 新建 `faq/index.md`                                                                    | 遇到预设已知边界或配置错误时先检查什么？                                                       |
| 首页           | 继续维护 `index.md`                                                                    | 此包适合谁、默认包含什么、下一步读哪里？                                                       |

## 导航实现

当前站点通过 `setGenerateSidebar({ documentRootPath: "./src/docs" })` 扫描整个文档根目录，因此会自动暴露维护资料。实现时在本包文档的 `.vitepress/config.mts` 中保留自动生成侧边栏，同时把 `lesson/**`、`bug-to-fix/**`、`roadmap/**`、`prompts/**` 加入 `excludeByGlobPattern`。

用户页面按 `guide/`、`config/`、`features/`、`faq/` 四个目录组织，并为各入口页增加明确的一级标题和排序 frontmatter。这样既沿用现有 `setGenerateSidebar()` 行为，又不会为本站引入专用导航代码。

## 内容准确性规则

- 示例只使用当前包实际导出的 `@ruan-cat/vitepress-preset-config/config` 与 `@ruan-cat/vitepress-preset-config/theme`。
- 所有关于默认行为的陈述以 `src/config.mts`、`src/config/*.ts`、`src/theme.ts` 为依据。
- 涉及 `copyClaudeFiles` 的示例必须强调：`target` 只能是相对路径；`rootDir` 才允许绝对路径。
- 内置 Git 变更日志默认指向本 monorepo；公开用户文档必须提示覆盖 `repoURL` 或显式关闭。
- 已知限制只写已由现有资料或源码支持的事实，不把内部 TODO 伪装成路线承诺。

## 验收标准

- 首页能在不阅读源码的情况下说明包的用途、适用边界和四条阅读路径。
- 新用户能根据快速开始页建立一个可构建的最小文档站。
- 每个公开辅助函数和内置功能都有用途、触发条件、最小用法与限制说明。
- 自动侧边栏不再展示四类维护资料，且维护资料文件没有删除。
- `pnpm --filter @ruan-cat/vitepress-preset-config run build:docs` 成功完成，链接与 Markdown 渲染无错误。
