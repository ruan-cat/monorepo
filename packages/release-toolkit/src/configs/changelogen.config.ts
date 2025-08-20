import type { ChangelogConfig } from "changelogen";
import { extractCommitTypes, createEmojiTypeMap, createTypeEmojiMap } from "@ruan-cat/commitlint-config";

/**
 * 基于 @ruan-cat/commitlint-config 的 changelogen 配置
 * 支持 emoji + conventional commits 格式解析
 */

// 获取提交类型配置
const commitTypes = extractCommitTypes();
const emojiTypeMap = createEmojiTypeMap();
const typeEmojiMap = createTypeEmojiMap();

const config: ChangelogConfig = {
	// 仓库配置
	repo: {
		provider: "github",
		repo: "ruan-cat/monorepo",
	},

	// 提交类型映射 - 转换为 changelogen 格式
	types: Object.fromEntries(commitTypes.map(({ type, description }) => [type, { title: description }])),

	// 格式化选项
	formatOptions: {
		groupByType: true,
		showReferences: true,
		showAuthors: false,
	},

	// 排除的作者
	excludeAuthors: ["renovate[bot]", "dependabot[bot]", "github-actions[bot]"],

	// 自定义提交解析器
	parseCommit: (commit: any) => {
		const { message, shortHash, hash } = commit;

		// 尝试解析 emoji + conventional 格式: "🔧 build(scope): message"
		const emojiConventionalMatch = message.match(
			/^([\u{1f000}-\u{1f9ff}|\u{2600}-\u{27bf}|\u{2700}-\u{27BF}|\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}])\s+(\w+)(\([^)]+\))?(!)?\s*:\s*(.+)$/u,
		);

		if (emojiConventionalMatch) {
			const [, emoji, type, scopePart, breaking, description] = emojiConventionalMatch;
			const scope = scopePart ? scopePart.slice(1, -1) : undefined;

			return {
				type,
				scope,
				description,
				emoji,
				shortHash,
				hash,
				isBreaking: !!breaking || message.toLowerCase().includes("breaking change"),
				references: extractReferences(message),
			};
		}

		// 尝试解析纯 conventional 格式: "build(scope): message"
		const conventionalMatch = message.match(/^(\w+)(\([^)]+\))?(!)?\s*:\s*(.+)$/);

		if (conventionalMatch) {
			const [, type, scopePart, breaking, description] = conventionalMatch;
			const scope = scopePart ? scopePart.slice(1, -1) : undefined;
			const typeInfo = typeEmojiMap.get(type);

			return {
				type,
				scope,
				description,
				emoji: typeInfo?.emoji || "",
				shortHash,
				hash,
				isBreaking: !!breaking || message.toLowerCase().includes("breaking change"),
				references: extractReferences(message),
			};
		}

		// 尝试仅解析 emoji 开头: "🔧 some message"
		const emojiMatch = message.match(
			/^([\u{1f000}-\u{1f9ff}|\u{2600}-\u{27bf}|\u{2700}-\u{27BF}|\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}])\s+(.+)$/u,
		);

		if (emojiMatch) {
			const [, emoji, description] = emojiMatch;
			const typeInfo = emojiTypeMap.get(emoji);

			return {
				type: typeInfo?.type || "other",
				description,
				emoji,
				shortHash,
				hash,
				isBreaking: message.toLowerCase().includes("breaking change"),
				references: extractReferences(message),
			};
		}

		// 如果都不匹配，返回默认格式
		return {
			type: "other",
			description: message,
			shortHash,
			hash,
			isBreaking: message.toLowerCase().includes("breaking change"),
			references: extractReferences(message),
		};
	},

	// 自定义变更日志输出模板
	output: {
		format: "markdown",
	},
};

export default config;

/**
 * 从提交消息中提取引用 (如 issue 编号等)
 */
function extractReferences(message: string): string[] {
	const references: string[] = [];

	// 匹配 #123 格式的 issue 引用
	const issueMatches = message.match(/#(\d+)/g);
	if (issueMatches) {
		references.push(...issueMatches);
	}

	// 匹配 fixes #123, closes #123 等
	const fixesMatches = message.match(/(?:fixes|closes|resolves|fix|close|resolve)\s+#(\d+)/gi);
	if (fixesMatches) {
		references.push(...fixesMatches.map((match) => match.replace(/.*#/, "#")));
	}

	return [...new Set(references)]; // 去重
}
