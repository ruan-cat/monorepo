/**
 * @ruan-cat/release-toolkit
 *
 * 基于 changelogen 增强 changesets 工作流的发布工具包
 * 提供语义化提交解析和 GitHub Release 同步功能
 */

// 导出 changesets 插件
export { default as changelogFunctions } from "./plugins/changelog-with-changelogen";
export * from "./plugins/changelog-with-changelogen";

// 导出 GitHub Release 同步工具
export { GitHubReleaseSync, runSync } from "./scripts/sync-github-release";
export type { PublishedPackage, ChangelogEntry } from "./scripts/sync-github-release";

// 导出 changelogen 配置
export { default as changelogConfig } from "./configs/changelogen.config";

// 重新导出 commitlint-config 的类型功能 (方便使用)
export {
	extractCommitTypes,
	createEmojiTypeMap,
	createTypeEmojiMap,
	getSupportedTypes,
} from "@ruan-cat/commitlint-config";
export type { CommitType } from "@ruan-cat/commitlint-config";
