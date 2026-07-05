import { execSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** 获取 skills 来源的途径 */
export type MemorixSource = "github" | "local" | "cli" | "auto";

/** 相对路径 → 文件内容 */
export type SkillFiles = Map<string, Buffer>;

/** refresh 函数的输入选项 */
export interface RefreshOptions {
	/** 目标 skills 目录，默认 ~/.agents/skills */
	targetDir?: string;
	/** Agent 平台名称，默认 "cursor" */
	agent?: string;
	/** 数据来源，默认为 "github" */
	source?: MemorixSource;
	/** GitHub 分支/Tag，默认 "v1.1.5" */
	githubRef?: string;
	/** GitHub Personal Access Token（可选） */
	githubToken?: string;
	/** GitHub raw 镜像地址（可选，用于切换国内镜像） */
	githubRawMirror?: string;
	/** 只输出计划不修改文件系统 */
	dryRun?: boolean;
	/** 强制刷新，忽略 SHA-256 比对 */
	force?: boolean;
	/** 替换前是否备份，默认 true */
	backup?: boolean;
}

/** 单个 skill 的刷新结果 */
export interface RefreshResult {
	/** skill 名称 */
	skill: string;
	/** 处理状态 */
	status: "skipped" | "created" | "updated" | "error";
	/** 实际数据来源 */
	source?: MemorixSource;
	/** 错误信息 */
	error?: string;
	/** 备份路径（仅在 backup=true 时生效） */
	backupPath?: string;
}

/** 单个 skill 的元数据 */
export interface SkillMetadata {
	/** 源文件的 SHA-256 */
	sourceSha256: string;
	/** 本地文件的 SHA-256 */
	localSha256: string;
	/** 最后更新时间（ISO 8601） */
	updatedAt: string;
	/** 数据来源 */
	source: MemorixSource;
}

/** 全局元数据文件的结构 */
export interface MemorixMetadata {
	/** 元数据格式版本 */
	version: string;
	/** 最近一次刷新的时间（ISO 8601） */
	lastRefreshAt: string;
	/** 数据来源 */
	source: MemorixSource;
	/** Agent 平台名称 */
	agent: string;
	/** skillName → SkillMetadata */
	skills: Record<string, SkillMetadata>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 默认 Agent 平台 */
export const DEFAULT_AGENT = "cursor";

/** 默认 GitHub ref */
export const DEFAULT_GITHUB_REF = "v1.1.5";

/** 默认目标 skills 目录 */
export const DEFAULT_TARGET_DIR = path.join(homedir(), ".agents", "skills");

/** 元数据存储目录 */
export const META_DIR = path.join(homedir(), ".memorix", "memorix-skills");

/** 元数据文件路径 */
export const META_FILE = path.join(META_DIR, "memorix-meta.json");

// ---------------------------------------------------------------------------
// SHA-256
// ---------------------------------------------------------------------------

/**
 * 计算 Buffer 或字符串的 SHA-256 哈希值。
 */
export function sha256(content: Buffer | string): string {
	return createHash("sha256").update(content).digest("hex");
}

// ---------------------------------------------------------------------------
// Metadata helpers
// ---------------------------------------------------------------------------

/**
 * 返回元数据文件的完整路径，目录不存在则创建。
 */
export function getMetadataPath(): string {
	if (!existsSync(META_DIR)) {
		mkdirSync(META_DIR, { recursive: true });
	}
	return META_FILE;
}

/**
 * 读取并解析元数据 JSON 文件。
 * 文件不存在或 JSON 解析失败时返回 `undefined`。
 */
export function loadMetadata(): MemorixMetadata | undefined {
	const metaPath = getMetadataPath();
	if (!existsSync(metaPath)) {
		return undefined;
	}
	try {
		const raw = readFileSync(metaPath, "utf-8");
		return JSON.parse(raw) as MemorixMetadata;
	} catch {
		return undefined;
	}
}

/**
 * 将元数据写入 JSON 文件（覆盖）。
 */
export function saveMetadata(meta: MemorixMetadata): void {
	const metaPath = getMetadataPath();
	writeFileSync(metaPath, JSON.stringify(meta, null, "\t") + "\n", "utf-8");
}

/**
 * 元数据文件损坏时将其重命名为 `.broken.<timestamp>`。
 * 可用于 `loadMetadata` 返回 `undefined` 时自动归档。
 */
export function backupBrokenMetadata(): void {
	const metaPath = getMetadataPath();
	if (existsSync(metaPath)) {
		const backupPath = `${metaPath}.broken.${Date.now()}`;
		renameSync(metaPath, backupPath);
	}
}

// ---------------------------------------------------------------------------
// GitHub source
// ---------------------------------------------------------------------------

/**
 * 通过 GitHub Content API 获取 memorix skills。
 *
 * 先列目录（名为 memorix-*），再递归下载每个 skill 目录中的全部文件。
 *
 * @param ref    GitHub 分支或 Tag
 * @param agent  Agent 平台名称
 * @param options.token  GitHub Personal Access Token（可选，提高调用限额）
 * @param options.mirror GitHub raw 镜像地址（可选，如 ghproxy.net）
 */
export async function fetchFromGitHub(
	ref: string,
	agent: string,
	options?: { token?: string; mirror?: string },
): Promise<Record<string, SkillFiles>> {
	const apiUrl = `https://api.github.com/repos/AVIDS2/memorix/contents/plugins/${agent}/memorix/skills?ref=${ref}`;
	const headers: Record<string, string> = {
		Accept: "application/vnd.github.v3+json",
		"User-Agent": "sync-local-global-agents-skills",
	};
	if (options?.token) {
		headers.Authorization = `Bearer ${options.token}`;
	}

	const response = await fetch(apiUrl, {
		headers,
		signal: AbortSignal.timeout(15000),
	});

	if (response.status !== 200) {
		throw new Error(`GitHub Content API returned ${response.status} for skills directory`);
	}

	const entries: any[] = await response.json();
	const skillDirs = entries.filter((e: any) => e.type === "dir" && e.name.startsWith("memorix-"));

	const result: Record<string, SkillFiles> = {};
	for (const dir of skillDirs) {
		result[dir.name] = await fetchTree(dir.url, "", headers, options?.mirror);
	}

	return result;
}

/**
 * 递归通过 GitHub Content API 拉取整个目录树。
 *
 * @param baseUrl  GitHub API URL（目录入口）
 * @param prefix   当前路径前缀（用于生成相对路径 key）
 * @param headers  HTTP 请求头
 * @param rawMirror  可选 raw 镜像域名，替换 raw.githubusercontent.com
 */
export async function fetchTree(
	baseUrl: string,
	prefix: string,
	headers: Record<string, string>,
	rawMirror?: string,
): Promise<SkillFiles> {
	const response = await fetch(baseUrl, {
		headers,
		signal: AbortSignal.timeout(15000),
	});

	if (response.status !== 200) {
		throw new Error(`fetchTree: API returned ${response.status} for ${baseUrl}`);
	}

	const entries: any[] = await response.json();
	const files: SkillFiles = new Map();

	for (const entry of entries) {
		const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.type === "dir") {
			const subFiles = await fetchTree(entry.url, entryPath, headers, rawMirror);
			for (const [key, value] of subFiles) {
				files.set(key, value);
			}
		} else if (entry.type === "file") {
			const downloadUrl = rawMirror
				? entry.download_url.replace("raw.githubusercontent.com", rawMirror)
				: entry.download_url;

			const fileResponse = await fetch(downloadUrl, {
				headers,
				signal: AbortSignal.timeout(15000),
			});

			if (fileResponse.status !== 200) {
				throw new Error(`Failed to download ${entryPath}: HTTP ${fileResponse.status}`);
			}

			const buffer = Buffer.from(await fileResponse.arrayBuffer());
			files.set(entryPath, buffer);
		}
	}

	return files;
}

// ---------------------------------------------------------------------------
// Local filesystem helpers
// ---------------------------------------------------------------------------

/**
 * 递归读取整个目录，返回 path → Buffer 的映射。
 *
 * @param dir    目录绝对路径
 * @param prefix 相对路径前缀，递归时自动拼接
 */
export function readDirFiles(dir: string, prefix?: string): SkillFiles {
	const files: SkillFiles = new Map();
	const entries = readdirSync(dir);

	for (const entry of entries) {
		const fullPath = path.join(dir, entry);
		const relativePath = prefix ? `${prefix}/${entry}` : entry;
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			const subFiles = readDirFiles(fullPath, relativePath);
			for (const [key, value] of subFiles) {
				files.set(key, value);
			}
		} else if (stat.isFile()) {
			files.set(relativePath, readFileSync(fullPath));
		}
	}

	return files;
}

