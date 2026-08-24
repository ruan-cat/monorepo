# VitePress 预设用户文档实施清单

> **面向执行代理：** 必须逐项执行并验证；任务使用复选框记录，完成状态只能依据实际命令输出填写。

**目标：** 把 `@ruan-cat/vitepress-preset-config` 的站点整理为“快速开始 → 配置 → 功能 → 常见问题”的用户文档路径，同时保留维护资料与旧链接。

**实施方式：** 保持预设代码和构建脚本不变，只调整 `src/docs` 的页面与本站 `.vitepress/config.mts`。用户内容进入 `guide/`、`config/`、`features/`、`faq/`；自动侧边栏排除维护资料与兼容入口。

**技术栈：** VitePress 1.6、`vitepress-sidebar`、Markdown、pnpm。

## 全局约束

- 所有新增和改写文档使用简体中文；示例仅使用当前对外导出的 API。
- 不删除 `lesson/`、`bug-to-fix/`、`roadmap/`、`prompts/` 或旧 `feat/` 页面。
- 旧 `feat/` 页面必须保留可访问的迁移提示及新地址链接，不能成为主要侧边栏内容。
- 不修改 `src/config.mts`、`src/theme.ts`、`src/config/*.ts`、依赖或公开 API。
- 完成验证使用 `pnpm --filter @ruan-cat/vitepress-preset-config run build:docs`；构建生成的 `.vitepress/dist` 不纳入版本控制。

---

### 任务 1：建立用户导航边界

**文件：**

- 修改：`packages/vitepress-preset-config/src/docs/.vitepress/config.mts`
- 修改：`packages/vitepress-preset-config/src/docs/index.md`

**输入：** 当前自动侧边栏扫描 `./src/docs`，会显示全部目录。

**产出：** 自动侧边栏仅显示 `guide/`、`config/`、`features/`、`faq/` 等用户内容；首页提供四条阅读路径。

- [ ] 在 `setGenerateSidebar()` 的参数中保留 `documentRootPath: "./src/docs"`，并设置 `excludeByGlobPattern` 排除：`lesson/**`、`bug-to-fix/**`、`roadmap/**`、`prompts/**`、`feat/**`、`please-reset-themeConfig-editLink.md`。
- [ ] 调整首页的“下一步”区域为四个可扫描入口，分别指向 `/guide/`、`/config/`、`/features/`、`/faq/`，每项说明阅读目的。
- [ ] 明确首页不再链接维护资料，并保留包用途、适用边界和默认能力说明。
- [ ] 运行 `git diff --check -- packages/vitepress-preset-config/src/docs/.vitepress/config.mts packages/vitepress-preset-config/src/docs/index.md`；预期无输出。

### 任务 2：补齐快速开始与基础配置页面

**文件：**

- 新建：`packages/vitepress-preset-config/src/docs/guide/index.md`
- 新建：`packages/vitepress-preset-config/src/docs/guide/quick-start.md`
- 新建：`packages/vitepress-preset-config/src/docs/config/index.md`
- 新建：`packages/vitepress-preset-config/src/docs/config/site-and-theme.md`

**输入：** `setUserConfig()`、`setGenerateSidebar()` 和 `defineRuancatPresetTheme()` 的当前实现。

**产出：** 新用户可以安装 peer dependencies、建立 `docs/.vitepress/config.mts` 与主题入口，并理解标准 VitePress 配置和预设 `extraConfig` 的分工。

- [ ] 在各入口页添加 `frontmatter.order`：快速开始目录为 `1`，配置目录为 `2`；页面标题直接表达用户任务。
- [ ] 在快速开始页给出可运行的最小目录树、安装命令、`config.mts` 和 `theme/index.ts` 示例，以及 `docs:dev`/`build:docs` 命令的通用写法。
- [ ] 配置示例使用 `@ruan-cat/vitepress-preset-config/config` 与 `/theme` 子路径导入，说明 `themeConfig.sidebar` 必须在 `setUserConfig()` 返回后赋值。
- [ ] 在站点与主题页说明标题、描述、导航、社交链接、`editLink.pattern`、用户样式和 `enhanceAppCallBack` 的实际用途；提醒用户覆盖预设默认编辑链接。
- [ ] 在配置索引页解释第一个 `config` 参数与第二个 `extraConfig` 参数的职责，并链接至后续配置子页。

### 任务 3：说明预设专属配置与文件处理功能

**文件：**

- 新建：`packages/vitepress-preset-config/src/docs/config/navigation-and-special-pages.md`
- 新建：`packages/vitepress-preset-config/src/docs/config/document-sync.md`
- 新建：`packages/vitepress-preset-config/src/docs/config/extra-config.md`
- 修改：`packages/vitepress-preset-config/src/docs/feat/set-user-config-extra-config.md`

