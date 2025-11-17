---
order: 8000
---

# 提示词

制作本库部分工具所使用的提示词，有各种各样杂项的提示词。

## 01 顶部导航栏，增加【提示词】一栏，便于整理复盘

- 文档排序配置内部处理，函数减少手动配置。函数以后不需要手动编写排序值了。
- 顶部导航栏，增加【提示词】一栏，便于整理复盘。

1. 请你帮我实现 `packages\vitepress-preset-config\src\config\prompts-nav.ts` 文件内的 TODO 部分。

### 01

针对 `packages\vitepress-preset-config\package.json` 的 docs:dev 命令，`vitepress dev src/docs --port 8080`。对于 getVitepressProjectRoot 函数来说，目前得到的路径是 `packages\vitepress-preset-config` ，不是我期望的 `packages\vitepress-preset-config\src\docs` ，你应该想办法获取到 `src/docs` 这个地址。

这个地址在 vitepress 项目内，被称呼为 `项目根目录 (project root)` 。

你可以阅读 https://vitepress.dev/zh/guide/routing#root-and-source-directory 站点来了解这个概念。

我希望你可以用来自 vitepress 内部的函数，来实现命令行内读取 `项目根目录 (project root)` 。未来在 vitepress 的 dev 和 build 命令内，都可以完成对 `项目根目录 (project root)` 的获取。

更改完毕后，你可以自主运行 `packages\vitepress-preset-config\package.json` 包的 docs:dev 和 build:docs 命令，观察输出结果，验证你的修改是否满足我的期望。

### 02

针对 `packages\vitepress-preset-config\package.json` 的 docs:dev 命令，`vitepress dev src/docs --port 8080`。对于 `getVitepressSourceDirectory` 函数来说，目前得到的路径是 `packages\vitepress-preset-config` ，不是我期望的 `packages\vitepress-preset-config\src\docs` ，你应该想办法获取到 `src/docs` 这个地址。

这个地址在 vitepress 项目内，被称呼为 `源目录 (srcDir)` 。

最终，结合 `packages\vitepress-preset-config\src\config\prompts-nav.ts` 文件的其他逻辑，我希望最终能够寻址到 `packages\vitepress-preset-config\src\docs\prompts\index.md` 这个文件。

我预期的逻辑是这样的：

1. 你在 `getVitepressSourceDirectory` 函数内，获取到最终真实生效的 `源目录 (srcDir)`。这个 `源目录 (srcDir)` 通常是存储 markdown 文件的。根据我提供的例子，该函数预期得到 `packages\vitepress-preset-config\src\docs` 地址。
2. 结合拼接逻辑，最终得到 `packages\vitepress-preset-config\src\docs\prompts\index.md` 这个文件。并判断该文件是否真实存在。

你必须先阅读以下文档，了解概念。请你务必理解清楚 VitePress 项目的文件结构中有两个重要的概念：项目根目录 (project root) 和源目录 (source directory)。

- https://vitepress.dev/zh/guide/routing#root-and-source-directory
- https://vitepress.dev/zh/guide/routing#source-directory

项目根目录 (project root) 是从 vitepress 命令行提供的，而源目录 (source directory)又是相对于根目录 (project root) 配置的，并且源目录 (source directory)还是可以在 vitepress 内配置的，请你务必获取到正确的地址。

我希望你可以用来自 vitepress 内部的函数，来实现读取 `源目录 (srcDir)` 。

更改完毕后，你可以自主运行 `packages\vitepress-preset-config\package.json` 包的 docs:dev 和 build:docs 命令，观察输出结果，验证你的修改是否满足我的期望。

### 03 优化 markdown 的 yaml 数据处理逻辑

请你帮我进一步优化代码写法，对于 `writeYaml2PromptsIndexMd` 函数而言，我希望你改写逻辑，增强代码健壮性：

1. 阅读 markdown 文件。
2. 检查是否已经包含了预先准备好的 yaml 信息。
3. 如果有 yaml 信息，就用提供的数据做数据拓展。yaml 信息接码后是一个 js 对象，对象之间的数据合并逻辑，用 lodash-es 的 merge 函数来实现数据合并。
4. 如果没有 yaml 信息，就写入顶部头 yaml 信息。

这个函数请使用 gray-matter 这个 node 库来实现相关的更改，不使用 `writeYaml2md` 函数了。

## 02 重构 addChangelog2doc 函数的 markdown 数据写入 yaml 的实现方式

针对 `packages\vitepress-preset-config\src\config\add-changelog-to-doc.ts` 的 addChangelog2doc ，请你阅读 `packages\vitepress-preset-config\src\config\prompts-nav.ts` writeYaml2PromptsIndexMd 函数，用 writeYaml2PromptsIndexMd 函数的 gray-matter 库，实现 addChangelog2doc 写法的重构。

## 03 增加新的被处理文件 `.claude/commands`

我需要你系统性的重构调整 `packages\vitepress-preset-config\src\config\copy-claude-agents.ts` 文件，增加新的被处理文件夹。