/**
 * 读取本地 skills 目录，返回 skill 名称到文件的映射。
 *
 * 只会读取以 memorix- 开头的子目录。
 *
 * @param skillsDir skills 根目录绝对路径
 */
export function readSkillsDir(skillsDir: string): Record<string, SkillFiles> {
	if (!existsSync(skillsDir)) {
		return {};
	}

	const result: Record<string, SkillFiles> = {};
	const entries = readdirSync(skillsDir);

	for (const entry of entries) {
		const fullPath = path.join(skillsDir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory() && entry.startsWith("memorix-")) {
			result[entry] = readDirFiles(fullPath);
		}
	}

	return result;
}

// ---------------------------------------------------------------------------
// Local source scanning
// ---------------------------------------------------------------------------

/** 本地 skills 多源候选目录 */
export const LOCAL_SOURCE_CANDIDATES: string[] = [
	path.join(homedir(), ".cursor", "skills"),
	path.join(homedir(), ".codex", "plugins", "memorix", "skills"),
	path.join(homedir(), ".claude", "plugins", "marketplaces", "memorix-local", "plugins", "memorix", "skills"),
];

/** 本地来源条目 */
export interface LocalSourceEntry {
	path: string;
	mtime: number;
	skillCount: number;
}

/**
 * 递归收集目录下所有 SKILL.md 文件的最大修改时间（毫秒时间戳）。
 */
