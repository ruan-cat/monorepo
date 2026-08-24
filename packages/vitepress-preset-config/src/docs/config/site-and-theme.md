---
order: 1
---

# 站点与主题

## 设置站点信息

把标准 VitePress 字段写在 `setUserConfig()` 的第一个参数中：

```ts
const config = setUserConfig({
	title: "我的文档站",
	description: "项目使用与开发文档",
	themeConfig: {
		nav: [
			{ text: "首页", link: "/" },
			{ text: "指南", link: "/guide/" },
		],
		socialLinks: [{ icon: "github", link: "https://github.com/your-org/your-repo" }],
	},
});
```

预设默认使用中文界面文本、本地搜索和 GitHub 社交链接。传入同名字段即可覆盖默认值。

## 配置编辑链接

预设中的默认编辑链接指向本仓库的说明页，仅用于提醒使用者重新配置。请在自己的站点中覆盖它：

```ts
const config = setUserConfig({
	themeConfig: {
		editLink: {
			pattern: "https://github.com/your-org/your-repo/blob/main/docs/:path",
			text: "在 GitHub 上编辑此页",
		},
	},
});
```

`docs`、分支名和仓库地址需要与你的项目一致。点击编辑链接后仍进入“请重设 editLink”的页面时，说明该配置尚未覆盖。

## 使用预设主题

主题入口应从 `/theme` 子路径导入：

```ts
import { defineRuancatPresetTheme } from "@ruan-cat/vitepress-preset-config/theme";

import "./style.css";

export default defineRuancatPresetTheme();
```

预设主题基于 Teek，并注册 Git 变更日志、Twoslash、Mermaid 和 Markdown 复制/下载按钮所需的客户端能力。

## 扩展 `enhanceApp`

需要额外注册 Vue 插件、组件或指令时，传入 `enhanceAppCallBack`。预设的注册逻辑会先执行，再调用你的回调：

```ts
export default defineRuancatPresetTheme({
	enhanceAppCallBack({ app }) {
		app.component("MyBadge", MyBadge);
	},
});
```

不要在回调中重复注册预设已经提供的 Mermaid、Twoslash 或 Git 变更日志客户端组件。
