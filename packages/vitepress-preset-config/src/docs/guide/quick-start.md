---
order: 1
---

# 安装与最小站点

## 1. 安装依赖

预设的配置与主题分别通过子路径导出。先安装预设及其 peer dependencies：

```bash
pnpm add -D @ruan-cat/vitepress-preset-config vitepress@^1.6 vue@^3.5 vitepress-demo-plugin@^1
```

## 2. 创建目录

下面以仓库根目录中的 `docs/` 为文档源目录：

```text
docs/
├─ .vitepress/
│  ├─ config.mts
│  └─ theme/
│     └─ index.ts
├─ index.md
└─ guide/
   └─ index.md
```

## 3. 创建 VitePress 配置

在 `docs/.vitepress/config.mts` 中写入：

```ts
import { setGenerateSidebar, setUserConfig } from "@ruan-cat/vitepress-preset-config/config";

const config = setUserConfig({
	title: "我的文档站",
	description: "项目使用与开发文档",
	themeConfig: {
		nav: [
			{ text: "首页", link: "/" },
			{ text: "指南", link: "/guide/" },
		],
		socialLinks: [{ icon: "github", link: "https://github.com/your-org/your-repo" }],
		editLink: {
			pattern: "https://github.com/your-org/your-repo/blob/main/docs/:path",
			text: "在 GitHub 上编辑此页",
		},
	},
});

// 在 setUserConfig() 返回后赋值，供预设的多侧边栏逻辑统一处理。
// @ts-ignore VitePress 的主题配置类型无法完整表达预设注入的多侧边栏。
config.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./docs",
});

export default config;
```

`setGenerateSidebar()` 默认使用 Markdown 的一级标题作为菜单文字，并按 `frontmatter.order` 排序。例如：

```md
---
order: 1
---

# 开始使用
```

## 4. 创建主题入口

在 `docs/.vitepress/theme/index.ts` 中写入：

```ts
import { defineRuancatPresetTheme } from "@ruan-cat/vitepress-preset-config/theme";

import "./style.css";

export default defineRuancatPresetTheme();
```

`style.css` 是可选的；不需要自定义样式时，删除对应的导入即可。

## 5. 运行与构建

为项目添加脚本：

```json
{
	"scripts": {
		"docs:dev": "vitepress dev docs",
		"docs:build": "vitepress build docs"
	}
}
```

然后运行：

```bash
pnpm docs:dev
pnpm docs:build
```

如果你的文档目录不是 `docs/`，把两个命令末尾的路径与 `documentRootPath` 一并改成实际的相对路径。在 Windows 上，`documentRootPath` 必须是相对路径，不能使用盘符开头的绝对路径。
