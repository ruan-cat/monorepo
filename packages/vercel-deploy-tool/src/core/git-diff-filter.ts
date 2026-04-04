import { spawnSync } from "node:child_process";
import picomatch from "picomatch";
import { consola } from "consola";
import type { DeployTarget } from "../config/schema";

/**
 * git diff 检测结果
 * @description
 * - `string[]` - git 执行成功，返回变更文件列表（可能为空数组，表示确实无变更）
 * - `null` - git 不可用或执行失败，调用方应降级为全量部署
 */
export type ChangedFilesResult = string[] | null;

/**
 * 获取 git diff 变更的文件列表
 * @description
 * 执行 `git diff --name-only <diffBase> HEAD`，返回相对于 monorepo 根目录的变更文件路径列表。
 *
 * 返回值说明：
 * - `string[]` - git 执行成功，返回变更文件列表（空数组表示确实无变更）
 * - `null` - git 命令不可用、ref 无效或执行失败，调用方应降级为全量部署
 */
export function getChangedFiles(diffBase: string): ChangedFilesResult {
	if (!diffBase) {
		consola.warn("未提供 diffBase，无法检测变更文件，将降级为全量部署");
		return null;
	}

	const result = spawnSync("git", ["diff", "--name-only", diffBase, "HEAD"], {
		encoding: "utf-8",
	});

	if (result.error) {
		consola.warn(`git 命令不可用或执行失败: ${result.error.message}，将降级为全量部署`);
		return null;
	}

	if (result.status !== 0) {
		consola.warn(`git diff 返回非零退出码 ${result.status}，将降级为全量部署`);
		if (result.stderr?.trim()) {
			consola.warn(result.stderr.trim());
		}
		return null;
	}

	const output = result.stdout?.trim();
	if (!output) {
		return [];
	}

	return output.split("\n").filter(Boolean);
}

/** 过滤结果 */
export interface FilterResult {
	/** 需要部署的目标 */
	deploy: DeployTarget[];
	/** 跳过的目标 */
	skipped: DeployTarget[];
}

/**
 * 根据 git diff 变更文件列表过滤部署目标
 * @description
 * 对每个 DeployTarget，若配置了 watchPaths，则检查变更文件中是否有匹配 watchPaths 的文件。
 * 有匹配则纳入部署列表，无匹配则跳过。
 * 未配置 watchPaths 的目标，默认纳入部署列表（向后兼容）。
 */
export function filterTargetsByDiff(targets: DeployTarget[], changedFiles: string[]): FilterResult {
	const deploy: DeployTarget[] = [];
	const skipped: DeployTarget[] = [];

	for (const target of targets) {
		if (!target.watchPaths || target.watchPaths.length === 0) {
			deploy.push(target);
			continue;
		}

		const isMatch = picomatch(target.watchPaths);
		const hasChange = changedFiles.some((file) => isMatch(file));

		if (hasChange) {
			deploy.push(target);
		} else {
			skipped.push(target);
		}
	}

	return { deploy, skipped };
}
