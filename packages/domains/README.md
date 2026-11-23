# 阮喵喵全部的域名列表

<!-- automd:badges color="yellow" name="@ruan-cat/domains" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/domains?color=yellow)](https://npmjs.com/package/@ruan-cat/domains)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/domains?color=yellow)](https://npm.chart.dev/@ruan-cat/domains)

<!-- /automd -->

为 `ruancat6312.top` 和 `ruan-cat.com` 两个域名，提供预设好的常量。旨在于管理全部的域名，便于查询和使用。

## 文档站部署

Cloudflare Workers Builds 的生产分支是 `dev`，root directory 是 `/`，previews 关闭。文档配置 import 了 `@ruan-cat/vitepress-preset-config` 和 `@ruan-cat/utils`。`package.json` 还依赖 `@ruan-cat/vuepress-preset-config`。

build 为 `pnpm i && pnpm exec turbo run build:docs --filter=@ruan-cat/domains`

deploy 为 `pnpm --dir packages/domains exec wrangler deploy`

include paths 为 `packages/domains/**`、`packages/vitepress-preset-config/**`、`packages/vuepress-preset-config/**`、`packages/utils/**`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`。

## Install

<!-- automd:pm-install name="@ruan-cat/domains" -->

```sh
# ✨ Auto-detect
npx nypm install @ruan-cat/domains

# npm
npm install @ruan-cat/domains

# yarn
yarn add @ruan-cat/domains

# pnpm
pnpm add @ruan-cat/domains

# bun
bun install @ruan-cat/domains

# deno
deno install npm:@ruan-cat/domains
```

<!-- /automd -->
