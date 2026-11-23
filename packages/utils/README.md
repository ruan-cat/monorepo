---
order: 10
dir:
  order: 10
---

# 工具包

<!-- automd:badges color="yellow" name="@ruan-cat/utils" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/utils?color=yellow)](https://npmjs.com/package/@ruan-cat/utils)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/utils?color=yellow)](https://npm.chart.dev/@ruan-cat/utils)

<!-- /automd -->

这是阮喵喵开发的工具包，提供了一些工具函数。

## 文档站部署

Cloudflare Workers Builds 的生产分支是 `dev`，root directory 是 `/`，previews 关闭。文档 VitePress 配置没有额外的工作区包 import。

build 为 `pnpm i && pnpm --dir packages/utils run build:docs-main`

deploy 为 `pnpm --dir packages/utils exec wrangler deploy`

include paths 为 `packages/utils/**`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`。

## Install

<!-- automd:pm-install name="@ruan-cat/utils" -->

```sh
# ✨ Auto-detect
npx nypm install @ruan-cat/utils

# npm
npm install @ruan-cat/utils

# yarn
yarn add @ruan-cat/utils

# pnpm
pnpm add @ruan-cat/utils

# bun
bun install @ruan-cat/utils

# deno
deno install npm:@ruan-cat/utils
```

<!-- /automd -->
