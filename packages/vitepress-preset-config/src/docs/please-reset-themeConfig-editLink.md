# 请重设 `themeConfig.editLink.pattern`

你进入本页，表示站点仍在使用预设的默认编辑链接。请在 `setUserConfig()` 的 `themeConfig.editLink` 中填写自己的仓库、分支和文档目录；完整示例见 [站点与主题](./config/site-and-theme.md) 和 [常见问题](./faq/index.md)。

## 具体配置

对应站点可以模仿本站点的主题配置写法：

::: details 本站点的 `themeConfig.editLink.pattern` 配置

针对 vitepress 的 `docs\.vitepress\config.mts` 主题配置文件：

<!--
	指定代码块的识别语言为 ts
	这里高亮28行 专门指出 themeConfig.editLink.pattern 的配置，未来这里很可能需要重改重设
-->

<<< ./.vitepress/config.mts{ts 28}

:::

## 参考资料

- [编辑链接](https://vitepress.dev/zh/reference/default-theme-edit-link)
