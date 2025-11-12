import { join } from "node:path";
import * as fs from "node:fs";
import { sync } from "glob";
import { minimatch } from "minimatch";
import { load } from "js-yaml";
import { isUndefined } from "lodash-es";
import { type PackageJson } from "pkg-types";
import { type PnpmWorkspace } from "@ruan-cat/utils";

// 注意 整个 commitlint-config 包都是使用 cjs 的语法，所以需要使用 node-cjs 的语法
import { printList } from "@ruan-cat/utils/node-cjs";

import { createPackagescopes, isMonorepoProject } from "./utils.ts";
import { commonScopes } from "./common-scopes.ts";

import { execSync } from "node:child_process";
import consola from "consola";

/**
 * 解析 git status --porcelain 输出，提取暂存区文件路径
 * @description
 * 1. 按行分割输出
 * 2. 过滤空行
 * 3. 只保留暂存区文件（第一个字符不是空格且不是?）
 * 4. 提取文件路径（从第3个字符开始）
 * @param gitStatusOutput - git status --porcelain 命令的输出
 * @returns 暂存区文件路径数组
 */
export function parseGitStatusOutput(gitStatusOutput: string): string[] {
	return gitStatusOutput
		.split("\n")
		.filter((line) => line.length > 0)
		.filter((line) => {
			// git status --porcelain 格式：XY filename
			// X: 索引状态（暂存区），Y: 工作目录状态
			// 只处理暂存区的文件（第一个字符不是空格且不是?）
			const indexStatus = line[0];
			return indexStatus !== " " && indexStatus !== "?";
		})
		.map((line) => {
			// git status --porcelain 格式：XY filename
			// 从第3个字符开始是文件名，但需要去掉可能的前导空格
			let filePath = line.substring(2).trim();
			return filePath;
		})
		.filter((filePath) => filePath.length > 0);
}

/**
 * 获取包路径到范围值的映射关系
 */
function getPackagePathToScopeMapping(): Map<string, string> {
	const mapping = new Map<string, string>();

	// 判断是否是 monorepo 项目
	if (!isMonorepoProject()) {
		// 如果不是 monorepo，不添加默认映射，依赖 glob 匹配来确定范围
		return mapping;
	}

	// 读取 pnpm-workspace.yaml 文件
	const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");
	const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");
	const workspaceConfig = <PnpmWorkspace>load(workspaceFile);

	/**
	 * packages配置 包的匹配语法
	 * @description
	 * 此时已经通过 isMonorepoProject() 验证，packages 一定存在且有效
	 */
	const pkgPatterns = workspaceConfig.packages!;

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

	// 不再默认添加根目录映射，root 范围应该通过 glob 匹配来确定

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
		const gitStatusOutput = execSync("git status --porcelain || true").toString();
		// printList({
		// 	title: (files) => `输出 git status --porcelain || true 命令的输出:`,
		// 	stringList: gitStatusOutput.split("\n"),
		// });

		if (!gitStatusOutput) {
			consola.info("没有检测到文件修改");
			return undefined;
		}

		// 3. 解析修改的文件路径
		const modifiedFiles = parseGitStatusOutput(gitStatusOutput);
		// 输出修改的文件列表
		printList({
			title: (files) => `输出 ${files.length} 个暂存区文件路径:`,
			stringList: modifiedFiles,
		});

		// 4. 匹配文件路径到包范围
		const affectedScopes = new Set<string>();

		modifiedFiles.forEach((filePath) => {
			let matchedScope: string | undefined = undefined; // 不设置默认值，只有真正匹配时才设置
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

			// 只有当真正匹配到包路径时才添加范围
			if (matchedScope !== undefined) {
				affectedScopes.add(matchedScope);
			}

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

		// 5. 返回结果
		if (scopesArray.length === 0) {
			consola.info("本次修改没有影响任何包范围");
			return undefined;
		} else if (scopesArray.length === 1) {
			return scopesArray[0];
		} else {
			// 输出影响的包范围
			printList({
				title: "影响的包范围:",
				stringList: scopesArray,
			});
			return scopesArray;
		}
	} catch (error) {
		consola.error("获取默认范围时出错:", error);
		return undefined;
	}
}
