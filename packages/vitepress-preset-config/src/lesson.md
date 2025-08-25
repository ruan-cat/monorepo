---
order: 100
---

# 经验教训

这里的内容与库本身无关，仅仅是作者本人的经验教训。

## 找不到主题的错误

在单独的项目内使用该库，会出现主题找不到的错误。是因为`主题配置`应该直接使用 ts 文件，使用 js 文件会报错。

## 文档配置无法识别 ts 后缀

`文档配置`和`主题配置`不同，文档配置必须要用 js 文件，否则会出现报错。

## vite-plugin-vercel 在 vitepress 项目内打包产物不一致

TODO: 疑似 bug ，需要反馈给 vite-plugin-vercel 插件。

![2025-06-16-00-18-13](https://s2.loli.net/2025/06/16/ZjpGyahSeO5MFzc.png)

## 测试： 代码行号显示故障

### 代码片段激活 twoslash 的方案

- `{ts twoslash}` 官方的 pr 支持了。
- `#snipaste{ts twoslash}` 某个 issue 内支持这个写法。

### 长代码片段 有 details 容器

::: details 长代码片段 有 details 容器

<<< ./config.mts{ts twoslash}

<!-- #snipaste{ts twoslash} -->

:::

### 长代码片段 无 details 容器

<<< ./config.mts{ts twoslash}

<!-- #snipaste{ts twoslash} -->

### 短代码片段 有 details 容器

::: details 短代码片段 有 details 容器

<<< ./tests/theme.example.ts{ts twoslash}

<!-- #snipaste{ts twoslash} -->

:::

### 短代码片段 无 details 容器

<<< ./tests/theme.example.ts{ts twoslash}

<!-- #snipaste{ts twoslash} -->
