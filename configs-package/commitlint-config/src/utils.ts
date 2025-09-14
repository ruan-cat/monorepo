import { commitTypes } from "./commit-types.ts";
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
export function createPackagescopes(packageJson: PackageJson) {
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
 * 获取所有提交类型
 * @description
 * 获取所有提交类型，用于 commitlint 的 `type-enum` 规则
 * @returns 返回提交类型数组
 */
export function getTypes() {
	return commitTypes.map((commitType) => commitType.type);
}

/**
 * 获取所有提交范围
 * @description
 * 获取所有提交范围，用于 commitlint 的 `scope-enum` 规则
 * @returns 返回提交范围数组
 */
export function getScopes() {
	return getPackagesNameAndDescription().map(
		(scope) =>
			// 优先从 value 取值，如果 value 不存在，则从 name 取值。 value 才是包名，才是 scope 提交范围。
			scope.value ?? scope.name,
	);
}
