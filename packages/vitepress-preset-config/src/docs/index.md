# @ruan-cat/vitepress-preset-config

`@ruan-cat/vitepress-preset-config` 是一份面向中文技术文档站的 VitePress 配置预设。它把反复出现的主题、Markdown、导航、侧边栏和文档插件配置收敛为少量入口，让你从一份普通的 VitePress 配置开始，再按站点需要覆盖细节。

它不是重新封装 VitePress 的完整框架：标准的 VitePress 配置仍然写在 `.vitepress/config.mts`，这个包只提供默认值、约定功能和几个辅助函数。

## 适用场景

适合以下情况：

- 新建或维护以中文为主的 VitePress 文档站，希望直接使用 Teek 主题和本地搜索。
- 文档以 Markdown 文件和目录组织，希望按文件标题、`frontmatter.order` 自动生成侧边栏。
- 仓库有 `CHANGELOG.md` 或 `prompts/index.md`，希望它们自动出现在导航和对应的侧边栏中。
- 需要 Mermaid、示例代码块、Twoslash、数学公式，以及面向 LLM 的文档索引等常用能力。

如果你的站点不使用 VitePress 1.6、需要完全不同的主题体系，或希望自行控制全部 Vite/VitePress 插件，直接从 VitePress 官方配置开始通常更合适。

## 预设默认提供什么

调用 `setUserConfig()` 后，返回的是一份与自定义配置深度合并过的 VitePress 配置。默认包括：

- `vitepress-theme-teek` 主题、中文界面文本、首页导航、本地搜索和 GitHub 社交链接。
- Markdown 的 `vitepress-demo-plugin`、Mermaid、复制或下载 Markdown 按钮、Twoslash、行号、数学公式及中文容器标题。
- `vitepress-plugin-llms`、Git 变更日志插件和 Markdown 变更日志区块插件；它们默认启用，可在 `extraConfig` 中配置或关闭。
- `setGenerateSidebar()`：以文件的一级标题和 `frontmatter.order` 生成折叠式侧边栏，并忽略 `prompts/**` 与 `CHANGELOG.md`。
- 当文档源目录存在 `prompts/index.md` 时，自动写入其排序信息、增加“提示词”导航，并生成 `/prompts/` 侧边栏；存在 `CHANGELOG.md` 时同样增加“更新日志”导航与专用侧边栏。

默认的仓库地址是本 monorepo，因而公开使用时通常应覆盖 `gitChangelog.repoURL`，或者关闭不需要的 Git 变更日志插件。

## 安装

安装预设和它要求由项目提供的 peer dependencies：

```bash
pnpm add -D @ruan-cat/vitepress-preset-config vitepress@^1.6 vue@^3.5 vitepress-demo-plugin@^1
```

配置入口使用子路径导出；请从 `@ruan-cat/vitepress-preset-config/config` 导入，而不是从包根路径导入。

## 最小可用配置

假设文档目录为 `docs/`，新建 `docs/.vitepress/config.mts`：

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

再创建一个最小目录：

```text
docs/
├─ .vitepress/
│  └─ config.mts
├─ index.md
└─ guide/
   └─ index.md
```

`setGenerateSidebar()` 读取文件的一级标题作为菜单文字，并按 `frontmatter.order` 排序。例如：

```md
---
order: 1
---

# 开始使用
```

在 Windows 上，`documentRootPath` 必须使用相对路径，例如 `"./docs"`；不要传入盘符开头的绝对路径。

## 两层配置：该把内容写在哪里

`setUserConfig(config, extraConfig)` 有两个参数，各自负责不同的事情：

| 位置                     | 用途                                        | 常见内容                                                           |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------------------ |
| 第一个参数 `config`      | 标准 VitePress 配置，会与预设默认值深度合并 | 标题、描述、导航、侧边栏、编辑链接、`srcDir`、自定义 Markdown 配置 |
| 第二个参数 `extraConfig` | 预设自身的扩展项                            | 内置插件开关与选项、Teek 主题配置                                  |

不要把 Teek 配置写进第一个参数的 `extends`：预设会重建 `extends`。同样，预设会根据 `extraConfig.plugins` 重设 `vite.plugins`；如需额外挂载自己的 Vite 插件，请在调用 `setUserConfig()` 后追加。

```ts
const config = setUserConfig(
	{
		title: "我的文档站",
	},
	{
		teekConfig: {
			codeBlock: { collapseHeight: 500 },
		},
	},
);

config.vite ??= {};
config.vite.plugins = [...(config.vite.plugins ?? []), myVitePlugin()];
```

## 常用配置方案

### 通用项目文档：保留预设，改掉仓库地址

适用于有公开 Git 仓库、希望展示最近提交信息的文档站：

```ts
const config = setUserConfig(
	{
		title: "项目文档",
		description: "安装、配置和 API 说明",
	},
	{
		plugins: {
			gitChangelog: {
				repoURL: () => "https://github.com/your-org/your-repo",
				maxGitLogCount: 20,
			},
		},
	},
);
```

### 不需要 Git 变更日志：显式关闭

适用于私有文档、没有 Git 历史的静态站，或不希望在页面中展示提交信息的站点：

```ts
const config = setUserConfig(
	{
		title: "团队知识库",
	},
	{
		plugins: {
			gitChangelog: false,
			gitChangelogMarkdownSection: false,
		},
	},
);
```

### 面向 AI 的公开文档：保留并细化 LLM 索引

`vitepress-plugin-llms` 默认开启。若有不希望进入 LLM 索引的目录，可配置 `ignoreFiles`：

```ts
const config = setUserConfig(
	{},
	{
		plugins: {
			llmstxt: {
				ignoreFiles: ["internal/**", "drafts/**"],
			},
		},
	},
);
```

如果站点不需要这项能力，改为 `llmstxt: false` 即可。

有关每个插件选项、Teek 配置以及完整的关闭方式，请继续阅读 [扩展配置](./config/extra-config.md)。

## 文档约定与注意事项

- `prompts/index.md` 是提示词区的入口。存在该文件时，预设会改写其 frontmatter 并自动增加导航；不需要该功能时，不要创建这个文件。
- `CHANGELOG.md` 必须位于文档源目录根部。存在时会增加“更新日志”导航，但它不会出现在 `setGenerateSidebar()` 生成的普通侧边栏中。
- 预设会排除 `prompts/**` 和 `CHANGELOG.md`，因为它们分别由专用的多侧边栏逻辑处理。
- `themeConfig.sidebar` 请在 `setUserConfig()` 返回后单独赋值，如最小示例所示。这样普通文档、提示词和更新日志可以被合并为正确的多侧边栏结构。
- 默认开发服务器会在浏览器中打开，并使用端口 `8080`。需要其他端口时，在第一个参数的 `vite.server` 中覆盖。

## 主题入口

如果需要使用预设主题并加载自己的样式，在 `docs/.vitepress/theme/index.ts` 中写：

```ts
import { defineRuancatPresetTheme } from "@ruan-cat/vitepress-preset-config/theme";

import "./style.css";

export default defineRuancatPresetTheme();
```

## 下一步

- [快速开始](./guide/)：从安装、最小目录和第一份配置开始。
- [配置](./config/)：设置站点信息、主题、侧边栏、特殊页面和内置插件。
- [功能](./features/)：查看 Demo、Mermaid 与 Twoslash 的写法和限制。
- [常见问题](./faq/)：排查导入、编辑链接、Windows 路径和插件覆盖问题。
