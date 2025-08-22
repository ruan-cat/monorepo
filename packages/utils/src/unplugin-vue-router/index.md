---
order: 20
dir:
  collapsible: false
  link: true
---

# unplugin-vue-router

[unplugin-vue-router](https://github.com/posva/unplugin-vue-router/blob/main/README.md)，是一款基于文件目录结构生成路由的 vite 插件。目前作为我前端开发的主力工具。

## 安装依赖

你需要独立安装 unplugin-vue-router 。

```bash
pnpm i -D unplugin-vue-router
```

::: tip

这个插件仅仅是从目录结构内快速生成路由对象，算是一个辅助性的插件，所以应该要以开发依赖的形式安装。

:::

## 使用

```ts
import { getRouteName } from "@ruan-cat/utils/unplugin-vue-router";
```
