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
