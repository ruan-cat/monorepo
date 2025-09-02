/**
 * 顶级域名
 * @description
 * 阮喵喵的顶级域名
 *
 * 目前阮喵喵仅仅是购买了两个顶级域名 未来不太可能继续购买额外的顶级域名了
 */
export type TopLevelDomain = "ruancat6312.top" | "ruan-cat.com";

/**
 * 域名配置信息
 * @description
 * 每一个域名配置信息
 */
export interface Domain {
	/**
	 * 顶级域名
	 * @description 每一个域名都必须配置一个明确的顶级域名 否则无法确定域名归属
	 */
	topLevelDomain: TopLevelDomain;
	/**
	 * 二级域名
	 * @description 二级域名必须配置
	 */
	secondLevelDomain: string;
}

/** 项目信息 */
export interface Project {
	/**
	 * 项目的代号名称
	 * @description 只能填写英文、数字、横杠线。不能包含空格
	 */
	name: string;
}

export const projectNames = ["09oa", "10wms", "11comm", "11comm-doc", "11comm-doc-cn", "11comm-doc-en"];
