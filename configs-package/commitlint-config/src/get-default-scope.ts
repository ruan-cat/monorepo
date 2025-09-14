import { join } from "node:path";
import * as fs from "node:fs";
import { sync } from "glob";
import { minimatch } from "minimatch";
import { load } from "js-yaml";
import { isUndefined } from "lodash-es";
import { type PnpmWorkspace } from "@ruan-cat/utils";
import { type PackageJson } from "pkg-types";

import { createPackagescopes } from "./utils.ts";
import { commonScopes } from "./common-scopes.ts";

import { execSync } from "node:child_process";
import consola from "consola";

/**
 * 获取包路径到范围值的映射关系
 */
function getPackagePathToScopeMapping(): Map<string, string> {
	const mapping = new Map<string, string>();

	// 读取 pnpm-workspace.yaml 文件
	const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");

	if (!fs.existsSync(workspaceConfigPath)) {
		// 如果没有workspace配置，添加默认的root映射
		mapping.set("", "root");
		return mapping;
	}

	const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");
	const workspaceConfig = <PnpmWorkspace>load(workspaceFile);
	const pkgPatterns = workspaceConfig.packages;

	if (isUndefined(pkgPatterns)) {
		mapping.set("", "root");
		return mapping;
	}

	// 根据每个模式匹配相应的目录
	pkgPatterns.forEach((pkgPattern) => {
		const globPattern = `${pkgPattern}/package.json`;
		const matchedPaths = sync(globPattern, {
			cwd: process.cwd(),
			ignore: "**/node_modules/**",
		});

		matchedPaths.forEach((relativePkgPath) => {
			const fullPkgJsonPath = join(process.cwd(), relativePkgPath);
			if (fs.existsSync(fullPkgJsonPath)) {
				const pkgJson = <PackageJson>JSON.parse(fs.readFileSync(fullPkgJsonPath, "utf-8"));
				const scope = createPackagescopes(pkgJson);

				// 获取包的目录路径（移除 package.json）
				const packageRelativePath = relativePkgPath.replace(/[/\\]package\.json$/, "").replace(/\\/g, "/");

				mapping.set(packageRelativePath, scope);
			}
		});
	});

	// 添加根目录映射
	mapping.set("", "root");

	return mapping;
}

/**
 * 根据 git 状态，获取默认的提交范围
 * @description
 * 1. 从 getPackagesNameAndDescription 获取所有包信息
 * 2. 从 git status --porcelain 获取修改的文件路径
 * 3. 匹配被修改的包范围，返回这些范围
 * @see https://cz-git.qbb.sh/zh/recipes/default-scope
 * @returns 返回被修改的包范围数组，如果只有一个则返回字符串
 */
export function getDefaultScope(): string | string[] | undefined {
	try {
		// 1. 获取包路径到范围的映射
		const pathToScopeMapping = getPackagePathToScopeMapping();
		// consola.warn("pathToScopeMapping", pathToScopeMapping);

		// 2. 获取 git 修改的文件列表
		const gitStatusOutput = execSync("git status --porcelain || true").toString().trim();

		if (!gitStatusOutput) {
			consola.info("没有检测到文件修改");
			return undefined;
		}

		// 3. 解析修改的文件路径
		const modifiedFiles = gitStatusOutput
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.map((line) => {
				// git status --porcelain 格式：XY filename
				// 提取文件名（跳过前两个状态字符和空格）
				return line.substring(3);
			})
			.filter((filePath) => filePath.length > 0);

		// 美化输出修改的文件列表
		const filesText = modifiedFiles.map((file, index) => `${index + 1}. ${file}`).join("\n");
		console.info(`检测到 ${modifiedFiles.length} 个修改的文件:\n`);
		consola.box(`\n${filesText}`);

		// 4. 匹配文件路径到包范围
		const affectedScopes = new Set<string>();

		modifiedFiles.forEach((filePath) => {
			let matchedScope = "root"; // 默认为root范围
			let maxMatchLength = 0;

			// 找到最长匹配的包路径
			for (const [packagePath, scope] of pathToScopeMapping.entries()) {
				if (packagePath === "") {
					// 空路径代表根目录，优先级最低
					continue;
				}

				// 检查文件是否在这个包目录下
				const normalizedPackagePath = packagePath.replace(/\\/g, "/");
				const normalizedFilePath = filePath.replace(/\\/g, "/");

				if (
					normalizedFilePath.startsWith(normalizedPackagePath + "/") ||
					normalizedFilePath === normalizedPackagePath
				) {
					// 选择最长匹配的路径（最具体的包）
					if (packagePath.length > maxMatchLength) {
						maxMatchLength = packagePath.length;
						matchedScope = scope;
					}
				}
			}

			// 添加基于包路径匹配的范围
			affectedScopes.add(matchedScope);

			// 新增：基于 commonScopes 的 glob 匹配
			const normalizedFilePath = filePath.replace(/\\/g, "/");
			commonScopes.forEach((scopeItem) => {
				// 检查是否存在 glob 字段
				if (scopeItem.glob && scopeItem.glob.length > 0) {
					// 遍历每个 glob 模式
					scopeItem.glob.forEach((globPattern) => {
						// 使用 minimatch 进行 glob 匹配
						if (minimatch(normalizedFilePath, globPattern)) {
							// 匹配成功，添加该范围的 value 到集合中
							affectedScopes.add(scopeItem.value);
						}
					});
				}
			});
		});

		const scopesArray = Array.from(affectedScopes);
		// 美化输出影响的包范围
		const scopesText = scopesArray.map((scope, index) => `${index + 1}. ${scope}`).join("\n");
		consola.box(`影响的包范围:\n\n${scopesText}`);

		// 5. 返回结果
		if (scopesArray.length === 0) {
			return undefined;
		} else if (scopesArray.length === 1) {
			return scopesArray[0];
		} else {
			return scopesArray;
		}
	} catch (error) {
		consola.error("获取默认范围时出错:", error);
		return undefined;
	}
}
