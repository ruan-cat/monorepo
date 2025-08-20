import type { ChangelogFunctions } from "@changesets/types";
import { consola } from "consola";
import {
	extractCommitTypes,
	createEmojiTypeMap,
	createTypeEmojiMap,
} from "@ruan-cat/commitlint-config/types-extractor";
import { getGitDiff, parseCommits, loadChangelogConfig, type GitCommit, type ChangelogConfig } from "changelogen";
import changelogConfig from "../configs/changelogen.config.ts";

/**
 * 从 git commit 历史中获取提交信息并解析
 */
async function getCommitsFromGitHistory(from?: string, to?: string): Promise<GitCommit[]> {
	try {
		// 加载 changelogen 配置
		const config = await loadChangelogConfig(process.cwd(), {
			...changelogConfig,
			from: from || "",
			to: to || "HEAD",
		});

		consola.debug("Loaded changelogen config:", config);

		// 使用 changelogen 获取 git 提交差异
		const rawCommits = await getGitDiff(config.from, config.to);
		consola.debug(`Found ${rawCommits.length} raw commits from git history`);

		// 使用 changelogen 解析提交信息
		const parsedCommits = parseCommits(rawCommits, config);
		consola.debug(`Parsed ${parsedCommits.length} semantic commits`);

		return parsedCommits;
	} catch (error) {
		consola.error("Error getting commits from git history:", error);
		return [];
	}
}

/**
 * 将 changelogen 的 GitCommit 转换为变更日志行
 */
function formatCommitToChangelogLine(commit: GitCommit, repoUrl?: string): string {
	let line = "- ";

	// 添加 emoji (从类型映射中获取)
	const typeEmojiMap = createTypeEmojiMap();
	const typeInfo = typeEmojiMap.get(commit.type);
	if (typeInfo?.emoji) {
		line += `${typeInfo.emoji} `;
	}

	// 添加类型标签
	if (commit.type && commit.type !== "other") {
		line += `**${commit.type}**`;

		// 添加作用域
		if (commit.scope) {
			line += `(${commit.scope})`;
		}

		line += ": ";
	}

	// 添加 BREAKING CHANGE 标记
	if (commit.isBreaking) {
		line += "**BREAKING**: ";
	}

	// 添加描述
	line += commit.description;

	// 添加提交链接
	if (repoUrl) {
		const commitUrl = `${repoUrl}/commit/${commit.shortHash}`;
		line += ` ([${commit.shortHash}](${commitUrl}))`;
	}

	return line;
}

/**
 * 生成增强的变更日志行 - 集成 changelogen 功能
 */
