import { CommitType } from "./type.ts";

export const commitTypes: CommitType[] = [
	{
		emoji: "✨",
		type: "feat",
		description: "新增功能 | A new feature",
	},
	{
		emoji: "🐞",
		type: "fix",
		description: "修复缺陷 | A bug fix",
	},
	{
		emoji: "📃",
		type: "docs",
		description: "文档更新 | Documentation only changes",
	},
	{
		emoji: "📦",
		type: "deps",
		description: "依赖更新",
	},
	{
		emoji: "🧪",
		type: "test",
		description: "测试相关 | Adding missing tests or correcting existing tests",
	},
	{
		emoji: "🔧",
		type: "build",
		description: "构建相关 | Changes that affect the build system or external dependencies",
	},
	{
		emoji: "🐎",
		type: "ci",
		description: "持续集成 | Changes to our CI configuration files and scripts",
	},
	{
		emoji: "📢",
		type: "publish",
		description: "发包 | 依赖包发布版本。",
	},
	{
		emoji: "🦄",
		type: "refactor",
		description: "代码重构 | A code change that neither fixes a bug nor adds a feature",
	},
	{
		emoji: "🎈",
		type: "perf",
		description: "性能提升 | A code change that improves performance",
	},
	{
		emoji: "🎉",
		type: "init",
		description: "初始化 | 项目初始化。",
	},
	{
		emoji: "⚙️",
		type: "config",
		description: "更新配置 | 配置更新。通用性的配置更新。",
	},
	{
		emoji: "🐳",
		type: "chore",
		description: "其他修改 | Other changes that do not modify src or test files",
	},
	{
		emoji: "↩",
		type: "revert",
		description: "回退代码 | Revert to a commit",
	},
	{
		emoji: "🗑",
		type: "del",
		description: "删除垃圾 | 删除无意义的东西，注释，文件，代码段等。",
	},
	{
		emoji: "🌐",
		type: "i18n",
		description: "国际化 | 专门设置国际化的翻译文本。",
	},
	{
		emoji: "🌈",
		type: "style",
		description: "代码格式 | Changes that do not affect the meaning of the code",
	},
	{
		emoji: "🤔",
		type: "save-file",
		description:
			"保存文件 | 文件保存类型。仅仅是为了保存文件。有时候会需要紧急提交，并快速切换分支。此时就需要提交代码。并保存文件。",
	},
	// 暂不需要该提交类型。
	// {
	// 	emoji: "✋",
	// 	type: "main-pull-update",
	// 	description: "主分支拉取更新 | 主分支拉取更新。",
	// },
	// {
	// 	emoji: "⏩",
	// 	type: "mark-progress",
	// 	description: "标记进度 | 标记进度。",
	// },
];
