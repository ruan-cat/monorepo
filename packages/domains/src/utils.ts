import { type ProjectName, type ProjectLikeDomainWithoutProjectName } from "./types.ts";
import { projectLikeDomainSet } from "./domains.ts";
import { consola } from "consola";

/** 获取域名的参数接口（带别名） */
export interface GetDomainsParamsWithAlias {
	/** 项目名称 */
	projectName: ProjectName;

	/** 项目别名 */
	projectAlias?: string;
}

/**
 * 将域名配置转换为完整的域名字符串
 * @param domain 域名配置对象
 * @returns 完整的域名字符串
 */
function formatDomain(domain: ProjectLikeDomainWithoutProjectName): string {
	const { secondLevelDomain, topLevelDomain } = domain;
	return `${secondLevelDomain}.${topLevelDomain}`;
}

/**
 * 将域名配置数组转换为域名字符串数组
 * @param domains 域名配置数组
 * @returns 域名字符串数组
 */
function formatDomains(domains: ProjectLikeDomainWithoutProjectName[]): string[] {
	return domains.map(formatDomain);
}

/** 根据项目名称获取域名数组 */
export function getDomains(projectName: ProjectName): string[];
/** 根据项目名称和别名获取域名数组 */
export function getDomains(params: GetDomainsParamsWithAlias): string[];
export function getDomains(paramsOrProjectName: ProjectName | GetDomainsParamsWithAlias): string[] {
	// 统一参数格式
	const params: GetDomainsParamsWithAlias =
		typeof paramsOrProjectName === "string" ? { projectName: paramsOrProjectName } : paramsOrProjectName;

	const { projectName, projectAlias } = params;
	const projectDomains = projectLikeDomainSet[projectName];

	// 如果没有指定别名，返回所有域名
	if (!projectAlias) {
		return formatDomains(projectDomains);
	}

	// 查找指定别名的域名
	const aliasedDomain = projectDomains.find((domain) => domain.projectAlias === projectAlias);

	if (aliasedDomain) {
		return [formatDomain(aliasedDomain)];
	}

	// 找不到别名时，警告并返回所有域名
	consola.warn(`找不到项目 "${projectName}" 的别名 "${projectAlias}" 对应的域名配置，返回该项目的所有域名。`);
	return formatDomains(projectDomains);
}
