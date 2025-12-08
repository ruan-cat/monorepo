# 重构 `@ruan-cat/vercel-deploy-tool` 包

准备好大规模的，全面的重构 `@ruan-cat/vercel-deploy-tool` 包。

## 更换构建工具 vite -> tsup

构建工具从 vite 换成 tsup 。用 tsup 来完成项目构建，而不是直接用 vite 完成项目打包了。

你应该适当的参考本项目内其他子包是如何使用 tsup.config.ts 完成依赖包构建的。

## 精简 index.ts 写法

现代的 node typescript 包，其入口文件 src/index.ts 是很精简的。

请你帮我重构代码组织方式，确保代码入口 src/index.ts 是很精简的。适当的做好模块拆分。

## 同时对外提供 cli 和 api 式用法

请你适当的阅读 `@ruan-cat/taze-config` 和 `@ruan-cat/commitlint-config` 包，这两款包都提供 cli 能力，也提供函数式的 api 使用方式。

请你重点重构项目，确保项目提供 cli 命令行写法。

### 代码组织形式要预留新增多款命令

请你设计好代码组织方式，确保未来我可以新增多款 cli 命令。

目前必须要先实现 deploy 命令，未来我会要求你实现 init 命令。

你可以参考 `@ruan-cat/claude-notifier` 的 `packages\claude-notifier\src\commands` 目录，参考如何组织多款命令。

## 用 c12 重构配置文件

我希望未来使用基于 c12 的配置，实现项目配置。且对外暴露出一个语义化的配置函数 `defineConfig` 。 `defineConfig` 函数按照常见的做法写即可，直接返回形参即可。

我希望未来使用 `vercel-deploy-tool.config.ts` 文件，在 `vercel-deploy-tool.config.ts` 文件内配置 `defineConfig` 函数，实现部署任务的调度配置。

## 更换任务调度工具 definePromiseTasks -> tasuku

在之前的做法内，任务调度用的是 `definePromiseTasks` 函数，现在要求全部换成 `tasuku` 。

请你阅读 https://github.com/privatenumber/tasuku 仓库，学会如何使用 `tasuku` 这个任务调度工具，并替换掉 `definePromiseTasks` ，实现任务的调度。

## 对外暴露的 cli 命令名称

要包括以下这三款 cli 命令名称：

- `vercel-deploy-tool`
- `vdt`
- `@ruan-cat/vercel-deploy-tool`

用这三个名称都可以运行 `@ruan-cat/vercel-deploy-tool` 包对外提供的 cli 命令行。

## 提供 cli 命令 deploy

预期运行 `vercel-deploy-tool deploy` 命令后，就能够读取配置文件，并完成部署。

## 更新文档

更新 `packages\vercel-deploy-tool\src\docs` 内的文档，和 `packages\vercel-deploy-tool\README.md` 文档。

### 从旧版迁移到新版

请你编写好清晰明确的文档，告诉用户如何迁移到新版本。

## 更新根包的项目部署命令

换成直接使用 `@ruan-cat/vercel-deploy-tool` 包对外暴露出来的 `cli.ts` 文件来运行。直接用 tsx 来运行 `cli.ts` 脚本。

### 更新的 package.json 命令

以后部署 vercel 项目时，预期的命令是：

`"deploy-vercel": "vercel-deploy-tool deploy"`

## 彻底删掉 `scripts\vercel-deploy-tool.ts` 写法

以后的 `@ruan-cat/vercel-deploy-tool` 包，不再使用类似于 `scripts\vercel-deploy-tool.ts` 的写法了。

## 编写发版日志

为上述的一大堆更改，编写一份很详细的，专业的日志。本次发版标签为大版本更新，major 版本。

## 编写计划，准备实施

请你在 plan 计划模式内，认真调研，做好计划。随后我会切换模型，使用别的模型，根据你提供的计划文档来完成实施。
