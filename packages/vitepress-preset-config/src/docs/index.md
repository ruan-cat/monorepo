# 阮喵喵自用的 vitepress 预设配置

## 设计初衷

为了替换掉之前的 vuepress 预设配置。之前的 vuepress 预设配置导致我命名 md 文件很不舒服。

## 安装

```bash
pnpm i -D @ruan-cat/vitepress-preset-config vue vitepress vitepress-demo-plugin
```

::: warning 必须安装对等依赖

必须安装以下对等依赖：

- `vitepress`
- `vitepress-demo-plugin`
- `vue`

:::

## 简易使用

### 用户配置

::: details config.mts

<<< ./tests/config.example.ts#snipaste{ts twoslash}

:::

::: warning 侧边栏配置必须单独赋值

经过测试，目前发现侧边栏数组只能在手动赋值的时候才生效。

:::

### 主题配置

::: details theme/index.ts

<<< ./tests/theme.example.ts#snipaste{ts twoslash}

:::

## 提供功能

本预设默认提供以下功能：

[点此阅读](./feat/index.md)本预设提供的功能。

## 路线图

- 样式和基础功能，照抄 [vitepress-theme-teek-one-public](https://gitee.com/onlyonexl/vitepress-theme-teek-one-public) 项目。
