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
