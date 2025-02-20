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
	"09oa": ["01s-09oa.ruancat6312.top"],

	/** 大项目 10WMS项目 */
	"10wms": ["01s-10wms.ruancat6312.top"],

	/** 01星球文档 */
	"01s-doc": ["docs-01-star.ruancat6312.top"],

	/** 工具包项目 */
	utils: ["utils.ruancat6312.top", "utils.ruan-cat.com"],

	/** 域名列表 */
	domain: ["dm.ruancat6312.top", "dm.ruan-cat.com"],

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

	/** 钻头文档 */
	"drill-doc": [
		"small-alice-web.ruancat6312.top",
		"small-alice-web.ruan-cat.com",
		"drill.ruancat6312.top",
		"drill.ruan-cat.com",
	],
};
