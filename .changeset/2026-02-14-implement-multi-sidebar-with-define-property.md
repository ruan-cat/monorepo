---
"@ruan-cat/vitepress-preset-config": major
---

1. **实现基于 `Object.defineProperty` 拦截的透明多侧边栏**：本版本对侧边栏的内部架构进行了重大重构。新增 `setupMultiSidebar()` 函数，通过在 `themeConfig.sidebar` 上设置 getter/setter 拦截，实现了对消费者完全透明的多侧边栏功能。当消费者通过 `setGenerateSidebar()` 赋值 sidebar 时，setter 会将其存储为"业务侧边栏"；当 VitePress 读取 sidebar 时，getter 返回包含 `"/"（业务侧边栏）`、`"/prompts/"（提示词侧边栏）`、`"/CHANGELOG"（更新日志侧边栏）` 的多路径侧边栏对象。6 个消费者项目的代码无需做任何修改即可自动获得多侧边栏能力。
2. **`setGenerateSidebar()` 行为变更**：该函数现在会自动排除 `**/prompts/**` 和 `**/CHANGELOG.md` 两个 glob 模式。这意味着通过 `setGenerateSidebar()` 生成的侧边栏不再包含 prompts 目录和 CHANGELOG.md 文件的条目，这些内容由多侧边栏系统独立管理。如果消费者此前依赖 `setGenerateSidebar()` 来生成包含 prompts 或 CHANGELOG 的侧边栏条目，升级后这些条目将被移除并由独立的多侧边栏路径接管。
3. **`defaultUserConfig` 中 `sidebar` 字段不再静态赋值**：旧版本在 `defaultUserConfig.themeConfig.sidebar` 中直接调用 `setGenerateSidebar()` 进行静态赋值。新版本移除了该静态赋值，sidebar 完全由 `setUserConfig()` 内部调用的 `setupMultiSidebar()` 动态生成。
4. **移除 `generateMultiSidebar` 函数**：旧版本中用于生成多侧边栏的 `generateMultiSidebar()` 函数已被完全移除，替换为新的 `setupMultiSidebar()` 函数。新函数采用 defineProperty 拦截机制，而非直接赋值，从根本上解决了消费者代码覆盖侧边栏的问题。
5. **工具函数提取与重组**：将 `prompts-nav.ts` 中的 `getProjectRootFromArgs()`、`getVitepressProjectRoot()`、`getVitepressSourceDirectory()`、`hasPromptsIndexMd()` 四个工具函数提取到独立的 `utils/vitepress-project.ts` 模块，并将访问修饰符从 private 改为 public export，供 `multi-sidebar.ts`、`changelog-nav.ts` 等多个模块共享使用。
6. **`hasChangelogMd()` 函数签名变更**：原 `copy-changelog.ts` 中导出的 `hasChangelogMd()` 函数已重命名为私有函数 `checkChangelogExists()`，不再对外导出。新的 `hasChangelogMd()` 函数位于 `utils/vitepress-project.ts`，接受 `userConfig` 参数，基于 VitePress 源目录（而非 `process.cwd()`）检测 CHANGELOG.md 是否存在，检测逻辑更加准确。
7. **`changelog-nav.ts` 依赖变更**：`handleChangeLog()` 函数不再从 `copy-changelog.ts` 导入 `hasChangelogMd`，改为从 `utils/vitepress-project.ts` 导入，并传入 `userConfig` 参数。移除了对 `@ruan-cat/utils` 的 `printFormat` 导入和调试用的 `console.log` 输出。
8. **新增 `prefixSidebarLinks()` 内部函数**：该函数递归遍历侧边栏项，为 `link` 属性补充路径前缀（如 `/prompts`），解决 `vitepress-sidebar` 以子目录为根扫描时生成的 link 缺少父路径前缀导致 404 的问题。
9. **新增 `getSourceDirRelativePathFromCwd()` 导出函数**：计算 VitePress 源目录相对于 `process.cwd()` 的路径，用于 `vitepress-sidebar` 的 `documentRootPath` 配置。在 Windows 环境下自动将反斜杠转换为正斜杠，避免路径拼接错误。
10. **导出 `defaultSidebarOptions` 和 `getMergeSidebarOptions()`**：将侧边栏默认配置和合并函数从 `config.mts` 的模块作用域提升为 `multi-sidebar.ts` 的命名导出，便于外部模块复用统一的侧边栏配置。
11. **新增 5 个单元测试**：在 `src/docs/tests/multi-sidebar.test.ts` 中新增 5 个 vitest 测试用例，覆盖了 `setupMultiSidebar()` 在有 prompts + CHANGELOG、仅 prompts、仅 CHANGELOG、都没有、以及多次 setter 赋值等场景下的 getter/setter 拦截行为。
12. **新增多侧边栏实现事故复盘报告**：在 `src/docs/lesson/2026-02-14-multi-sidebar-bug-report.md` 中记录了四轮复盘，涵盖路径重复拼接、赋值覆盖、路由前缀缺失等问题的根因分析与经验教训。
