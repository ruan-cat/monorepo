import { existsSync, lstatSync, mkdirSync, readlinkSync, renameSync, rmSync, symlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import type { AgentPlatform } from "./platforms.ts";

/** 同步选项 */
export interface SyncOptions {
	/** 只输出计划，不修改文件系统 */
	dryRun?: boolean;
	/** 替换真实目录前是否备份，默认 true */
	backup?: boolean;
}

/** 单个平台的同步结果 */
export interface SyncResult {
	/** 平台名称 */
	platform: string;
	/** 目标 skills 目录 */
	skillsDir: string;
	/** 处理状态 */
	status: "skipped" | "created" | "replaced" | "error";
	/** 被替换前的类型 */
	previousType?: "directory" | "symlink" | "file";
	/** 备份路径（仅 previousType=directory 且 backup=true） */
	backupPath?: string;
	/** 错误信息 */
	error?: string;
}

/**
 * 将 sourceDir 作为目录级符号链接同步到多个平台的 skills 目录。
 *
 * @param sourceDir - 源 skills 目录绝对路径
 * @param platforms - 目标平台列表
 * @param options - 同步选项
 * @returns 每个平台的处理结果
 */
export function syncSkills(sourceDir: string, platforms: AgentPlatform[], options: SyncOptions = {}): SyncResult[] {
	const { dryRun = false, backup = true } = options;

	if (!existsSync(sourceDir)) {
		throw new Error(`Source directory does not exist: ${sourceDir}`);
	}

	const sourceStat = lstatSync(sourceDir);
	if (!sourceStat.isDirectory()) {
		throw new Error(`Source path is not a directory: ${sourceDir}`);
	}

	return platforms.map((platform) => syncPlatform(sourceDir, platform, { dryRun, backup }));
}

function syncPlatform(
	sourceDir: string,
	platform: AgentPlatform,
	options: { dryRun: boolean; backup: boolean },
): SyncResult {
	const result: SyncResult = {
		platform: platform.name,
		skillsDir: platform.skillsDir,
		status: "skipped",
	};

	try {
		const parentDir = dirname(platform.skillsDir);

		if (!existsSync(parentDir)) {
			if (!options.dryRun) {
				mkdirSync(parentDir, { recursive: true });
			}
		}

		if (!existsSync(platform.skillsDir)) {
			if (!options.dryRun) {
				createDirLink(sourceDir, platform.skillsDir);
			}
			result.status = "created";
			return result;
		}

		const stat = lstatSync(platform.skillsDir);

		if (stat.isSymbolicLink()) {
			const target = readlinkSync(platform.skillsDir);
			if (target === sourceDir) {
				result.status = "skipped";
				return result;
			}
			result.previousType = "symlink";
			if (!options.dryRun) {
				rmSync(platform.skillsDir);
				createDirLink(sourceDir, platform.skillsDir);
			}
			result.status = "replaced";
			return result;
		}

		if (stat.isDirectory()) {
			result.previousType = "directory";
			if (!options.dryRun) {
				if (options.backup) {
					const backupPath = `${platform.skillsDir}.bak.${Date.now()}-${randomUUID()}`;
					renameSync(platform.skillsDir, backupPath);
					result.backupPath = backupPath;
				} else {
					rmSync(platform.skillsDir, { recursive: true, force: true });
				}
				createDirLink(sourceDir, platform.skillsDir);
			}
			result.status = "replaced";
			return result;
		}

		// Regular file: remove and create symlink (no backup needed)
		result.previousType = "file";
		if (!options.dryRun) {
			rmSync(platform.skillsDir);
			createDirLink(sourceDir, platform.skillsDir);
		}
		result.status = "replaced";
		return result;
	} catch (error) {
		result.status = "error";
		result.error = error instanceof Error ? error.message : String(error);
		return result;
	}
}

/**
 * 创建目录级符号链接。
 * Windows 优先使用原生目录 symlink（lrwxrwxrwx 形式），
 * 权限不足时 fallback 到 junction。
 */
function createDirLink(target: string, linkPath: string): void {
	if (process.platform === "win32") {
		try {
			symlinkSync(target, linkPath, "dir");
			return;
		} catch (error) {
			if (isPermissionError(error)) {
				symlinkSync(target, linkPath, "junction");
				return;
			}
			throw error;
		}
	}

	symlinkSync(target, linkPath, "dir");
}

function isPermissionError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}
	const code = (error as NodeJS.ErrnoException).code;
	return code === "EPERM" || code === "EACCES";
}
