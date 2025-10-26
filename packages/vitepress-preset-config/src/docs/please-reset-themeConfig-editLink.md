# 请重设 `themeConfig.editLink.pattern` 的取值

当你点击 `在 github 上打开此页面以预览原版 markdown 文档` 按钮后进入到本页面时，说明对应的网站的 vitepress 主题配置，没有及时重设更改 `themeConfig.editLink.pattern` 的取值，所以默认访问到本页面。

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
