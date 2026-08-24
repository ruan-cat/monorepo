---
order: 4
---

# 扩展配置

`setUserConfig()` 的第二个参数 `extraConfig` 用于调整预设内置插件和 Teek 配置：

```ts
const config = setUserConfig(
	{
		title: "我的文档站",
	},
	{
		plugins: {
			gitChangelog: {
				repoURL: () => "https://github.com/your-org/your-repo",
				maxGitLogCount: 20,
			},
		},
		teekConfig: {
			codeBlock: { collapseHeight: 500 },
		},
	},
);
```

## 内置插件

下列插件默认均会启用。传入配置对象可调整选项，传入 `false` 可关闭：

| 字段                                  | 用途                                      | 典型处理                                               |
| ------------------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| `plugins.llmstxt`                     | 生成 LLM 可读的文档索引                   | 使用 `ignoreFiles` 排除内部目录，或设为 `false` 关闭。 |
| `plugins.gitChangelog`                | 在页面中读取 Git 变更日志                 | 覆盖 `repoURL`；不需要提交信息时设为 `false`。         |
| `plugins.gitChangelogMarkdownSection` | 为 Markdown 页面提供 Git 变更日志区块能力 | 不需要时设为 `false`。                                 |

### LLM 文档索引

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

### Git 变更日志

预设的默认仓库地址是 `ruan-cat/monorepo`。在你的项目中应覆盖为真实仓库：

```ts
const config = setUserConfig(
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

私有知识库或没有 Git 历史的静态站可关闭两项 Git 功能：

```ts
const config = setUserConfig(
	{},
	{
		plugins: {
			gitChangelog: false,
			gitChangelogMarkdownSection: false,
		},
	},
);
```

## Teek 配置

`teekConfig` 会与预设默认的 Teek 配置深度合并，只写需要改动的部分：

```ts
const config = setUserConfig(
	{},
	{
		teekConfig: {
			codeBlock: {
				collapseHeight: 500,
				overlayHeight: 280,
			},
		},
	},
);
```

完整字段请查阅 [Teek 配置参考](https://vp.teek.top/reference/config.html)。

## 覆盖顺序

预设在合并第一个 `config` 参数后，会重新设置 `vite.plugins` 与 `extends`：

- 不要在第一个参数的 `extends` 中配置 Teek；请改用 `extraConfig.teekConfig`。
- 第一个参数中手写的 `vite.plugins` 会被内置插件列表覆盖。需要自己的 Vite 插件时，在 `setUserConfig()` 返回后追加。

```ts
const config = setUserConfig(
	{},
	{
		plugins: { llmstxt: false },
	},
);

config.vite ??= {};
config.vite.plugins = [...(config.vite.plugins ?? []), myVitePlugin()];
```
