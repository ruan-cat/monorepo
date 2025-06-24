import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { sync } from "glob";
import { load } from "js-yaml";
import { consola } from "consola";
import { isNil, isUndefined, isPlainObject, isEqual, concat, uniqWith, cloneDeep } from "lodash";

import { config } from "./config.ts";
import { pathChange, isConditionsEvery } from "@ruan-cat/utils/node-cjs";

import { type PackageJson } from "pkg-types";
import { type ScopesType, UserConfig } from "cz-git";
export type { ScopesType };

import { type PnpmWorkspace } from "@ruan-cat/utils";

/**
 * ScopesType 的数组配置项
 * @description
 * 为了约束配置范围
 */
export type ScopesTypeItem = Exclude<ScopesType[number], string>;

import type { ScopesItemWithDesc } from "./common-scopes.ts";
export type { ScopesItemWithDesc } from "./common-scopes.ts";

import { commonScopes } from "./common-scopes.ts";

/**
 * 用户配置项
 * @description
 * 可以是 ScopesTypeItem 或 ScopesItemWithDesc
 */
export type UserScopesItem = ScopesTypeItem | ScopesItemWithDesc;

function isScopesTypeItem(item: UserScopesItem): item is ScopesTypeItem {
	return isConditionsEvery([
		//
		() => !isNil(item),
		() => isPlainObject(item),
		() => Object.hasOwn(item, "name"),
	]);
}

function isScopesItemWithDesc(item: UserScopesItem): item is ScopesItemWithDesc {
	return isConditionsEvery([
		() => !isNil(item),
		() => isPlainObject(item),
		() => Object.hasOwn(item, "code"),
		() => Object.hasOwn(item, "value"),
		() => Object.hasOwn(item, "desc"),
	]);
}

function ScopesItemWithDesc_To_ScopesTypeItem(item: ScopesItemWithDesc): ScopesTypeItem {
	return {
		name: `${item.code} | ${item.desc}`,
		value: item.value,
	};
}

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
	userScopes?: UserScopesItem[],
) {
	const item = userScopes?.[0];

	/** ScopesTypeItem 类型的 用户配置 */
	let userScopesInScopesTypeItem: ScopesTypeItem[] = [];

	/** 判断传递的参数类型 并做出类型转换 */
	if (!isNil(item)) {
		if (isScopesTypeItem(item)) {
			// 如果是 ScopesTypeItem 类型，直接使用
			userScopesInScopesTypeItem = userScopes as ScopesTypeItem[];
		} else if (isScopesItemWithDesc(item)) {
			// 如果是 ScopesItemWithDesc 类型，转换为 ScopesTypeItem
			userScopesInScopesTypeItem = userScopes.map<ScopesTypeItem>(ScopesItemWithDesc_To_ScopesTypeItem);
		} else {
			throw new Error("userScopes 的类型不正确，请检查配置。");
		}
	}

	/** ScopesTypeItem 类型的 常用配置 */
	const commonScopesInScopesTypeItem = commonScopes.map<ScopesTypeItem>(ScopesItemWithDesc_To_ScopesTypeItem);

	/** 初始化包范围的配置 */
	const initScopes = getInitScopes();

	/** 最终使用的 合并后的范围 */
	const scopes = uniqWith(
		// 去重
		concat(
			// 合并
			[] as ScopesTypeItem[],
			initScopes,
			commonScopesInScopesTypeItem,
			userScopesInScopesTypeItem,
		),
		// 用对象判断的方式 判断去重
		isEqual,
	);

	consola.success(` 可用的提交范围如下： `);
	consola.box(scopes);

	// 用户配置
	const userConfig = config;

	// 设置范围
	setScopesInUserConfig({ scopes, userConfig });

	return userConfig;
}

const defCommitlintConfig = cloneDeep(config);
setScopesInUserConfig({ scopes: defScopes, userConfig: defCommitlintConfig });
export default defCommitlintConfig;

// export default getUserConfig([defScopes[0]]);