**输入：** `setGenerateSidebar()`、多侧边栏实现、`addChangelog2doc()`、`copyReadmeMd()`、`copyClaudeFiles()` 和现有 `extraConfig` 文档。

**产出：** 用户能区分自动导航、特殊文件处理和可选的文件复制工具，且不会把路径或插件配置写错。

- [ ] 导航页说明 `frontmatter.order`、文件 H1、`documentRootPath`、Windows 相对路径限制，以及 `prompts/index.md` 与文档根目录 `CHANGELOG.md` 的触发条件和路由效果。
- [ ] 文档同步页分别提供三个辅助函数的最小示例；写明它们均以运行命令的 `process.cwd()` 为基准，`copyClaudeFiles.target` 仅接受相对路径，`rootDir` 可为绝对路径。
- [ ] 从现有扩展配置页抽取经验证的内容至 `config/extra-config.md`：三个内置插件默认启用，`false` 关闭插件，`gitChangelog.repoURL` 应替换为用户仓库，`teekConfig` 深度合并；说明 `vite.plugins` 与 `extends` 的覆盖顺序。
- [ ] 将旧 `feat/set-user-config-extra-config.md` 缩减为兼容入口，仅说明页面已迁移并链接 `/config/extra-config`，避免两份事实来源分叉。

### 任务 4：整理功能页与常见问题

**文件：**

- 新建：`packages/vitepress-preset-config/src/docs/features/index.md`
- 新建：`packages/vitepress-preset-config/src/docs/features/demo.md`
- 新建：`packages/vitepress-preset-config/src/docs/features/mermaid.md`
- 新建：`packages/vitepress-preset-config/src/docs/features/twoslash.md`
- 新建：`packages/vitepress-preset-config/src/docs/faq/index.md`
- 修改：`packages/vitepress-preset-config/src/docs/feat/index.md`
- 修改：`packages/vitepress-preset-config/src/docs/feat/demo/index.md`
- 修改：`packages/vitepress-preset-config/src/docs/feat/mermaid/index.md`
- 修改：`packages/vitepress-preset-config/src/docs/feat/twoslash/index.md`
- 修改：`packages/vitepress-preset-config/src/docs/please-reset-themeConfig-editLink.md`

**输入：** 现有 Demo、Mermaid、Twoslash 演示文件、主题注册实现与历史故障记录。

**产出：** 功能页按照“用途 → 前置条件 → 最小写法 → 结果/限制”叙述；常见问题集中给出可执行的检查项。

- [ ] 功能索引页列出 Demo、Mermaid 与 Twoslash，并链接到新地址；每个功能页复用现有可构建的演示资源，不引入新的运行依赖。
- [ ] Demo 页说明 `<demo vue="..." />` 的作用、Vue 文件相对路径和 peer dependency；Mermaid 页给出最小代码块；Twoslash 页给出导入代码片段语法并说明当前行号显示限制。
- [ ] 旧 `feat/` 页面改为简短兼容入口，分别链接至 `/features/demo`、`/features/mermaid`、`/features/twoslash`；旧功能索引链接 `/features/`。
- [ ] 常见问题收录：使用 `/config` 与 `/theme` 子路径导入、编辑链接未覆盖、`documentRootPath` 的 Windows 相对路径要求、`vite.plugins`/`extends` 被预设接管、Twoslash 行号限制、如何关闭内置插件。
- [ ] 将 `please-reset-themeConfig-editLink.md` 保留为默认编辑链接的落地页，但正文改为简洁的排查提示，并链接至 FAQ 和站点主题配置页。

### 任务 5：构建与链接验收

**文件：**

- 验证：`packages/vitepress-preset-config/src/docs/**`

**输入：** 全部文档改动。

**产出：** 用户导航可构建，维护资料未删除且未进入自动侧边栏。

- [ ] 运行 `rg -n "\]\((?:\.\./|\./)?feat/|\]\((?:\.\./|\./)?features/|\]\((?:\.\./|\./)?config/|\]\((?:\.\./|\./)?guide/|\]\((?:\.\./|\./)?faq/" packages/vitepress-preset-config/src/docs`，逐项检查新旧链接的目标存在。
- [ ] 运行 `pnpm --filter @ruan-cat/vitepress-preset-config run build:docs`；预期退出码为 `0`，输出包含 `build complete`。
- [ ] 运行 `git diff --check -- packages/vitepress-preset-config/src/docs`；预期无输出。
- [ ] 运行 `git status --short --untracked-files=all -- packages/vitepress-preset-config/src/docs`，确认预期的文档与配置文件改动，且没有 `.vitepress/dist` 等构建产物。