function collectMaxMtime(dir: string): number {
	let maxMtime = 0;
	try {
		const entries = readdirSync(dir);
		for (const entry of entries) {
			const fullPath = path.join(dir, entry);
			try {
				const stat = statSync(fullPath);
				if (stat.isDirectory()) {
					maxMtime = Math.max(maxMtime, collectMaxMtime(fullPath));
				} else if (stat.isFile() && entry === "SKILL.md") {
					maxMtime = Math.max(maxMtime, stat.mtimeMs);
				}
			} catch {
				// 跳过无法访问的条目
			}
		}
	} catch {
		// 跳过无法访问的目录
	}
	return maxMtime;
}

/**
 * 扫描本地候选目录，收集 memorix skills 来源信息。
 *
 * 对每个存在的目录：
 * 1. 统计 memorix-* 子目录数量
 * 2. 计算目录下所有 SKILL.md 的最新 mtime
 *
 * @returns 按 mtime 降序排列的来源列表
 */
export function scanLocalSources(): LocalSourceEntry[] {
	const results: LocalSourceEntry[] = [];

	for (const dir of LOCAL_SOURCE_CANDIDATES) {
		if (!existsSync(dir)) {
			continue;
		}

		const entries = readdirSync(dir);
		const skillCount = entries.filter((e) => {
			const fullPath = path.join(dir, e);
			try {
				return statSync(fullPath).isDirectory() && e.startsWith("memorix-");
			} catch {
				return false;
			}
		}).length;

		const mtime = collectMaxMtime(dir);

		if (skillCount > 0 || mtime > 0) {
			results.push({ path: dir, mtime, skillCount });
		}
	}

	results.sort((a, b) => b.mtime - a.mtime);
	return results;
}

/**
 * 从扫描结果中选择 mtime 最新且 skillCount > 0 的来源路径。
 *
 * @param sources scanLocalSources() 的返回值
 * @returns 最佳来源路径，无有效来源时返回 undefined
 */
export function pickLatestLocalSource(sources: LocalSourceEntry[]): string | undefined {
	const valid = sources.filter((s) => s.skillCount > 0);
	if (valid.length === 0) {
		return undefined;
	}
	return valid[0].path;
}

// ---------------------------------------------------------------------------
// CLI source
// ---------------------------------------------------------------------------

/**
 * 通过 memorix CLI 获取指定 skill 的 SKILL.md 内容。
 *
 * 执行 `memorix skills show --name "${skillName}" --json`，
 * 从返回的 JSON 中提取 `content` 字段。
 *
 * CLI 命令失败或 JSON 解析失败时返回 undefined（不抛异常，因为 CLI 是兜底源）。
 *
 * @param skillName  skill 名称（如 memorix-calendar）
 * @returns SKILL.md 文本内容，获取失败时返回 undefined
 */
