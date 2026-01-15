import llmstxt from "vitepress-plugin-llms";
import { GitChangelog, type GitChangelogMarkdownSectionOptions } from "@nolebase/vitepress-plugin-git-changelog/vite";

// https://vp.teek.top/guide/quickstart.html#teek-引入
import { defineTeekConfig } from "vitepress-theme-teek/config";

export type LlmstxtSettings = NonNullable<Parameters<typeof llmstxt>[0]>;

export type GitChangelogOptions = NonNullable<Parameters<typeof GitChangelog>[0]>;

export type TeekConfigOptions = NonNullable<Parameters<typeof defineTeekConfig>[0]>;

/**
 * 额外的配置
 * @description
 * 目前主要用于精细化配置 vitepress 的插件
 */
export interface ExtraConfig {
	/**
	 * 即 vite 的 plugins
	 * @description
	 * vitepress 配置的一系列插件
	 */
	plugins?: {
		/**
		 * @description 用于配置 vitepress-plugin-llms 插件
		 * @see https://github.com/okineadev/vitepress-plugin-llms
		 */
		llmstxt?: LlmstxtSettings | false;

		/**
		 * @description 用于配置 @nolebase/vitepress-plugin-git-changelog 插件
		 * @see
		 */
		gitChangelog?: GitChangelogOptions | false;

		/**
		 * @description 用于配置 @nolebase/vitepress-plugin-git-changelog-markdown-section 插件
		 * @see
		 */
		gitChangelogMarkdownSection?: GitChangelogMarkdownSectionOptions | false;
	};

	/**
	 * Teek 主题配置
	 * @see https://vp.teek.top/reference/config.html
	 */
	teekConfig?: TeekConfigOptions;
}
