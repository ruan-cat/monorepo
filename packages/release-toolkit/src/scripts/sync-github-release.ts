#!/usr/bin/env tsx

import { Octokit } from "@octokit/rest";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { consola } from "consola";

export interface PublishedPackage {
	name: string;
	version: string;
}

export interface ChangelogEntry {
	version: string;
	releaseNotes: string;
	date?: string;
}

export class GitHubReleaseSync {
	private octokit: Octokit;
	private repo: { owner: string; repo: string };

	constructor(
		private options: {
			token: string;
			repository: string; // 格式: "owner/repo"
		},
	) {
		this.octokit = new Octokit({
			auth: options.token,
			log: consola,
		});

		const [owner, repo] = options.repository.split("/");
		if (!owner || !repo) {
			throw new Error(`Invalid repository format: ${options.repository}. Expected "owner/repo"`);
		}

		this.repo = { owner, repo };
		consola.info(`Initialized GitHub Release Sync for ${owner}/${repo}`);
	}

	/**
	 * 解析 CHANGELOG.md 获取最新版本的发布说明
	 */
	private parseLatestChangelog(changelogPath: string): ChangelogEntry | null {
		try {
			if (!existsSync(changelogPath)) {
				consola.warn(`Changelog not found: ${changelogPath}`);
				return null;
			}

			const content = readFileSync(changelogPath, "utf-8");
			const lines = content.split("\n");

			let version = "";
			let releaseNotes = "";
			let isInLatestVersion = false;
			let hasFoundFirstVersion = false;

			for (const line of lines) {
				// 匹配版本标题 (## 1.0.0 或 ## [1.0.0] 等)
				const versionMatch = line.match(/^##\s+(\[)?([^\]]+)(\])?/);

				if (versionMatch) {
					if (!hasFoundFirstVersion) {
						// 第一个版本就是最新版本
						version = versionMatch[2];
						isInLatestVersion = true;
						hasFoundFirstVersion = true;
						continue;
					} else {
						// 遇到第二个版本，停止收集
						break;
					}
				}

				// 如果在最新版本中，收集发布说明
				if (isInLatestVersion && line.trim()) {
					releaseNotes += line + "\n";
				}
			}

			if (!version) {
				consola.warn(`No version found in changelog: ${changelogPath}`);
				return null;
			}

			return {
				version: version.trim(),
				releaseNotes: releaseNotes.trim(),
			};
		} catch (error) {
			consola.error(`Error parsing changelog ${changelogPath}:`, error);
			return null;
		}
	}

	/**
	 * 创建或更新 GitHub Release
	 */
	private async createOrUpdateRelease(
		tagName: string,
		name: string,
		body: string,
		targetCommitish = "main",
	): Promise<void> {
		try {
			// 检查 release 是否已存在
			try {
				const { data: existingRelease } = await this.octokit.rest.repos.getReleaseByTag({
					...this.repo,
					tag: tagName,
				});

				// 如果存在，更新它
				consola.info(`Updating existing release: ${tagName}`);
				await this.octokit.rest.repos.updateRelease({
					...this.repo,
					release_id: existingRelease.id,
					name,
					body,
					draft: false,
					prerelease: false,
				});

				consola.success(`Updated GitHub release: ${tagName}`);
			} catch (error: any) {
				if (error.status === 404) {
					// 如果不存在，创建新的
					consola.info(`Creating new release: ${tagName}`);
					await this.octokit.rest.repos.createRelease({
						...this.repo,
						tag_name: tagName,
						target_commitish: targetCommitish,
						name,
						body,
						draft: false,
						prerelease: false,
					});

					consola.success(`Created GitHub release: ${tagName}`);
				} else {
					throw error;
				}
			}
		} catch (error) {
			consola.error(`Failed to create/update release ${tagName}:`, error);
			throw error;
		}
	}

	/**
	 * 从已发布的包列表同步到 GitHub Release
	 */
	async syncFromChangesets(publishedPackages: PublishedPackage[]): Promise<void> {
		if (!publishedPackages?.length) {
			consola.info("No packages were published, skipping GitHub release sync");
			return;
		}

		consola.info(`Syncing ${publishedPackages.length} published packages to GitHub Releases`);

		for (const pkg of publishedPackages) {
			try {
				consola.info(`Processing package: ${pkg.name}@${pkg.version}`);

				// 根据包名确定 CHANGELOG.md 路径
				// 假设包在 packages/ 目录下
				const packageDir = pkg.name.startsWith("@")
					? pkg.name.split("/")[1] // @scope/name -> name
					: pkg.name;

				const changelogPath = resolve(process.cwd(), "packages", packageDir, "CHANGELOG.md");

				// 解析 CHANGELOG.md
				const changelog = this.parseLatestChangelog(changelogPath);

				if (!changelog) {
					consola.warn(`Skipping ${pkg.name} - no changelog found or parsed`);
					continue;
				}

				// 验证版本一致性
				if (changelog.version !== pkg.version) {
					consola.warn(`Version mismatch for ${pkg.name}: changelog=${changelog.version}, published=${pkg.version}`);
				}

				// 创建发布信息
				const tagName = `${pkg.name}@${pkg.version}`;
				const releaseName = `${pkg.name} v${pkg.version}`;

				// 为发布说明添加包信息头部
				const releaseBody = `# ${pkg.name} v${pkg.version}\n\n${changelog.releaseNotes}`;

				// 创建或更新 GitHub Release
				await this.createOrUpdateRelease(tagName, releaseName, releaseBody);
			} catch (error) {
				consola.error(`Failed to sync package ${pkg.name}:`, error);
				// 继续处理其他包，不要因为一个包失败就停止
				continue;
			}
		}

		consola.success("GitHub release sync completed");
	}
}

/**
 * 从环境变量运行同步脚本
 */
async function runSync() {
	try {
		const token = process.env.GITHUB_TOKEN;
		const publishedPackagesJson = process.env.PUBLISHED_PACKAGES;
		const repository = process.env.GITHUB_REPOSITORY || "ruan-cat/monorepo";

		if (!token) {
			throw new Error("GITHUB_TOKEN environment variable is required");
		}

		if (!publishedPackagesJson) {
			consola.info("PUBLISHED_PACKAGES is empty, no packages to sync");
			return;
		}

		let publishedPackages: PublishedPackage[];
		try {
			publishedPackages = JSON.parse(publishedPackagesJson);
		} catch (error) {
			throw new Error(`Failed to parse PUBLISHED_PACKAGES JSON: ${error}`);
		}

		const sync = new GitHubReleaseSync({ token, repository });
		await sync.syncFromChangesets(publishedPackages);
	} catch (error) {
		consola.error("GitHub Release sync failed:", error);
		process.exit(1);
	}
}

// 如果直接运行此脚本，执行同步
if (typeof import.meta.url !== "undefined" && import.meta.url === `file://${process.argv[1]}`) {
	runSync();
}

export { runSync };