export function fetchFromCli(skillName: string): string | undefined {
	try {
		const raw = execSync(`memorix skills show --name "${skillName}" --json`, {
			encoding: "utf-8",
			timeout: 15000,
		});
		const parsed = JSON.parse(raw);
		return typeof parsed.content === "string" ? parsed.content : undefined;
	} catch {
		return undefined;
	}
}

/**
 * 列出指定目录下所有以 memorix- 开头的子目录名称。
 *
 * @param skillsDir  skills 根目录绝对路径
 * @returns skill 名称数组（如 ["memorix-calendar", "memorix-notes"]）
 */
export function listSkillsFromLocal(skillsDir: string): string[] {
	if (!existsSync(skillsDir)) {
		return [];
	}

	try {
		const entries = readdirSync(skillsDir);
		return entries.filter((entry) => {
			const fullPath = path.join(skillsDir, entry);
			try {
				return statSync(fullPath).isDirectory() && entry.startsWith("memorix-");
			} catch {
				return false;
			}
		});
	} catch {
		return [];
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * 将 SkillFiles 写入目标目录。
 * 自动创建不存在的父目录，覆盖已有文件。
 */
function writeSkillFiles(targetDir: string, files: SkillFiles): void {
	if (!existsSync(targetDir)) {
		mkdirSync(targetDir, { recursive: true });
	}
	for (const [relativePath, content] of files) {
		const fullPath = path.join(targetDir, relativePath);
		const dirPath = path.dirname(fullPath);
		if (!existsSync(dirPath)) {
			mkdirSync(dirPath, { recursive: true });
		}
		writeFileSync(fullPath, content);
	}
}

// ---------------------------------------------------------------------------
// Source resolution
// ---------------------------------------------------------------------------

/**
 * 根据 RefreshOptions.source 自动解析 skills 来源。
 *
 * 支持四种模式：
 * - "github": 直接从 GitHub 拉取
 * - "local":  扫描本地候选目录，读最新来源
 * - "cli":    扫描本地获取 skill 名称，逐个通过 memorix CLI 获取
 * - "auto":   github → local → cli 链式回退
 *
 * @param opts 刷新选项
 * @returns skillName → SkillFiles 的映射
 */
export async function resolveSourceSkills(opts: RefreshOptions): Promise<Record<string, SkillFiles>> {
	const source = opts.source ?? "auto";
	const agent = opts.agent ?? DEFAULT_AGENT;
	const ref = opts.githubRef ?? DEFAULT_GITHUB_REF;

	if (source === "github") {
		return fetchFromGitHub(ref, agent, {
			token: opts.githubToken,
			mirror: opts.githubRawMirror,
		});
	}

	if (source === "local") {
		const sources = scanLocalSources();
		const localDir = pickLatestLocalSource(sources);
		if (!localDir) {
			throw new Error("无法获取 memorix skills：未找到本地 skills 目录");
		}
		return readSkillsDir(localDir);
	}

	if (source === "cli") {
		const sources = scanLocalSources();
		const localDir = pickLatestLocalSource(sources) ?? DEFAULT_TARGET_DIR;
		const skillNames = listSkillsFromLocal(localDir);
		const cliSkills: Record<string, SkillFiles> = {};
		for (const name of skillNames) {
			const content = fetchFromCli(name);
			if (content) {
				cliSkills[name] = new Map([["SKILL.md", Buffer.from(content)]]);
			}
		}
		if (Object.keys(cliSkills).length === 0) {
			throw new Error("无法获取 memorix skills：CLI 未返回任何 skill");
		}
		return cliSkills;
	}

	// auto: github → local → cli chain fallback
	try {
		return await fetchFromGitHub(ref, agent, {
			token: opts.githubToken,
			mirror: opts.githubRawMirror,
		});
	} catch {
		// fall through to local
	}

	const localDir = pickLatestLocalSource(scanLocalSources());
	if (localDir) {
		return readSkillsDir(localDir);
	}

	const skillNames = listSkillsFromLocal(localDir ?? DEFAULT_TARGET_DIR);
	const cliSkills: Record<string, SkillFiles> = {};
	for (const name of skillNames) {
		const content = fetchFromCli(name);
		if (content) {
			cliSkills[name] = new Map([["SKILL.md", Buffer.from(content)]]);
		}
	}
	if (Object.keys(cliSkills).length > 0) {
		return cliSkills;
	}

	throw new Error("无法获取 memorix skills：所有来源均失败");
}

// ---------------------------------------------------------------------------
// Single skill refresh
// ---------------------------------------------------------------------------

/**
 * 刷新单个 skill：SHA 比对、dry-run、force 覆盖与备份。
 *
 * @param skillName   skill 名称（如 memorix-calendar）
 * @param sourceFiles 来源文件映射
 * @param opts        刷新选项
 * @param metadata    当前元数据（有则参与 SHA 比对和更新）
 * @returns 刷新结果
 */
export function refreshSkill(
	skillName: string,
	sourceFiles: SkillFiles,
	opts: RefreshOptions,
	metadata: MemorixMetadata | undefined,
): RefreshResult {
	const skillTargetDir = path.join(opts.targetDir ?? DEFAULT_TARGET_DIR, skillName);

	// Compute SHA-256 of all source files (sorted by path for determinism)
	const sorted: { p: string; c: Buffer }[] = [];
	for (const [relativePath, content] of sourceFiles) {
		sorted.push({ p: relativePath, c: content });
	}
	sorted.sort((a, b) => a.p.localeCompare(b.p));
	const parts: Buffer[] = [];
	for (const { p, c } of sorted) {
		parts.push(Buffer.from(p, "utf-8"));
		parts.push(c);
	}
	const sourceSha = sha256(Buffer.concat(parts));

	// Already up-to-date?
	const existingMeta = metadata?.skills[skillName];
	if (existingMeta && existingMeta.sourceSha256 === sourceSha) {
		return { skill: skillName, status: "skipped" };
	}

	const source = (opts.source ?? "auto") as MemorixSource;

	// dryRun: report only
	if (opts.dryRun) {
		const status = existsSync(skillTargetDir) ? "updated" : "created";
		return { skill: skillName, status, source };
	}

	// Target exists and has changes
	if (existsSync(skillTargetDir)) {
		if (!opts.force) {
			return { skill: skillName, status: "updated", source };
		}

		// force: backup then overwrite
		let backupPath: string | undefined;
		if (opts.backup !== false) {
			backupPath = `${skillTargetDir}.bak.${Date.now()}-${randomUUID()}`;
			renameSync(skillTargetDir, backupPath);
		} else {
			rmSync(skillTargetDir, { recursive: true, force: true });
		}

		writeSkillFiles(skillTargetDir, sourceFiles);

		if (metadata) {
			metadata.skills[skillName] = {
				sourceSha256: sourceSha,
				localSha256: sourceSha,
				updatedAt: new Date().toISOString(),
				source,
			};
		}

		return { skill: skillName, status: "updated", source, backupPath };
	}

	// Target doesn't exist: create
	writeSkillFiles(skillTargetDir, sourceFiles);

	if (metadata) {
		metadata.skills[skillName] = {
			sourceSha256: sourceSha,
			localSha256: sourceSha,
			updatedAt: new Date().toISOString(),
			source,
		};
	}

	return { skill: skillName, status: "created", source };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * 主入口：加载元数据 → 解析来源 → 逐个刷新 skill → 汇总结果 → 保存元数据。
 *
 * @param opts 刷新选项
 * @returns 所有 skill 的刷新结果数组
 */
export async function refreshMemorixSkills(opts: RefreshOptions = {}): Promise<RefreshResult[]> {
	let metadata = loadMetadata();
	if (!metadata) {
		metadata = {
			version: "1.0.0",
			lastRefreshAt: new Date().toISOString(),
			source: (opts.source ?? "auto") as MemorixSource,
			agent: opts.agent ?? DEFAULT_AGENT,
			skills: {},
		};
	}

	const sourceFiles = await resolveSourceSkills(opts);

	const results: RefreshResult[] = [];
	for (const [skillName, files] of Object.entries(sourceFiles)) {
		const result = refreshSkill(skillName, files, opts, metadata);
		results.push(result);
	}

	if (!opts.dryRun) {
		metadata.lastRefreshAt = new Date().toISOString();
		metadata.source = (opts.source ?? "auto") as MemorixSource;
		metadata.agent = opts.agent ?? DEFAULT_AGENT;
		saveMetadata(metadata);
	}

	return results;
}
