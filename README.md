# 阮喵喵的单仓

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/ruan-cat/monorepo)

这里存放了阮喵喵封装的`依赖包`和`各种小工具`，以 monorepo 的形式存储。

<!--
  带有ruan-cat风味的monorepo包仓库。一个基于pnpm+monorepo架构的node仓库。子项目包括vitepress预设配置、taze预设配置、claude code插件商城、claude code通知工具等。
 -->

## `@ruan-cat/utils`

工具包项目。

<!-- automd:badges color="yellow" name="@ruan-cat/utils" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/utils?color=yellow)](https://npmjs.com/package/@ruan-cat/utils)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/utils?color=yellow)](https://npm.chart.dev/@ruan-cat/utils)

<!-- /automd -->

## `@ruan-cat/vercel-deploy-tool`

vercel 部署工具。

<!-- automd:badges color="yellow" name="@ruan-cat/vercel-deploy-tool" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/vercel-deploy-tool?color=yellow)](https://npmjs.com/package/@ruan-cat/vercel-deploy-tool)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/vercel-deploy-tool?color=yellow)](https://npm.chart.dev/@ruan-cat/vercel-deploy-tool)

<!-- /automd -->

## `@ruan-cat/vitepress-preset-config`

vitepress 预设。

<!-- automd:badges color="yellow" name="@ruan-cat/vitepress-preset-config" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/vitepress-preset-config?color=yellow)](https://npmjs.com/package/@ruan-cat/vitepress-preset-config)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/vitepress-preset-config?color=yellow)](https://npm.chart.dev/@ruan-cat/vitepress-preset-config)

<!-- /automd -->

## `@ruan-cat/vuepress-preset-config`

vuepress 预设。

<!-- automd:badges color="yellow" name="@ruan-cat/vuepress-preset-config" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/vuepress-preset-config?color=yellow)](https://npmjs.com/package/@ruan-cat/vuepress-preset-config)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/vuepress-preset-config?color=yellow)](https://npm.chart.dev/@ruan-cat/vuepress-preset-config)

<!-- /automd -->

## `@ruan-cat/claude-notifier`

在 Claude Code 任务完成后，发送 Windows 系统通知。

<!-- automd:badges color="yellow" name="@ruan-cat/claude-notifier" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/claude-notifier?color=yellow)](https://npmjs.com/package/@ruan-cat/claude-notifier)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/claude-notifier?color=yellow)](https://npm.chart.dev/@ruan-cat/claude-notifier)

<!-- /automd -->

## `@ruan-cat/release-toolkit`

基于 changelogen 增强 changesets 工作流的发布工具包，提供语义化提交解析和 GitHub Release 同步功能。

<!-- automd:badges color="yellow" name="@ruan-cat/release-toolkit" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/release-toolkit?color=yellow)](https://npmjs.com/package/@ruan-cat/release-toolkit)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/release-toolkit?color=yellow)](https://npm.chart.dev/@ruan-cat/release-toolkit)

<!-- /automd -->

## `@ruan-cat/commitlint-config`

commitlint 配置。

<!-- automd:badges color="yellow" name="@ruan-cat/commitlint-config" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/commitlint-config?color=yellow)](https://npmjs.com/package/@ruan-cat/commitlint-config)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/commitlint-config?color=yellow)](https://npm.chart.dev/@ruan-cat/commitlint-config)

<!-- /automd -->

## `@ruan-cat/generate-code-workspace`

生成工作区配置文件。

<!-- automd:badges color="yellow" name="@ruan-cat/generate-code-workspace" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/generate-code-workspace?color=yellow)](https://npmjs.com/package/@ruan-cat/generate-code-workspace)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/generate-code-workspace?color=yellow)](https://npm.chart.dev/@ruan-cat/generate-code-workspace)

<!-- /automd -->

## `@ruan-cat/taze-config`

taze 配置。

<!-- automd:badges color="yellow" name="@ruan-cat/taze-config" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/taze-config?color=yellow)](https://npmjs.com/package/@ruan-cat/taze-config)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/taze-config?color=yellow)](https://npm.chart.dev/@ruan-cat/taze-config)

<!-- /automd -->

## `@ruan-cat/vite-plugin-ts-alias`

将 tsconfig.paths 配置转换成 vite 的 alias 路径别名。

<!-- automd:badges color="yellow" name="@ruan-cat/vite-plugin-ts-alias" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/vite-plugin-ts-alias?color=yellow)](https://npmjs.com/package/@ruan-cat/vite-plugin-ts-alias)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/vite-plugin-ts-alias?color=yellow)](https://npm.chart.dev/@ruan-cat/vite-plugin-ts-alias)

<!-- /automd -->

## claude code

本仓库还作为一个 claude code 插件市场。

运行 claude code 命令：

```bash
/plugin marketplace add ruan-cat/monorepo
```

**注意**，claude code 安装插件市场时，会对本仓库做一个全量的浅克隆。具体存储该插件市场的目录，会出现很多无关的文件。

点此[阅读详情](./.claude-plugin/README.md)。
