import { join } from "node:path";
import * as fs from "node:fs";
import { globSync } from "tinyglobby";
import { load } from "js-yaml";
import { isUndefined } from "lodash-es";
import type { PnpmWorkspace } from "./types/pnpm-workspace.yaml.shim";

/**
 * 路径转换工具
 * @private 暂时不考虑复用
 */
function pathChange(path: string) {
	return path.replace(/\\/g, "/");
	// FIXME: 无法有效地实现解析路径 测试用例不通过
	// return normalize(path);
	// FIXME: tsup打包时，无法处理好vite的依赖 会导致打包失败 不知道怎么单独使用并打包该函数
	// return normalizePath(path);
}

/**
 * 判断目标项目是否是 monorepo 格式的项目
 * @description
 * 判别逻辑：
 * 1. 目标项目同时存在 `pnpm-workspace.yaml` 文件
 * 2. `pnpm-workspace.yaml` 提供了有效的 packages 匹配配置
 * 3. 至少能匹配到一个 package.json 文件
 *
 * @returns {boolean} 是否是 monorepo 项目
 * @throws {Error} 当 pnpm-workspace.yaml 格式错误时抛出错误
 */
export function isMonorepoProject(): boolean {
	// 1. 检查 pnpm-workspace.yaml 是否存在
	const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");
	if (!fs.existsSync(workspaceConfigPath)) {
		return false;
	}

	// 2. 解析 YAML 文件
	let workspaceConfig: PnpmWorkspace;
	try {
		const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");
		workspaceConfig = <PnpmWorkspace>load(workspaceFile);
	} catch (error) {
		throw new Error(
			`解析 pnpm-workspace.yaml 文件失败，请检查文件格式是否正确。错误信息：${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// 3. 检查 packages 配置是否存在且不为空数组
	const pkgPatterns = workspaceConfig.packages;
	if (isUndefined(pkgPatterns) || pkgPatterns.length === 0) {
		return false;
	}

	// 4. 检查是否至少能匹配到一个 package.json
	for (const pkgPattern of pkgPatterns) {
		const matchedPath = pathChange(join(process.cwd(), pkgPattern, "package.json"));
		const matchedPaths = globSync(matchedPath, {
			ignore: ["**/node_modules/**"],
		});

		// 只要有一个模式能匹配到文件，就认为是有效的 monorepo
		if (matchedPaths.length > 0) {
			return true;
		}
	}

	// 没有匹配到任何 package.json
	return false;
}