const getReleaseLine: ChangelogFunctions["getReleaseLine"] = async (changeset, type, changelogOpts) => {
	try {
		const repoUrl = `https://github.com/${changelogOpts?.repo || "ruan-cat/monorepo"}`;

		// 方案1: 如果有关联的提交，直接使用提交哈希
		if (changeset.commit) {
			consola.debug(`Processing changeset ${changeset.id} with commit ${changeset.commit}`);

			// 尝试从 git 历史中获取该特定提交的详细信息
			const commits = await getCommitsFromGitHistory(changeset.commit, changeset.commit);

			if (commits.length > 0) {
				const commit = commits[0];
				const line = formatCommitToChangelogLine(commit, repoUrl);
				consola.debug(`Generated changelog line from git commit for ${changeset.id}:`, line);
				return line;
			}

			// 如果无法获取 git 提交信息，回退到基于 changeset 内容的解析
			consola.warn(`Could not find git commit ${changeset.commit}, falling back to changeset parsing`);
		}

		// 方案2: 基于 changeset 内容解析 (回退方案)
		consola.debug(`Processing changeset ${changeset.id} without commit, using changeset content`);

		// 尝试从 changeset 摘要中提取语义化提交信息
		const firstLine = changeset.summary.split("\n")[0];
		const typeEmojiMap = createTypeEmojiMap();
		const emojiTypeMap = createEmojiTypeMap();

		// 简化的语义化解析
		let line = "- ";
		let emoji = "";
		let commitType = "";
		let scope = "";
		let description = firstLine;
		let isBreaking = false;

		// 检查是否是 BREAKING CHANGE
		isBreaking = firstLine.includes("!:") || firstLine.toLowerCase().includes("breaking");

		// 尝试匹配 emoji + conventional 格式
		const emojiConventionalMatch = firstLine.match(
			/^([\u{1f000}-\u{1f9ff}|\u{2600}-\u{27bf}|\u{2700}-\u{27BF}|\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}])\s+(\w+)(\([^)]+\))?(!)?\s*:\s*(.+)$/u,
		);

		if (emojiConventionalMatch) {
			[, emoji, commitType, scope, , description] = emojiConventionalMatch;
			scope = scope ? scope.slice(1, -1) : "";
		} else {
			// 尝试匹配纯 conventional 格式
			const conventionalMatch = firstLine.match(/^(\w+)(\([^)]+\))?(!)?\s*:\s*(.+)$/);
			if (conventionalMatch) {
				[, commitType, scope, , description] = conventionalMatch;
				scope = scope ? scope.slice(1, -1) : "";
				const typeInfo = typeEmojiMap.get(commitType);
				emoji = typeInfo?.emoji || "";
			}
		}

		// 构建变更日志行
		if (emoji) {
			line += `${emoji} `;
		}

		if (commitType && commitType !== "other") {
			line += `**${commitType}**`;
			if (scope) {
				line += `(${scope})`;
			}
			line += ": ";
		}

		if (isBreaking) {
			line += "**BREAKING**: ";
		}

		line += description;

		// 如果有提交哈希，添加链接
		if (changeset.commit) {
			const commitUrl = `${repoUrl}/commit/${changeset.commit}`;
			line += ` ([${changeset.commit.substring(0, 7)}](${commitUrl}))`;
		}

		consola.debug(`Generated changelog line for ${changeset.id}:`, line);
		return line;
	} catch (error) {
		consola.error(`Error processing changeset ${changeset.id}:`, error);
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
 * 从 git commit 历史生成完整的变更日志内容
 * 这个功能可以独立于 changesets 使用
 */
export async function generateChangelogFromGitHistory(
	from?: string,
	to?: string,
	options?: {
		repo?: string;
		includeAuthors?: boolean;
		groupByType?: boolean;
	},
): Promise<string> {
	try {
		consola.info("Generating changelog from git commit history...");

		const commits = await getCommitsFromGitHistory(from, to);
		if (commits.length === 0) {
			consola.warn("No commits found in the specified range");
			return "";
		}

		const repoUrl = options?.repo ? `https://github.com/${options.repo}` : undefined;
		let changelog = "";

		if (options?.groupByType) {
			// 按类型分组生成变更日志
			const commitsByType = new Map<string, GitCommit[]>();

			commits.forEach((commit) => {
				const type = commit.type || "other";
				if (!commitsByType.has(type)) {
					commitsByType.set(type, []);
				}
				commitsByType.get(type)!.push(commit);
			});

			// 按重要性排序类型
			const typeOrder = [
				"feat",
				"fix",
				"perf",
				"revert",
				"docs",
				"style",
				"refactor",
				"test",
				"build",
				"ci",
				"chore",
				"other",
			];
			const sortedTypes = Array.from(commitsByType.keys()).sort((a, b) => {
				const indexA = typeOrder.indexOf(a);
				const indexB = typeOrder.indexOf(b);
				return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
			});

			// 为每个类型生成变更日志节
			for (const type of sortedTypes) {
				const typeCommits = commitsByType.get(type)!;
				if (typeCommits.length === 0) continue;

				// 获取类型显示名称
				const typeEmojiMap = createTypeEmojiMap();
				const typeInfo = typeEmojiMap.get(type);
				const typeTitle = typeInfo ? `${typeInfo.emoji} ${typeInfo.description}` : type.toUpperCase();

				changelog += `\n### ${typeTitle}\n\n`;

				typeCommits.forEach((commit) => {
					changelog += formatCommitToChangelogLine(commit, repoUrl) + "\n";
				});
			}
		} else {
			// 按时间顺序生成变更日志
			commits.forEach((commit) => {
				changelog += formatCommitToChangelogLine(commit, repoUrl) + "\n";
			});
		}

		// 添加贡献者信息
		if (options?.includeAuthors) {
			const authors = new Set<string>();
			commits.forEach((commit) => {
				commit.authors.forEach((author) => {
					authors.add(author.name);
				});
			});

			if (authors.size > 0) {
				changelog += `\n### Contributors\n\n`;
				Array.from(authors)
					.sort()
					.forEach((author) => {
						changelog += `- ${author}\n`;
					});
			}
		}

		consola.success(`Generated changelog with ${commits.length} commits`);
		return changelog;
	} catch (error) {
		consola.error("Error generating changelog from git history:", error);
		return "";
	}
}

/**
 * 混合模式：结合 changesets 和 git commit 历史生成变更日志
 * 当 changesets 不足时，自动补充 git commit 信息
 */
export async function generateHybridChangelog(
	changesets: any[],
	options?: {
		repo?: string;
		from?: string;
		to?: string;
		fallbackToGit?: boolean;
	},
): Promise<string> {
	try {
		let changelog = "";

		// 首先处理 changesets
		if (changesets && changesets.length > 0) {
			consola.info(`Processing ${changesets.length} changesets...`);

			for (const changeset of changesets) {
				// 这里可以调用 getReleaseLine 函数来处理每个 changeset
				// 但由于我们在插件上下文外，需要模拟调用
				const line = await getReleaseLine(changeset, "patch", { repo: options?.repo });
				changelog += line + "\n";
			}
		}

		// 如果启用回退到 git 且 changesets 不足，补充 git commit 信息
		if (options?.fallbackToGit && (!changesets || changesets.length === 0)) {
			consola.info("No changesets found, falling back to git commit history...");

			const gitChangelog = await generateChangelogFromGitHistory(options.from, options.to, {
				repo: options.repo,
				groupByType: true,
				includeAuthors: true,
			});

			changelog += gitChangelog;
		}

		return changelog;
	} catch (error) {
		consola.error("Error generating hybrid changelog:", error);
		return "";
	}
}

/**
 * 导出 changesets changelog 函数
 */
export const changelogFunctions: ChangelogFunctions = {
	getReleaseLine,
	getDependencyReleaseLine,
};

export default changelogFunctions;
