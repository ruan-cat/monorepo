/** 阮喵喵针对文档行为的配置 */
export interface RuanCatConfig {
	plugins?: {
		llmstxt?: boolean;
		gitChangelog?: boolean;
		gitChangelogMarkdownSection?: boolean;
		vitePluginVercel?: boolean;
	};
}
