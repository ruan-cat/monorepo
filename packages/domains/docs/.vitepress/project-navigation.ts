import { projects, type ProjectItem } from "../../src/types.ts";

/** 文档站内用于生成动态导航的项目源数据。 */
const projectItems: readonly ProjectItem[] = projects;

/**
 * 排序阶段使用的中间结构。
 * 保留原始索引，便于未配置 `order` 的项目维持声明顺序。
 */
type SortedProjectEntry = {
	project: ProjectItem;
	index: number;
};

/**
 * 将项目的可选 `order` 归一化为可直接比较的数值。
 * 未配置 `order` 的项目会落到末尾，但仍可借助原始索引保持稳定顺序。
 */
function getProjectSortOrder(project: ProjectItem): number {
	return project.order ?? Number.POSITIVE_INFINITY;
}

/**
 * 比较两个项目的文档导航顺序。
 * 1. 优先按 `order` 升序排列
 * 2. `order` 相同或缺失时，按原始声明顺序兜底
 */
function compareProjectEntries(left: SortedProjectEntry, right: SortedProjectEntry): number {
	const orderDiff = getProjectSortOrder(left.project) - getProjectSortOrder(right.project);

	if (orderDiff !== 0) {
		return orderDiff;
	}

	return left.index - right.index;
}

/**
 * 返回文档导航唯一使用的项目排序结果。
 * 侧边栏与动态路由都必须复用这一份结果，避免出现两套排序逻辑漂移。
 */
export function getSortedProjects(): ProjectItem[] {
	return projectItems
		.map((project, index) => ({ project, index }))
		.toSorted(compareProjectEntries)
		.map(({ project }) => project);
}

/** 基于统一排序结果生成 VitePress 侧边栏项目列表。 */
export function getProjectSidebarItems() {
	return getSortedProjects().map((project) => ({
		text: project.name,
		link: `/domain/${project.name}`,
	}));
}

/** 基于统一排序结果生成动态路由的 `paths()` 参数。 */
export function getProjectRoutePaths() {
	return getSortedProjects().map((project) => ({
		params: {
			project: project.name,
		},
	}));
}
