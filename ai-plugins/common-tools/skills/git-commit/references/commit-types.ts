/**
 * 提交类型定义（commit-types.ts）
 *
 * 本文件是远程 https://raw.githubusercontent.com/ruan-cat/monorepo/dev/.../commit-types.ts
 * 的快照副本。远程文件始终是权威来源，本文件仅在远程不可用时作为本地 fallback。
 * 该文件会随技能新版本发布时更新。如果你需要自维护，可修改此文件。
 *
 * 字段说明：
 * - emoji: 提交信息中使用的 emoji 符号
 * - type: Conventional Commits 的 type 标识
 * - semver: 可选，标注 semver 等级（minor/patch）
 * - description: 简短中文描述
 * - longDescription: 英文详细描述（供 commitlint 等工具使用）
 */

export const commitTypes = [
	{
		emoji: "✨",
		type: "feat",
		semver: "minor",
		description: "新增功能",
		longDescription: "A new feature",
	},
	{
		emoji: "🐞",
		type: "fix",
		semver: "patch",
		description: "修复缺陷",
		longDescription: "A bug fix",
	},
	{
		emoji: "📃",
		type: "docs",
		description: "文档更新",
		longDescription: "Documentation only changes",
	},
	{
		emoji: "📦",
		type: "deps",
		semver: "patch",
		description: "依赖更新",
	},
	{
		emoji: "🧪",
		type: "test",
		description: "测试相关",
		longDescription: "Adding missing tests or correcting existing tests",
	},
	{
		emoji: "🔨",
		type: "build",
		semver: "patch",
		description: "构建相关",
		longDescription: "Changes that affect the build system or external dependencies",
	},
	{
		emoji: "🐎",
		type: "ci",
		description: "持续集成",
		longDescription: "Changes to our CI configuration files and scripts",
	},
	{
		emoji: "📢",
		type: "publish",
		description: "发布依赖包",
		longDescription: "依赖包发布版本。",
	},
	{
		emoji: "🦄",
		type: "refactor",
		semver: "patch",
		description: "代码重构",
		longDescription: "A code change that neither fixes a bug nor adds a feature",
	},
	{
		emoji: "🎈",
		type: "perf",
		semver: "patch",
		description: "性能提升",
		longDescription: "A code change that improves performance",
	},
	{
		emoji: "🎉",
		type: "init",
		semver: "patch",
		description: "初始化项目",
		longDescription: "项目初始化。",
	},
	{
		emoji: "🔧",
		type: "config",
		semver: "patch",
		description: "更新配置",
		longDescription: "配置更新。通用性的配置更新。",
	},
	{
		emoji: "🐳",
		type: "chore",
		semver: "patch",
		description: "其他修改",
		longDescription: "Other changes that do not modify src or test files",
	},
	{
		emoji: "🔙",
		type: "revert",
		description: "回退代码",
		longDescription: "Revert to a commit",
	},
	{
		emoji: "🔪",
		type: "delete",
		description: "删除垃圾",
		longDescription: "删除无意义的东西，注释，文件，代码段等。",
	},
	{
		emoji: "🌐",
		type: "i18n",
		description: "国际化",
		longDescription: "专门设置国际化的翻译文本。",
	},
	{
		emoji: "🌈",
		type: "style",
		description: "代码格式",
		longDescription: "Changes that do not affect the meaning of the code",
	},
	{
		emoji: "🤔",
		type: "save-file",
		description: "保存文件",
		longDescription: "仅仅是为了保存文件。",
	},
];
