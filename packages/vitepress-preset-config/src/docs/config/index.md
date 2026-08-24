---
order: 2
---

# 配置

`setUserConfig(config, extraConfig)` 分为两层：

| 配置位置                 | 用途                                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| 第一个参数 `config`      | 普通 VitePress 配置，适合写标题、描述、导航、侧边栏、编辑链接和 Markdown 配置。 |
| 第二个参数 `extraConfig` | 预设特有配置，适合调整内置插件和 Teek 主题选项。                                |

预设会把第一个参数与默认配置深度合并；随后设置内置插件、Teek `extends` 和特殊页面侧边栏。因此需要了解覆盖顺序时，请先阅读扩展配置页。

## 配置主题

- [站点与主题](./site-and-theme.md)：站点信息、编辑链接、主题入口、样式和 `enhanceAppCallBack`。
- [导航与特殊页面](./navigation-and-special-pages.md)：自动侧边栏、提示词与更新日志页面。
- [文档同步辅助函数](./document-sync.md)：复制 README、变更日志与 `.claude` 内容。
- [扩展配置](./extra-config.md)：内置插件与 Teek 设置。
