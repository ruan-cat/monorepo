# @ruan-cat/vitepress-preset-config

<!-- automd:badges color="yellow" name="@ruan-cat/vitepress-preset-config" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/vitepress-preset-config?color=yellow)](https://npmjs.com/package/@ruan-cat/vitepress-preset-config)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/vitepress-preset-config?color=yellow)](https://npm.chart.dev/@ruan-cat/vitepress-preset-config)

<!-- /automd -->

用于给大多数的 vitepress 项目提供一个预设的配置文件。

## 安装

<!-- automd:pm-install name="@ruan-cat/vitepress-preset-config" dev -->

```sh
# ✨ Auto-detect
npx nypm install -D @ruan-cat/vitepress-preset-config

# npm
npm install -D @ruan-cat/vitepress-preset-config

# yarn
yarn add -D @ruan-cat/vitepress-preset-config

# pnpm
pnpm add -D @ruan-cat/vitepress-preset-config

# bun
bun install -D @ruan-cat/vitepress-preset-config

# deno
deno install --dev npm:@ruan-cat/vitepress-preset-config
```

<!-- /automd -->

## 使用方法

```typescript
import { defineConfig } from "vitepress";
import { config } from "@ruan-cat/vitepress-preset-config";

export default defineConfig(config);
```

## 许可证

MIT
