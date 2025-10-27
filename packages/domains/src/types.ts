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

	/**
	 * 项目的描述
	 * @description
	 * 填写简单的描述即可 可以不写
	 */
	description?: string;
}

/**
 * 项目列表
 * @description
 * 项目列表 新建一个项目时 就在这里添加一个项目
 */
export const projects = [
	{ name: "09oa", description: "大项目 09OA项目" },
	{ name: "10wms", description: "大项目 10WMS项目" },
	{ name: "10wms-doc", description: "大项目 10WMS项目 前端文档" },
	{ name: "11comm", description: "大项目 11智慧社区项目" },
	{ name: "11comm-doc", description: "大项目 11智慧社区项目 前端文档" },
	{ name: "01s-doc", description: "大项目 01星球文档" },
	{ name: "utils", description: "工具包项目" },
	{ name: "vitepress-preset", description: "vitepress配置预设" },
	{ name: "claude-notifier", description: "claude code 通知工具" },
	{ name: "domain", description: "域名列表" },
	{ name: "vercel-deploy-tool", description: "vercel部署工具" },
	{ name: "ruan-cat-notes", description: "阮喵喵笔记" },
	{ name: "rmmv-notes", description: "rmmv笔记项目" },
	{ name: "drill-doc", description: "钻头文档" },
	{ name: "rmmv-api-doc", description: "rmmv api文档" },
	{ name: "sundry", description: "杂项项目" },
] as const;

/** 项目名称列表 */
export type ProjectName = (typeof projects)[number]["name"];

/**
 * 项目化的域名配置 项目展示风格的 域名配置类型
 * @description
 * 基础的配置 提供基础说明
 */
export interface ProjectLikeDomain extends Domain {
	/**
	 * 项目名称
	 * @description
	 * 每一个配置的域名 都必须要说明清楚所归属的项目
	 */
	projectName: ProjectName;

	/**
	 * 域名之间的排序
	 * @description
	 * 项目化的域名，之间需要配置排序值来严格区分优先级
	 * 排序值越小 优先级越高
	 */
	order: number;

	/**
	 * 域名说明
	 * @description
	 * 填写简单的描述即可 可以不写。不是所有的域名都必须要写清楚自己的特殊用途。
	 */
	description?: string;

	/**
	 * 项目别名
	 * @description
	 * 某些域名很特殊 需要被特殊索引 故需要配置一个别名 来方便索引
	 */
	projectAlias?: string;
}

/** 项目化的域名 不包含项目名称 */
export type ProjectLikeDomainWithoutProjectName = Omit<ProjectLikeDomain, "projectName">;

/**
 * 项目化的域名集合
 * @description
 * 设计成用项目名称作为key 便于查询阅读
 */
export type ProjectLikeDomainSet = Record<ProjectName, ProjectLikeDomainWithoutProjectName[]>;
