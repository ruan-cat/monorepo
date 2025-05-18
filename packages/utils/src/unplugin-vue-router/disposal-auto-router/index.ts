/**
 * 处理自动路由
 * @description
 * 处理来自虚拟模块 `vue-router/auto-routes` 提供的 routes 数据
 *
 * 将该数据按照格式处理多出来的组件目录层级 移除掉脏数据
 *
 * 最终生成符合常规意义下的父子路由配置数组
 */
import type { RouteRecordRaw } from "vue-router";

/**
 * 处理自动路由脏数据
 * @param routes 原始路由配置
 * @returns 处理后的路由配置
 */
export function disposalAutoRouter(routes: RouteRecordRaw[]): RouteRecordRaw[] {
	if (!Array.isArray(routes) || routes.length === 0) {
		return [];
	}

	const processRoute = (route: RouteRecordRaw, parentPath = ""): RouteRecordRaw => {
		// 创建路由副本，避免修改原始对象
		const processedRoute: RouteRecordRaw = { ...route };

		// 拼接完整路径
		let fullPath = route.path;
		if (parentPath && !fullPath.startsWith("/")) {
			fullPath = `${parentPath}/${fullPath}`.replace(/\/\//g, "/");
		}
		processedRoute.path = fullPath;

		// 处理子路由
		if (Array.isArray(route.children) && route.children.length > 0) {
			// 查找空路径子路由
			const emptyPathChild = route.children.find((child) => child.path === "");

			// 将空路径子路由的信息复制到父路由
			if (emptyPathChild) {
				if (emptyPathChild.name) processedRoute.name = emptyPathChild.name;
				if (emptyPathChild.meta) processedRoute.meta = { ...emptyPathChild.meta };
				if (emptyPathChild.alias) processedRoute.alias = [...emptyPathChild.alias];
			}

			// 处理非空路径子路由
			const processedChildren = route.children
				.filter((child) => child.path !== "") // 过滤掉空路径子路由
				.map((child) => processRoute(child, fullPath)); // 递归处理每个子路由

			// 只有在有子路由的情况下才保留children属性
			if (processedChildren.length > 0) {
				processedRoute.children = processedChildren;
			} else {
				delete processedRoute.children;
			}
		}

		return processedRoute;
	};

	// 处理所有顶级路由
	return routes.map((route) => processRoute(route));
}

export default disposalAutoRouter;
