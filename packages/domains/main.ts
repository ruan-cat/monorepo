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
 *
 * 这些域名主要是用于 vercel 的基于文件结构的部署。目前没有其他的用途。
 *
 * 其他域名仅用于声明，类似于文档说明。
 */
export const domains = <const>{
	/** 大项目 09OA项目 */
	"09oa": ["01s-09oa.ruancat6312.top"],

	/** 大项目 10WMS项目 */
	"10wms": ["01s-10wms.ruancat6312.top"],

	/** 大项目 11智慧社区项目 */
	"11comm": [
		"01s-11comm.ruancat6312.top",
		"01s-11.ruancat6312.top",
		// 以下域名主要用于 cloudflare worker 部署 上下两款域名的内容并不完全等价
		// "01s-11comm.ruan-cat.com",
		// "01s-11.ruan-cat.com",
	],

	/** 01星球文档 */
	"01s-doc": ["docs-01-star.ruancat6312.top"],

	/** 工具包项目 */
	utils: ["utils.ruancat6312.top", "utils.ruan-cat.com"],

	/** vitepress配置预设 */
	"vitepress-preset": ["vip.ruancat6312.top", "vitepress-preset.ruancat6312.top", "vitepress.ruancat6312.top"],

	/** 域名列表 */
	domain: ["dm.ruancat6312.top", "dm.ruan-cat.com"],

	/**
	 * 笔记项目 `github`流水线版本
	 * @description
	 * 在 github workflow 流水线内部署的域名
	 * 为了保证vercel静态文件上传时 不会出现构建次数超出每个月100次的额度限制
	 * 该域名预期仅仅在main主分支被触发的时候 完成更新
	 *
	 * - *更新速度*： 预期是`低频触发，低速部署`的域名。
	 * - *cname*： 该域名没有在平台内配置指定的cname 整个`ruancat6312.top`域名被vercel管控。vercel会实现自动域名。
	 * - *有意义配置*： 该配置预期会给vercel部署工具直接使用。
	 */
	notesGithubWorkflow: ["ruan-cat-notes.ruancat6312.top"],

	/**
	 * 笔记项目 `cloudflare`流水线版本
	 * @description
	 * 在 cloudflare pages 流水线内部署的域名
	 * 这个域名会在dev分支 且notes目录下有变更时重新部署
	 *
	 * - *更新速度*： 预期是`高频触发，低速部署`的域名。
	 * - *cname*： 该域名有明确的cname配置 对接的是`cloudflare pages`提供的默认域名。
	 * - *无意义配置*： 本配置在此处仅仅是用来声明 目前暂时没有专门的域名配置。
	 */
	notesCloudflare: ["notes.ruan-cat.com"],

	/**
	 * 笔记项目 `vercel`流水线版本
	 * @description
	 * 在 vercel 流水线内部署的域名
	 * 这个域名会在vc分支触发的时候重新部署
	 *
	 * - *更新速度*： 预期是`中频触发，高速部署`的域名。
	 * - *cname*： 该域名有明确的cname配置 对接的是`vercel`提供的服务器ns。
	 * - *无意义配置*： 本配置在此处仅仅是用来声明 目前暂时没有专门的域名配置。
	 */
	notesVercel: ["ruan-cat-notes.ruan-cat.com"],

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
