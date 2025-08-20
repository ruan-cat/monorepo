import type { ChangelogFunctions } from "@changesets/types";
import { consola } from "consola";
import {
	extractCommitTypes,
	createEmojiTypeMap,
	createTypeEmojiMap,
} from "@ruan-cat/commitlint-config/types-extractor";

/**
 * 解析语义化提交信息
 * 支持格式: "🔧 build(scope): message" 或 "build(scope): message"
 */
function parseSemanticCommit(message: string): {
	emoji: string;
	type: string;
	scope?: string;
	description: string;
	isBreaking: boolean;
} {
	const emojiTypeMap = createEmojiTypeMap();
	const typeEmojiMap = createTypeEmojiMap();

	// 检查是否包含 BREAKING CHANGE 标记
	const isBreaking = message.includes("!:") || message.toLowerCase().includes("breaking change");

	// 尝试匹配 emoji + conventional 格式: "🔧 build(scope): message"
	const emojiConventionalMatch = message.match(
		/^([\u{1f000}-\u{1f9ff}|\u{2600}-\u{27bf}|\u{2700}-\u{27BF}|\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}])\s+(\w+)(\([^)]+\))?(!)?\s*:\s*(.+)$/u,
	);

	if (emojiConventionalMatch) {
		const [, emoji, type, scopePart, breaking, description] = emojiConventionalMatch;
		const scope = scopePart ? scopePart.slice(1, -1) : undefined;

		return {
			emoji,
			type,
			scope,
			description,
			isBreaking: isBreaking || !!breaking,
		};
	}

	// 尝试匹配纯 conventional 格式: "build(scope): message"
	const conventionalMatch = message.match(/^(\w+)(\([^)]+\))?(!)?\s*:\s*(.+)$/);

	if (conventionalMatch) {
		const [, type, scopePart, breaking, description] = conventionalMatch;
		const scope = scopePart ? scopePart.slice(1, -1) : undefined;
		const typeInfo = typeEmojiMap.get(type);

		return {
			emoji: typeInfo?.emoji || "",
			type,
			scope,
			description,
			isBreaking: isBreaking || !!breaking,
		};
	}

	// 尝试仅匹配 emoji 开头
	const emojiMatch = message.match(
		/^([\u{1f000}-\u{1f9ff}|\u{2600}-\u{27bf}|\u{2700}-\u{27BF}|\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}])\s+(.+)$/u,
	);

	if (emojiMatch) {
		const [, emoji, description] = emojiMatch;
		const typeInfo = emojiTypeMap.get(emoji);

		return {
			emoji,
			type: typeInfo?.type || "other",
			description,
			isBreaking,
		};
	}

	// 如果都不匹配，返回原始信息
	return {
		emoji: "",
		type: "other",
		description: message,
		isBreaking,
	};
}

/**
 * 生成增强的变更日志行
 */
const getReleaseLine: ChangelogFunctions["getReleaseLine"] = async (changeset, type, changelogOpts) => {
	try {
		// 如果没有关联的提交，使用基础格式
		if (!changeset.commit) {
			consola.warn(`Changeset ${changeset.id} has no associated commit, using basic format`);
			return `- ${changeset.summary}`;
		}

		// 获取提交信息 (changesets 通常会在 changeset.commit 中提供提交哈希)
		const commitHash = changeset.commit;
		const commitUrl = `https://github.com/${changelogOpts?.repo || "ruan-cat/monorepo"}/commit/${commitHash}`;

		// 从 changeset 的第一行获取原始提交信息进行解析
		const firstLine = changeset.summary.split("\n")[0];
		const semanticInfo = parseSemanticCommit(firstLine);

		// 构建增强的变更日志行
		let line = "- ";

		// 添加 emoji (如果有)
		if (semanticInfo.emoji) {
			line += `${semanticInfo.emoji} `;
		}

		// 添加类型标签 (如果不是 other)
		if (semanticInfo.type && semanticInfo.type !== "other") {
			line += `**${semanticInfo.type}**`;

			// 添加作用域 (如果有)
			if (semanticInfo.scope) {
				line += `(${semanticInfo.scope})`;
			}

			line += ": ";
		}

		// 添加 BREAKING CHANGE 标记
		if (semanticInfo.isBreaking) {
			line += "**BREAKING**: ";
		}

		// 添加描述
		line += `${changeset.summary}`;

		// 添加提交链接
		line += ` ([${commitHash.substring(0, 7)}](${commitUrl}))`;

		consola.debug(`Generated changelog line for ${changeset.id}:`, line);
		return line;
	} catch (error) {
		consola.error(`Error processing changeset ${changeset.id}:`, error);
		// 发生错误时返回基础格式
		return `- ${changeset.summary}`;
	}
};

/**
 * 生成变更日志依赖行
 */
const getDependencyReleaseLine: ChangelogFunctions["getDependencyReleaseLine"] = async (
	changesets,
	dependenciesUpdated,
	changelogOpts,
) => {
	if (dependenciesUpdated.length === 0) return "";

	const updatedDependencies = dependenciesUpdated.map((dependency) => {
		const type = dependency.type === "patch" ? "Patch" : dependency.type === "minor" ? "Minor" : "Major";
		return `  - ${dependency.name}@${dependency.newVersion} (${type})`;
	});

	return `- Updated dependencies:\n${updatedDependencies.join("\n")}`;
};

/**
 * 导出 changesets changelog 函数
 */
export const changelogFunctions: ChangelogFunctions = {
	getReleaseLine,
	getDependencyReleaseLine,
};

export default changelogFunctions;
