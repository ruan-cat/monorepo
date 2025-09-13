import { commitTypes } from "./commit-types.ts";
import { execSync } from "node:child_process";
import consola from "consola";
import { join } from "node:path";
import * as fs from "node:fs";
import { sync } from "glob";
import { load } from "js-yaml";
import { isUndefined } from "lodash";
import { pathChange } from "@ruan-cat/utils/node-cjs";
import { type PackageJson } from "pkg-types";
import { type PnpmWorkspace } from "@ruan-cat/utils";
import { type ScopesType } from "cz-git";

export type ScopesTypeItem = Exclude<ScopesType[number], string>;

const defScopes: ScopesTypeItem[] = [
	{
		name: "root | 根目录",
		value: "root",
	},
	{
		name: "utils | 工具包",
		value: "utils",
	},
	{
		name: "demo | 测试项目",
		value: "demo",
	},
];

/**
 * 创建标签名称
 */
function createLabelName(packageJson: PackageJson) {
	const { name, description } = packageJson;
	const noneDesc = `该依赖包没有描述。`;
	const desc = isUndefined(description) ? noneDesc : description;
	return `${name ?? "bug：极端情况，这个包没有配置name名称"}    >>|>>    ${desc}`;
}

/**
 * 创建包范围取值
 */
function createPackagescopes(packageJson: PackageJson) {
	const { name } = packageJson;
	const names = name?.split("/");
	/**
	 * 含有业务名称的包名
	 * @description
	 * 如果拆分的数组长度大于1 说明包是具有前缀的。取用后面的名称。
	 *
	 * 否则包名就是单纯的字符串，直接取用即可。
	 */
	// @ts-ignore 默认 name 名称总是存在的 不做undefined校验
	const packageNameWithBusiness = names?.length > 1 ? names?.[1] : names?.[0];
	return `${packageNameWithBusiness}`;
}

/**
 * 根据 pnpm-workspace.yaml 配置的monorepo有意义的包名，获取包名和包描述
 * @description
 * 根据 pnpm-workspace.yaml 配置的monorepo有意义的包名，获取包名和包描述
 */
export function getPackagesNameAndDescription() {
	// 读取 pnpm-workspace.yaml 文件 文件路径
	const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");

	// 检查文件是否存在 如果文件不存在 返回默认的scopes
	if (!fs.existsSync(workspaceConfigPath)) {
		return defScopes;
	}

	// 获取文件
	const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");

	/**
	 * pnpm-workspace.yaml 的配置
	 */
	const workspaceConfig = <PnpmWorkspace>load(workspaceFile);

	/**
	 * packages配置 包的匹配语法
	 */
	const pkgPatterns = workspaceConfig.packages;

	// 如果没查询到packages配置，返回默认的scopes
	if (isUndefined(pkgPatterns)) {
		return defScopes;
	}

	/**
	 * 全部的 package.json 文件路径
	 */
	let pkgPaths: string[] = [];

	// 根据每个模式匹配相应的目录
	pkgPatterns.map((pkgPattern) => {
		// 在进程运行的根目录下，执行匹配。 一般来说是项目的根目录
		const matchedPath = pathChange(join(process.cwd(), pkgPattern, "package.json"));

		const matchedPaths = sync(matchedPath, {
			ignore: "**/node_modules/**",
		});

		// 找到包路径，就按照顺序逐个填充准备
		pkgPaths = pkgPaths.concat(...matchedPaths);
		return matchedPaths;
	});

	// console.log("pkgPaths :>> ", pkgPaths);

	const czGitScopesType = pkgPaths.map(function (pkgJsonPath) {
		// 如果确实存在该文件，就处理。否则不管了。
		if (fs.existsSync(pkgJsonPath)) {
			/**
			 * 包配置文件数据
			 */
			const pkgJson = <PackageJson>JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
			return <ScopesTypeItem>{
				// 标签名称 对外展示的标签名称
				name: createLabelName(pkgJson),
				// 取值
				value: createPackagescopes(pkgJson),
			};
		}

		return <ScopesTypeItem>{
			name: "警告，没找到包名，请查看这个包路径是不是故障了：",
			value: "pkgJsonPath",
		};
	});

	// console.log("czGitScopesType :>> ", czGitScopesType);

	return czGitScopesType;
}

/**
 * 将 commitTypes 转换为 cz-git 格式
 * @description
 * 将内部定义的 CommitType 数组转换为 cz-git 库所需的格式，
 *
 * 并实现描述文本的智能对齐，确保提交类型选择界面的美观性
 * @returns  包含 value 和 name 字段的对象数组，用于 cz-git 配置
 */
export function convertCommitTypesToCzGitFormat() {
	// 找到最长的 type 长度
	const maxTypeLength = Math.max(...commitTypes.map((commitType) => commitType.type.length));

	return commitTypes.map((commitType) => {
		// 计算当前 type 需要的空格数来对齐
		const spacesNeeded = maxTypeLength - commitType.type.length + 5; // 5 是基础空格数
		const spaces = " ".repeat(spacesNeeded);

		return {
			value: `${commitType.emoji} ${commitType.type}`,
			name: `${commitType.emoji} ${commitType.type}:${spaces}${commitType.description}`,
		};
	});
}

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

		consola.info(`检测到 ${modifiedFiles.length} 个修改的文件:`, modifiedFiles);

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

			affectedScopes.add(matchedScope);
		});

		const scopesArray = Array.from(affectedScopes);
		consola.info(`影响的包范围:`, scopesArray);

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
