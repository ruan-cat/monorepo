export * from "./commit-types.ts";
export * from "./common-scopes.ts";
export * from "./config.ts";
export * from "./utils.ts";
export * from "./type.ts";
import { getPackagesNameAndDescription } from "./utils.ts";
import type { ScopesTypeItem } from "./utils.ts";

import { consola } from "consola";
import { isNil, isPlainObject, isEqual, concat, uniqWith, cloneDeep } from "lodash";

import { config as defaultUserCommitlintConfig } from "./config.ts";
import { isConditionsEvery } from "@ruan-cat/utils/node-cjs";

import { type ScopesType, UserConfig } from "cz-git";
export type { ScopesType };

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

type GetUserConfigParams = {
	/** 用户提供的范围配置 */
	userScopes?: UserScopesItem[];
	config?: {
		/**
		 * 是否打印范围？
		 * @default true 默认打印 提示用户可以使用的提交范围有哪些
		 */
		isPrintScopes?: boolean;
	};
};

/**
 * 获取用户配置
 * @description
 * 可以根据用户提供的范围，补充范围配置
 *
 * 其范围配置数组，默认排序到最前面，其次才是自动识别到包范围。
 */
export function getUserConfig(params: GetUserConfigParams = {}) {
	const {
		userScopes = defScopes,
		config = {
			isPrintScopes: true,
		},
	} = params;
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

	if (config?.isPrintScopes === true) {
		consola.box(scopes);
		consola.success(` 可用的提交范围如下： `);
	}

	// 用户配置
	const userConfig = defExportCommitlintConfig;

	// 设置范围
	setScopesInUserConfig({ scopes, userConfig });

	return userConfig;
}

const defExportCommitlintConfig = cloneDeep(defaultUserCommitlintConfig);
setScopesInUserConfig({ scopes: defScopes, userConfig: defExportCommitlintConfig });
export default defExportCommitlintConfig;
