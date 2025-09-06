import type { ExtraConfig, GitChangelogOptions } from "../types.ts";
import vitepressPluginLlmstxt from "vitepress-plugin-llms";
import { GitChangelog, GitChangelogMarkdownSection } from "@nolebase/vitepress-plugin-git-changelog/vite";
// import type { PluginOption } from "vite";
// importtype Plug{nOp ion} from "vitepress";

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
