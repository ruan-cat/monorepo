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

图片放大预览功能，来自于二次包装的 [vitepress-theme-teek](https://github.com/Kele-Bingtang/vitepress-theme-teek) 主题。

点击以下图片，即可放大预览。

![2025-07-03-01-20-20](https://s2.loli.net/2025/07/03/Bm9EQW2HSCy8FTa.png)

### typescript 类型提示

类型提示来自于 @shikijs/vitepress-twoslash 包。

::: details 封装好的 config.mts 配置

<<< ./config.mts#snipaste{ts twoslash}

:::

编写语法如下：

```markdown
<<< ./config.mts#snipaste{ts twoslash}
```

在 vitepress [导入代码块](https://vitepress.dev/zh/guide/markdown#import-code-snippets)的基础上，增加后面的尾缀 `#snipaste{ts twoslash}` 即可。

### vue 组件 demo 预览

<!-- TODO: 待补充具体例子 -->

## 路线图

- 样式和基础功能，照抄 [vitepress-theme-teek-one-public](https://gitee.com/onlyonexl/vitepress-theme-teek-one-public) 项目。
