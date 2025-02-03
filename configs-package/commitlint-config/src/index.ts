import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { sync } from "glob";
import { load } from "js-yaml";
import { isUndefined } from "lodash";

import { config } from "./config.ts";

import { type PackageJson } from "pkg-types";
import { type ScopesType, UserConfig } from "cz-git";
import { type PnpmWorkspace } from "@ruan-cat/utils/src/types/pnpm-workspace.yaml.shim.ts";

/**
 * ScopesType 的数组配置项
 * @description
 * 为了约束配置范围
 */
type ScopesTypeItem = Exclude<ScopesType[number], string>;

export type { ScopesType, ScopesTypeItem };

const defScopes = <ScopesTypeItem[]>[
	{
		name: "root|根目录",
		value: "root",
	},
	{
		name: "utils|工具包",
		value: "utils",
	},
	{
		name: "demo|测试项目",
		value: "demo",
	},
];

/**
 * 路径转换工具
 */
function pathChange(path: string) {
	return path.replace(/\\/g, "/");
}

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
function getPackagesNameAndDescription() {
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
		// const matchedPath = pathChange(join(__dirname, pkgPattern, "package.json"));
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
 * 获得初始化后的 scopes 范围数组
 */
function getInitScopes() {
	let scopes = defScopes;
	scopes = getPackagesNameAndDescription();
	return scopes;
}

/**
 * 在用户配置内设置范围
 */
function setScopesInUserConfig(params: { scopes: ScopesType; userConfig: UserConfig }) {
	const { scopes, userConfig } = params;
	userConfig.prompt.scopes = scopes;
}

/**
 * 获取用户配置
 * @description
 * 可以根据用户提供的范围，补充范围配置
 *
 * 其范围配置数组，默认排序到最前面，其次才是自动识别到包范围。
 */
export function getUserConfig(
	/** 用户提供的范围配置 */
	userScopes?: ScopesTypeItem[],
) {
	// 初始化范围
	const scopes = [...(userScopes ?? []), ...getInitScopes()];

	// 用户配置
	const userConfig = config;

	// 设置范围
	setScopesInUserConfig({ scopes, userConfig });

	return userConfig;
}

export default getUserConfig([{ name: "root|根目录", value: "root" }]);
