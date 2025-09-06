import { type DefaultTheme, type UserConfig } from "vitepress";

import type { ExtraConfig, GitChangelogOptions } from "../types.ts";
import vitepressPluginLlmstxt from "vitepress-plugin-llms";
import { GitChangelog, GitChangelogMarkdownSection } from "@nolebase/vitepress-plugin-git-changelog/vite";

function isFalse(value: unknown): value is false {
	return value === false;
}

const defaultGitChangelogOptions: GitChangelogOptions = {
	// 填写在此处填写您的仓库链接
	repoURL: () => "https://github.com/ruan-cat/monorepo",
	// 最大日志深度为10, 避免获取过多无意义的历史日志
	maxGitLogCount: 10,
};

/**
 * 根据配置 返回插件列表
 * @description
 * 该函数将根据具体的配置 返回插件列表
 */
export function getPlugins(extraConfig?: ExtraConfig) {
	const plugins = [];
	const {
		llmstxt,
		gitChangelog = defaultGitChangelogOptions,
		gitChangelogMarkdownSection,
	} = extraConfig?.plugins || {};

	if (!isFalse(llmstxt)) {
		plugins.push(vitepressPluginLlmstxt(llmstxt));
	}

	if (!isFalse(gitChangelog)) {
		plugins.push(GitChangelog(gitChangelog));
	}

	if (!isFalse(gitChangelogMarkdownSection)) {
		plugins.push(GitChangelogMarkdownSection(gitChangelogMarkdownSection));
	}

	return plugins;
}

/**
 * 根据用户的额外配置 设置`文档配置`的 vite 插件
 * @description
 */
export function handlePlugins(userConfig: UserConfig<DefaultTheme.Config>, extraConfig?: ExtraConfig) {
	// @ts-ignore
	userConfig.vite.plugins = getPlugins(extraConfig);
}
