import { ProjectLikeDomain } from "./types";

export const projectLikeDomains: ProjectLikeDomain[] = [
	/** 大项目 09OA项目 */
	{
		projectName: "09oa",
		topLevelDomain: "ruancat6312.top",
		secondLevelDomain: "01s-09oa",
		order: 1,
	},
	/** 大项目 10WMS项目 */
	{
		projectName: "10wms",
		topLevelDomain: "ruancat6312.top",
		secondLevelDomain: "10wms",
		order: 1,
	},
	/** 大项目 10WMS项目 前端文档 */
	{
		projectName: "10wms-doc",
		topLevelDomain: "ruancat6312.top",
		secondLevelDomain: "01s-10wms-doc",
		order: 1,
	},
	{
		projectName: "10wms-doc",
		topLevelDomain: "ruancat6312.top",
		secondLevelDomain: "01s-10wms-frontend-docs",
		order: 2,
	},
	/** 大项目 11智慧社区项目 */
	{
		projectName: "11comm",
		topLevelDomain: "ruancat6312.top",
		secondLevelDomain: "01s-11",
		order: 1,
	},
	{
		projectName: "11comm",
		topLevelDomain: "ruancat6312.top",
		secondLevelDomain: "01s-11comm",
		order: 2,
	},
	{
		projectName: "11comm",
		topLevelDomain: "ruan-cat.com",
		secondLevelDomain: "01s-11",
		order: 3,
		description: "本域名主要用于 cloudflare worker 部署，与 ruancat6312.top 域名的内容并不完全等价",
	},
	{
		projectName: "11comm",
		topLevelDomain: "ruan-cat.com",
		secondLevelDomain: "01s-11comm",
		order: 4,
		description: "本域名主要用于 cloudflare worker 部署，与 ruancat6312.top 域名的内容并不完全等价",
	},
];
