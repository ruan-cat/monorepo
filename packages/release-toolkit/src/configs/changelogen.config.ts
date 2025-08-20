import type { ChangelogConfig } from "changelogen";

// TODO: 目前设计是 该配置文件预期在纯 cjs 环境内使用 作为一个规范数据的配置文件 而不是面向 changelogen cli 功能的配置文件。
import { extractCommitTypes, createEmojiTypeMap } from "@ruan-cat/commitlint-config/types-extractor";

/**
 * 基于 @ruan-cat/commitlint-config 的 changelogen 配置
 * 支持 emoji + conventional commits 格式解析
 *
 * changelogen 内置支持以下 emoji commit 格式：
 * - :sparkles: feat: 新增功能
 * - ✨ feat: 新增功能
 * - 🐞 fix: 修复问题
 * - 📃 docs: 更新文档
 */

// 获取提交类型配置
const commitTypes = extractCommitTypes();
const emojiTypeMap = createEmojiTypeMap();

// 创建完整的类型映射，包括 emoji 和 type 的关联
const createCompleteTypeMapping = () => {
	const typeMapping: Record<string, { title: string; semver: "major" | "minor" | "patch" }> = {};

	// 从 commitlint-config 获取的标准类型
	commitTypes.forEach(({ type, description, emoji }) => {
		typeMapping[type] = {
			title: emoji ? `${emoji} ${description}` : description,
			semver: getSemverByType(type),
		};
	});

	// 添加常见的 gitmoji 类型映射（changelogen 支持这些）
	const gitmojiMapping = {
		// 新功能类
		sparkles: { title: "✨ 新增功能", semver: "minor" as const },
		zap: { title: "⚡ 性能优化", semver: "patch" as const },

		// 修复类
		bug: { title: "🐞 修复问题", semver: "patch" as const },
		ambulance: { title: "🚑 紧急修复", semver: "patch" as const },

		// 文档类
		memo: { title: "📝 更新文档", semver: "patch" as const },

		// 构建类
		package: { title: "📦 构建系统", semver: "patch" as const },
		rocket: { title: "🚀 部署功能", semver: "patch" as const },

		// 其他
		other: { title: "其他更改", semver: "patch" as const },
	};

	return { ...typeMapping, ...gitmojiMapping };
};

// changelogen 默认配置值
const config: Partial<ChangelogConfig> = {
	// 仓库配置
	repo: {
		provider: "github",
		repo: "ruan-cat/monorepo",
	},

	// 完整的提交类型映射 - 支持 emoji + conventional commits
	types: createCompleteTypeMapping(),

	// 作用域映射 - 增强 scope 显示，支持中文映射
	scopeMap: {
		api: "接口",
		ui: "界面",
		docs: "文档",
		test: "测试",
		config: "配置",
		deps: "依赖",
		release: "发布",
	},

	// 默认配置参数
	cwd: process.cwd(),
	from: "",
	to: "HEAD",

	// 排除的作者（包括机器人账号）
	excludeAuthors: ["renovate[bot]", "dependabot[bot]", "github-actions[bot]"],

	// GitHub token 配置 - 将通过环境变量读取
	tokens: {},

	// 输出配置 - 生成 CHANGELOG.md 文件
	output: "CHANGELOG.md",

	// 发布配置
	publish: {
		args: [],
		private: false,
	},

	// Git 标签配置
	signTags: false,

	// 模板配置 - 自定义提交和标签消息格式
	templates: {
		commitMessage: "📢 publish: release package(s) {{newVersion}}",
		tagMessage: "{{newVersion}}",
		tagBody: "Released on {{date}}",
	},
};

/**
 * 根据提交类型获取对应的语义化版本级别
 */
function getSemverByType(type: string): "major" | "minor" | "patch" {
	switch (type) {
		case "feat":
			return "minor"; // 新功能 -> 次版本号
		case "fix":
			return "patch"; // 修复 -> 补丁版本号
		case "perf":
			return "patch"; // 性能优化 -> 补丁版本号
		case "revert":
			return "patch"; // 回滚 -> 补丁版本号
		case "docs":
		case "style":
		case "refactor":
		case "test":
		case "chore":
		case "build":
		case "ci":
		default:
			return "patch"; // 其他类型 -> 补丁版本号
	}
}

export default config;