业务要求是： 和处理 `.claude/agents` 的逻辑相同，我需要你也一起处理 `.claude/commands` 文件。实现文件目录的统一移动。
技术性要求：

1. 文件重命名，重命名为语义化更准确的 `packages\vitepress-preset-config\src\config\copy-claude-files.ts` 。
2. 设计常量 `.claude/commands` 和 `.claude/agents` 。并减少重复使用代码，一律使用常量。
3. 对外导出唯一的函数 `copyClaudeFiles` 。
4. `copyClaudeFiles` 函数保持和原来相同的逻辑，同时处理 `.claude/commands` 和 `.claude/agents` 的文件。一起复制粘贴文件。
5. 请你适当的重构 `hasClaudeAgents` 函数，在判断文件夹目录是否存在时，确保和具体的文件夹解耦，做一个能够满足两个甚至是多个 `.claude` 目录文件夹是否存在的判别函数。做好提前量，为后续修改提供余量。

其他要求：

1. 由于文件改名了，请你及时的更改其他相关文件的路径导入写法。
2. 编写更新日志，发版标签为 minor。重点说明 api 改名和新增的功能。
3. 有疑问请及时询问我。要求我做出完整的回答后再继续开始你的修改。

### 01 回答 AI 问题

1. 关于 hasClaudeAgents 函数的重构：
   - 方案 A：内部通用函数（不对外暴露）
2. 关于复制目标位置:
   - 方式 A：单一 target，自动创建子文件夹
3. 关于常量设计： 符合预期。

## 04 处理 `vitepress-plugin-llms` 更新导致的构建错误

<!--
	跳过 无需处理 这是该依赖包本身的问题 已经提交pr
	https://github.com/okineadev/vitepress-plugin-llms/pull/104
	已经合并到主分支 未来会发包发版出来
-->

- https://github.com/okineadev/vitepress-plugin-llms/releases/tag/v1.9.2

vitepress-plugin-llms 插件在最近更新了最新的 `v1.9.2` 版本，这导致我的工作流出现以下构建错误：

```log
llmstxt »   vitepress-plugin-llms initialized (client build) with workDir: /home/runner/work/monorepo/monorepo/packages/vercel-deploy-tool/src/docs
@nolebase/vitepress-plugin-git-changelog: Prepare to gather git logs...
llmstxt »   Build started, file collection cleared
@nolebase/vitepress-plugin-git-changelog: Done. (284ms)
x Build failed in 2.44s
✖ building client + server bundles...
build error:
[vite]: Rollup failed to resolve import "vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue" from "/home/runner/work/monorepo/monorepo/packages/vitepress-preset-config/src/theme.ts".
This is most likely unintended because it can break your application at runtime.
If you do want to externalize this module explicitly add it to
`build.rollupOptions.external`
[vite]: Rollup failed to resolve import "vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue" from "/home/runner/work/monorepo/monorepo/packages/vitepress-preset-config/src/theme.ts".
This is most likely unintended because it can break your application at runtime.
If you do want to externalize this module explicitly add it to
`build.rollupOptions.external`
    at viteWarn (file:///home/runner/work/monorepo/monorepo/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.1_less@4.4.2_sass-embedded@1.93.3_sass@1.94.0/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:65855:17)
    at onRollupWarning (file:///home/runner/work/monorepo/monorepo/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.1_less@4.4.2_sass-embedded@1.93.3_sass@1.94.0/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:65887:5)
    at onwarn (file:///home/runner/work/monorepo/monorepo/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.1_less@4.4.2_sass-embedded@1.93.3_sass@1.94.0/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:65550:7)
    at file:///home/runner/work/monorepo/monorepo/node_modules/.pnpm/rollup@4.53.2/node_modules/rollup/dist/es/shared/node-entry.js:20961:13
    at Object.logger [as onLog] (file:///home/runner/work/monorepo/monorepo/node_modules/.pnpm/rollup@4.53.2/node_modules/rollup/dist/es/shared/node-entry.js:22834:9)
    at ModuleLoader.handleInvalidResolvedId (file:///home/runner/work/monorepo/monorepo/node_modules/.pnpm/rollup@4.53.2/node_modules/rollup/dist/es/shared/node-entry.js:21578:26)
    at file:///home/runner/work/monorepo/monorepo/node_modules/.pnpm/rollup@4.53.2/node_modules/rollup/dist/es/shared/node-entry.js:21536:26
 ELIFECYCLE  Command failed with exit code 1.
Error:  command finished with error: command (/home/runner/work/monorepo/monorepo/packages/vercel-deploy-tool) /home/runner/setup-pnpm/node_modules/.bin/pnpm run build:docs exited (1)
```

1. 请帮我调研一下，为什么这个插件在 `v1.9.2` 版本会出现故障？
2. 如果这个 `vitepress-plugin-llms` 包存在故障，请使用降低包版本的方式，实现问题解决。
3. 生成问题报告，便于我复盘了解。
