/**
 * 项目名称
 * @description
 * 各种项目的名称 作为标识符查询
 */
export const projectNames = <const>["09oa", "utils", "09oa-docs"];

/** 域名对象 */
export type Domains = Record<(typeof projectNames)[number], string[]>;

/** 域名对象 */
export const domains: Domains = {
	"09oa": ["09oa.ruancat6312.top"],
	"09oa-docs": [],
	utils: [],
};
