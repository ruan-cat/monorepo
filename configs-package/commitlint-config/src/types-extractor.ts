import { config } from "./config.ts";

/**
 * 从 commitlint-config 中提取commit类型配置
 * 用于与 changelogen 集成
 */

export interface CommitType {
	emoji: string;
	type: string;
	description: string;
}

/**
 * 解析 cz-git 配置中的 types，提取 emoji 和类型信息
 */
export function extractCommitTypes(): CommitType[] {
	const types = config.prompt?.types || [];

	return types.map((typeConfig) => {
		const { value, name } = typeConfig;

		// 解析格式: "✨ feat" -> emoji: "✨", type: "feat"
		const emojiMatch = value.match(
			/^([\u{1f000}-\u{1f9ff}|\u{2600}-\u{27bf}|\u{2700}-\u{27BF}|\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}])\s+(.+)$/u,
		);

		let emoji = "";
		let type = value;

		if (emojiMatch) {
			emoji = emojiMatch[1];
			type = emojiMatch[2];
		}

		// 从 name 中提取描述 (格式: "✨ feat:     新增功能 | A new feature")
		const descMatch = name.match(/:\s*([^|]+)/);
		const description = descMatch ? descMatch[1].trim() : type;

		return {
			emoji,
			type,
			description,
		};
	});
}

/**
 * 创建 emoji 到类型的映射
 */
export function createEmojiTypeMap(): Map<string, CommitType> {
	const types = extractCommitTypes();
	const map = new Map<string, CommitType>();

	types.forEach((commitType) => {
		if (commitType.emoji) {
			map.set(commitType.emoji, commitType);
		}
	});

	return map;
}

/**
 * 创建类型到 emoji 的映射
 */
export function createTypeEmojiMap(): Map<string, CommitType> {
	const types = extractCommitTypes();
	const map = new Map<string, CommitType>();

	types.forEach((commitType) => {
		map.set(commitType.type, commitType);
	});

	return map;
}

/**
 * 获取所有支持的提交类型
 */
export function getSupportedTypes(): string[] {
	return extractCommitTypes().map((t) => t.type);
}
