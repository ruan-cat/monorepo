import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
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
