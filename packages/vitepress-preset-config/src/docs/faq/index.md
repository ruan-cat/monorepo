---
order: 4
---

# 常见问题

## 为什么不能从包根路径导入？

此包通过子路径暴露配置和主题入口。使用：

```ts
import { setUserConfig } from "@ruan-cat/vitepress-preset-config/config";
import { defineRuancatPresetTheme } from "@ruan-cat/vitepress-preset-config/theme";
```

不要假定 `@ruan-cat/vitepress-preset-config` 根路径能导出全部 API。

## 点击编辑链接后为什么跳到提示页面？

这是预设默认 `editLink.pattern` 的提醒页。请在自己的配置中覆盖仓库、分支和文档目录，详见 [站点与主题](../config/site-and-theme.md)。

## Windows 上侧边栏为什么没有生成或路径异常？

`setGenerateSidebar()` 的 `documentRootPath` 要使用相对路径，例如 `"./docs"`。不要传盘符开头的绝对路径；详见 [导航与特殊页面](../config/navigation-and-special-pages.md)。

## 为什么自己配置的 Vite 插件或 `extends` 没有生效？

`setUserConfig()` 会在合并普通配置后重设 `vite.plugins` 与 Teek 的 `extends`。Teek 设置写入 `extraConfig.teekConfig`；自定义 Vite 插件在函数返回后追加，详见 [扩展配置](../config/extra-config.md)。

## 为什么页面显示了其他仓库的 Git 变更日志？

预设的默认 Git 仓库是本 monorepo。请在 `extraConfig.plugins.gitChangelog.repoURL` 中设置自己的仓库地址，或关闭 Git 变更日志插件。

## 如何关闭 LLM 文档索引或 Git 变更日志？

把对应插件字段设为 `false`：

```ts
const config = setUserConfig(
	{},
	{
		plugins: {
			llmstxt: false,
			gitChangelog: false,
			gitChangelogMarkdownSection: false,
		},
	},
);
```

## Twoslash 的行号为什么不准确？

预设当前启用 Twoslash 时存在行号显示不一致的已知限制。类型提示仍可使用；需要精确行号时请查看源码，更多用法见 [Twoslash](../features/twoslash.md)。
