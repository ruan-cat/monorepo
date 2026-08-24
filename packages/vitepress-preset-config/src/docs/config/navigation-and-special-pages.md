---
order: 2
---

# 导航与特殊页面

## 自动生成普通侧边栏

`setGenerateSidebar()` 使用 `vitepress-sidebar` 扫描文档目录。默认行为是：

- 使用 Markdown 的一级标题作为菜单文字。
- 使用目录 `index.md` 的标题作为目录名称和目录链接。
- 按 `frontmatter.order` 排序，不按文件名排序。
- 将菜单折叠显示。
- 排除 `prompts/**` 和 `CHANGELOG.md`，因为它们由预设的专用逻辑处理。

```ts
config.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./docs",
});
```

`documentRootPath` 相对于运行 VitePress 命令时的工作目录解析。在 Windows 上必须传相对路径，例如 `"./docs"`；传入 `C:\\project\\docs` 这类绝对路径会导致 `vitepress-sidebar` 的路径拼接异常。

## 使用排序字段

为页面或目录入口添加 `order`，即可控制侧边栏顺序：

```md
---
order: 2
---

# 配置
```

没有排序要求时，不必为每个 Markdown 文件都添加 frontmatter。

## `prompts/index.md`

文档源目录中存在 `prompts/index.md` 时，`setUserConfig()` 会：

1. 为该文件写入或合并排序 frontmatter。
2. 在顶部导航追加“提示词”。
3. 为 `/prompts/` 生成单独的侧边栏。

这是约定驱动的功能；不需要提示词文档时，不要创建 `prompts/index.md`。该目录不需要放进普通 `setGenerateSidebar()` 的扫描结果。

## `CHANGELOG.md`

文档源目录根部存在 `CHANGELOG.md` 时，`setUserConfig()` 会在顶部导航追加“更新日志”，并为 `/CHANGELOG` 设置空的专用侧边栏。

若要把仓库根目录的 `CHANGELOG.md` 复制进文档源目录，请使用 [文档同步辅助函数](./document-sync.md)中的 `addChangelog2doc()`。它需要在构建或开发命令的工作目录能找到根目录 `CHANGELOG.md`。

## 侧边栏赋值位置

请在 `setUserConfig()` 返回后再赋值：

```ts
const config = setUserConfig({
	title: "我的文档站",
});

// @ts-ignore VitePress 的主题配置类型无法完整表达预设注入的多侧边栏。
config.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./docs",
});

export default config;
```

这样预设才能将普通侧边栏与可能存在的提示词、更新日志侧边栏组合在一起。
