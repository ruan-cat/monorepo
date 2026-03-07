# setUserConfig 的 extraConfig

`setUserConfig()` 一共有两个参数：

```ts
const userConfig = setUserConfig(config, extraConfig);
```

- 第一个参数 `config` 是普通的 VitePress 用户配置。
- 第二个参数 `extraConfig` 是 `@ruan-cat/vitepress-preset-config` 提供的扩展配置，用来补充预设内部的插件和 Teek 主题设置。

当你只需要改 `title`、`themeConfig`、`markdown` 之类的标准 VitePress 字段时，继续写在第一个参数里即可。只有当你要改预设内置插件，或者要覆盖预设默认的 Teek 配置时，才需要使用第二个参数。

## 快速示例

下面是一个最常见的写法：

```ts
import { setUserConfig } from "@ruan-cat/vitepress-preset-config/config";

const userConfig = setUserConfig(
	{
		title: "我的文档站点",
		themeConfig: {
			editLink: {
				pattern: "https://github.com/your-org/your-repo/blob/main/docs/:path",
			},
		},
	},
	{
		plugins: {
			llmstxt: {
				ignoreFiles: ["domain/**"],
			},
			gitChangelog: {
				repoURL: () => "https://github.com/your-org/your-repo",
				maxGitLogCount: 20,
			},
		},
		teekConfig: {
			codeBlock: {
				collapseHeight: 500,
			},
		},
	},
);

export default userConfig;
```

`packages/domains/docs/.vitepress/config.mts` 里的用法也是同一个思路，只是在 `plugins.llmstxt` 里通过 `ignoreFiles` 排除了 `domain/**`。

## 当前支持的字段

目前 `extraConfig` 只支持两类配置：

```ts
interface ExtraConfig {
	plugins?: {
		llmstxt?: LlmstxtSettings | false;
		gitChangelog?: GitChangelogOptions | false;
		gitChangelogMarkdownSection?: GitChangelogMarkdownSectionOptions | false;
	};
	teekConfig?: TeekConfigOptions;
}
```

## plugins

`extraConfig.plugins` 用来控制预设内置的 Vite 插件。

### plugins.llmstxt

用于配置 `vitepress-plugin-llms`。

```ts
const userConfig = setUserConfig(
	{},
	{
		plugins: {
			llmstxt: {
				ignoreFiles: ["domain/**"],
			},
		},
	},
);
```

如果你不想启用这个插件，可以显式传 `false`：

```ts
const userConfig = setUserConfig(
	{},
	{
		plugins: {
			llmstxt: false,
		},
	},
);
```

### plugins.gitChangelog

用于配置 `@nolebase/vitepress-plugin-git-changelog`。

如果你不传这个字段，预设内部仍然会启用它，并使用以下默认值：

```ts
{
	repoURL: () => "https://github.com/ruan-cat/monorepo",
	maxGitLogCount: 10,
}
```

覆盖写法如下：

```ts
const userConfig = setUserConfig(
	{},
	{
		plugins: {
			gitChangelog: {
				repoURL: () => "https://github.com/your-org/your-repo",
				maxGitLogCount: 30,
			},
		},
	},
);
```

禁用写法如下：

```ts
const userConfig = setUserConfig(
	{},
	{
		plugins: {
			gitChangelog: false,
		},
	},
);
```

### plugins.gitChangelogMarkdownSection

用于配置 `@nolebase/vitepress-plugin-git-changelog/vite` 里的 `GitChangelogMarkdownSection` 插件。

和上面两个插件一样，这个插件在当前实现里也是默认启用的。你可以传配置对象覆盖默认行为，也可以传 `false` 关闭它：

```ts
const userConfig = setUserConfig(
	{},
	{
		plugins: {
			gitChangelogMarkdownSection: false,
		},
	},
);
```

## teekConfig

`extraConfig.teekConfig` 用来覆盖预设内部的 Teek 主题配置。

预设内部会把你的 `teekConfig` 和 `defaultTeekConfig` 做一次深合并，所以你只需要写要修改的那一小部分即可，不需要把整份主题配置复制一遍。

```ts
const userConfig = setUserConfig(
	{},
	{
		teekConfig: {
			codeBlock: {
				collapseHeight: 500,
				overlayHeight: 280,
			},
			articleShare: {
				text: "复制分享链接",
			},
		},
	},
);
```

`packages/domains/docs/.vitepress/config.mts` 里还保留了一个注释掉的 `teekConfig` 示例：

```ts
teekConfig: {
	vitePlugins: {
		sidebarOption: {
			type: "array",
		},
	},
},
```

这个例子主要用于说明 `teekConfig` 的写法本身。就当前仓库里的实际经验来看，这类自动化侧边栏调整效果并不好看，所以示例代码被注释掉了。

## 注意事项

### 1. `config.vite.plugins` 会被覆盖

`setUserConfig()` 内部会根据 `extraConfig.plugins` 重新设置 `userConfig.vite.plugins`。这意味着你在第一个参数 `config` 里手写的 `vite.plugins`，最终会被覆盖掉。

如果你还要额外挂自定义 Vite 插件，建议在 `setUserConfig()` 返回之后再手动追加：

```ts
const userConfig = setUserConfig(
	{},
	{
		plugins: {
			llmstxt: false,
		},
	},
);

userConfig.vite ??= {};
userConfig.vite.plugins = [...(userConfig.vite.plugins ?? []), myCustomPlugin()];
```

### 2. `config.extends` 会被覆盖

`setUserConfig()` 内部会调用 `defineTeekConfig()`，并把结果重新写回 `userConfig.extends`。所以如果你要改 Teek 主题，不要把配置写到第一个参数的 `extends` 里，而应该写到 `extraConfig.teekConfig`。

### 3. 不传 `extraConfig` 也会启用默认插件

当前实现里，下面这些插件默认就是启用状态：

- `llmstxt`
- `gitChangelog`
- `gitChangelogMarkdownSection`

如果你的文档站点不需要其中某一个，记得显式传 `false` 关闭它。
