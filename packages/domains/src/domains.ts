import { type ProjectLikeDomainSet } from "./types.ts";

/**
 * 项目化的域名集合
 * @description
 * 设计成用项目名称作为key 便于查询阅读
 */
export const projectLikeDomainSet: ProjectLikeDomainSet = {
	/** 大项目 09OA项目 */
	"09oa": [{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "01s-09oa", order: 1 }],
	/** 大项目 10WMS项目 */
	"10wms": [{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "10wms", order: 1 }],
	/** 大项目 10WMS项目 前端文档 */
	"10wms-doc": [
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "01s-10wms-doc", order: 1 },
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "01s-10wms-frontend-docs", order: 2 },
	],
	/** 大项目 11智慧社区项目 */
	"11comm": [
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "01s-11",
			order: 1,
			description: "本域名主要用于 cloudflare worker 部署，与 ruancat6312.top 域名的内容并不完全等价",
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "01s-11comm",
			order: 2,
			description: "本域名主要用于 vercel 部署，与 ruancat6312.top 域名的内容并不完全等价",
		},
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "01s-11", order: 3 },
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "01s-11comm", order: 4 },
	],
	/** 大项目 11智慧社区项目 前端文档 */
	"11comm-doc": [
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "01s-11comm-doc",
			order: 1,
			description: "本域名主要用于 cloudflare worker 部署，与 ruancat6312.top 域名的内容并不完全等价。是高频更新的。",
		},
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "01s-11comm-doc", order: 2 },
	],
	/** 01星球文档 */
	"01s-doc": [
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "01s-doc",
			order: 1,
			description: "本域名是主域名，作为主要的域名使用。在cloudflare worker内配置了自动部署。",
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "docs-01-star",
			order: 2,
			description: "本域名是别名。在cloudflare worker内指向同一个内容。不属于301重定向写法。",
		},
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "docs-01-star", order: 3 },
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "01s-doc",
			order: 4,
			description: "本域名是别名。旨在于统一域名的编写格式。",
		},
	],
	/** 工具包项目 */
	utils: [
		{ topLevelDomain: "ruan-cat.com", secondLevelDomain: "utils", order: 1 },
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "utils", order: 2 },
	],
	/** vitepress配置预设 */
	"vitepress-preset": [
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "vip", order: 1 },
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "vitepress", order: 2 },
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "vitepress-preset", order: 3 },
	],
	/** claude code 通知工具 */
	"claude-notifier": [
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "ccntf",
			order: 1,
			description: "本域名在cloudflare CDN 内配置了二级域名。由 github workflow + vercel 流水线完成部署。低频更新。",
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "claude-notifier",
			order: 2,
			description: "和 ccntf 域名指向同一个内容，使用相同的配置。",
		},
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "ccntf", order: 3 },
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "claude-notifier", order: 4 },
	],
	/** 域名列表 */
	domain: [
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "dm", order: 1 },
		{ topLevelDomain: "ruan-cat.com", secondLevelDomain: "dm", order: 2 },
	],
	/** vercel部署工具 */
	"vercel-deploy-tool": [
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "vercel-deploy-tool", order: 1 },
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "vercel", order: 2 },
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "vc", order: 3 },
		{ topLevelDomain: "ruan-cat.com", secondLevelDomain: "vc", order: 4 },
	],
	/** 阮喵喵笔记 */
	"ruan-cat-notes": [
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "notes",
			order: 1,
			projectAlias: "notesVercel",
			description: `笔记项目 Vercel 流水线版本
在 vercel 流水线内部署的域名
这个域名会在 dev 分支触发的时候重新部署

- 更新速度：预期是高频触发，中速部署的域名
- cname：该域名有明确的cname配置，对接的是vercel提供的cname域名
- git日志：该站点会提供git修改日志，因为 vercel 流水线会提供git信息
- 无意义配置：本配置在此处仅仅是用来声明，目前暂时没有专门的域名配置`,
		},

		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "ruan-cat-notes",
			order: 2,
			projectAlias: "notesCloudflare",
			description: `笔记项目 Cloudflare 流水线版本
在 cloudflare pages 流水线内部署的域名
这个域名会在dev分支且notes目录下有变更时重新部署

- 更新速度：预期是高频触发，高速部署的域名
- cname：该域名有明确的cname配置，对接的是cloudflare pages提供的默认域名
- git日志：该站点没有git修改日志，因为 cloudflare worker 流水线不会提供git信息
- 无意义配置：本配置在此处仅仅是用来声明，目前暂时没有专门的域名配置`,
		},

		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "ruan-cat-notes",
			order: 3,
			projectAlias: "notesGithubWorkflow",
			description: `笔记项目 GitHub Workflow 流水线版本
在 github workflow 流水线内部署的域名
为了保证vercel静态文件上传时不会出现构建次数超出每个月100次的额度限制
该域名预期仅仅在main主分支被触发的时候完成更新

- 更新速度：预期是低频触发，低速部署的域名
- cname：该域名没有在平台内配置指定的cname，整个ruancat6312.top域名被vercel管控。vercel会实现自动域名
- git日志：该站点会提供git修改日志，因为 github action 流水线会提供git信息
- 有意义配置：该配置预期会给vercel部署工具直接使用`,
		},
	],

	/** rmmv笔记项目 */
	"rmmv-notes": [
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "rpgmv-dev-notes", order: 1 },
		{ topLevelDomain: "ruan-cat.com", secondLevelDomain: "rpgmv-dev-notes", order: 2 },
		{ topLevelDomain: "ruan-cat.com", secondLevelDomain: "mv", order: 3 },
	],
	/** 钻头文档 */
	"drill-doc": [
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "small-alice-web", order: 1 },
		{ topLevelDomain: "ruan-cat.com", secondLevelDomain: "small-alice-web", order: 2 },
		{ topLevelDomain: "ruancat6312.top", secondLevelDomain: "drill", order: 3 },
		{ topLevelDomain: "ruan-cat.com", secondLevelDomain: "drill", order: 4 },
	],
	/** rmmv api文档 */
	"rmmv-api-doc": [
		{
			topLevelDomain: "ruancat6312.top",
			secondLevelDomain: "rmmv-api-doc",
			order: 1,
			description: "目前没有配置工作流给该域名，未来看情况使用",
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "rmmv-api-doc",
			order: 2,
			description: "该域名在vercel内配置cname 在此处仅声明 不实际暴露出去使用",
		},
	],
	/** 杂项项目 */
	sundry: [
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "juejin",
			order: 1,
			description: "重定向到掘金文章主页。在cloudflare内用cloudflare worker函数实现301重定向配置。",
		},
		{
			topLevelDomain: "ruan-cat.com",
			secondLevelDomain: "rmmv-api-doc",
			order: 2,
			description: "rmmv的api文档，用工具生成的文档。由于仓库庞大，故选择用vercel工作流克隆并部署文档。",
		},
	],
};
