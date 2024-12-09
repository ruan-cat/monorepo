/**
 * 项目名称
 * @description
 * 各种项目的名称 作为标识符查询
 *
 * @deprecated
 * 没必要
 */
export const projectNames = <const>["09oa", "utils", "09oa-docs", "notes", "rmmv-notes"];

/**
 * 域名对象
 * @deprecated
 * 没必要
 */
export type Domains = Record<(typeof projectNames)[number], string[]>;

/**
 * 域名对象
 * @description
 * 设计成简单的常量即可 无需额外的类型约束
 */
export const domains = <const>{
	/** 大项目 09OA项目 */
	"09oa": ["09oa.ruancat6312.top"],
	"09oa-docs": [],
	utils: [],

	/** 笔记项目 */
	notes: [
		//
		"notes.ruan-cat.com",
		"ruan-cat-notes.ruan-cat.com",
		"ruan-cat-notes.ruancat6312.top",
	],

	/** rmmv笔记项目 */
	"rmmv-notes": [
		//
		"rpgmv-dev-notes.ruancat6312.top",
		"rpgmv-dev-notes.ruan-cat.com",
		"mv.ruan-cat.com",
	],
};
