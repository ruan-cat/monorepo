# 阮喵喵自用的vitepress预设配置

## 设计初衷

为了替换掉之前的vuepress预设配置。之前的vuepress预设配置导致我命名md文件很不舒服。

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

## git提交忽略配置 <Badge type="tip">0.13.0</Badge>

从 0.13.0 版本开始，在使用预设配置打包文档项目时，会在文档根目录内，额外生成 `.vercel` 目录，以便于 vercel 平台的部署。在使用命令行直接完成 vercel 平台部署时，额外整理好的 `.vercel` 目录能有效的完成快速部署。

因此，在文档项目内，或者是其他的`.gitignore`内，至少要包含`.vercel`目录，该目录应该要被忽略提交。

```txt
.vercel
```

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

### 图片放大预览

点击以下图片，即可放大预览

![2025-07-03-01-20-20](https://s2.loli.net/2025/07/03/Bm9EQW2HSCy8FTa.png)

### typescript 类型提示

<!-- TODO: 待补充具体例子 -->

### vue 组件 demo 预览

<!-- TODO: 待补充具体例子 -->

## 路线图

- 样式和基础功能，照抄 [vitepress-theme-teek-one-public](https://gitee.com/onlyonexl/vitepress-theme-teek-one-public) 项目。
