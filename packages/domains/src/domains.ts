import { ProjectLikeDomainSet } from "./types";

/**
 * 项目化的域名集合
 * @description
 * 设计成用项目名称作为key 便于查询阅读
 */
export const projectLikeDomainSet: ProjectLikeDomainSet = {
	/** 大项目 09OA项目 */
	"09oa": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "01s-09oa",
			order: 1,
		},
	],
	/** 大项目 10WMS项目 */
	"10wms": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "10wms",
			order: 1,
		},
	],
	/** 大项目 10WMS项目 前端文档 */
	"10wms-doc": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "01s-10wms-doc",
			order: 1,
		},
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "01s-10wms-frontend-docs",
			order: 2,
		},
	],
	/** 大项目 11智慧社区项目 */
	"11comm": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "01s-11",
			order: 1,
		},
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "01s-11comm",
			order: 2,
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "01s-11",
			order: 3,
			description: "本域名主要用于 cloudflare worker 部署，与 ruancat6312.top 域名的内容并不完全等价",
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "01s-11comm",
			order: 4,
			description: "本域名主要用于 cloudflare worker 部署，与 ruancat6312.top 域名的内容并不完全等价",
		},
	],
	/** 大项目 11智慧社区项目 前端文档 */
	"11comm-doc": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "01s-11comm-doc",
			order: 1,
		},
	],
	/** 大项目 01星球文档 */
	"01s-doc": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "docs-01-star",
			order: 1,
		},
	],
	/** 工具包项目 */
	utils: [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "utils",
			order: 1,
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "utils",
			order: 2,
		},
	],
	/** vitepress配置预设 */
	"vitepress-preset": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "vip",
			order: 1,
		},
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "vitepress-preset",
			order: 2,
		},
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "vitepress",
			order: 3,
		},
	],
	/** 域名列表 */
	domain: [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "dm",
			order: 1,
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "dm",
			order: 2,
		},
	],
	/** vercel部署工具 */
	"vercel-deploy-tool": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "vercel-deploy-tool",
			order: 1,
		},
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "vercel",
			order: 2,
		},
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "vc",
			order: 3,
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "vc",
			order: 4,
		},
	],
	/** 阮喵喵笔记 */
	"ruan-cat-notes": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "ruan-cat-notes",
			order: 1,
			description: "GitHub workflow 流水线版本 - 低频触发，低速部署",
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "notes",
			order: 2,
			description: "Cloudflare pages 流水线版本 - 高频触发，低速部署",
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "ruan-cat-notes",
			order: 3,
			description: "Vercel 流水线版本 - 中频触发，高速部署",
		},
	],
	/** rmmv笔记项目 */
	"rmmv-notes": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "rpgmv-dev-notes",
			order: 1,
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "rpgmv-dev-notes",
			order: 2,
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "mv",
			order: 3,
		},
	],
	/** 钻头文档 */
	"drill-doc": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "small-alice-web",
			order: 1,
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "small-alice-web",
			order: 2,
		},
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "drill",
			order: 3,
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "drill",
			order: 4,
		},
	],
	/** rmmv api文档 */
	"rmmv-api-doc": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "rmmv-api-doc",
			order: 1,
			description: "目前没有配置工作流给该域名，未来看情况使用",
		},
	],
};
