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
import { omit } from "lodash-es";

/**
 * 处理单个路由，包括处理空路径子路由和拼接完整路径
 * @param route 原始路由配置
 * @param parentPath 父路由路径
 * @returns 处理后的路由配置
 */
export function processRoute(route: RouteRecordRaw, parentPath = ""): RouteRecordRaw {
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

		// 将空路径子路由的所有信息(除了path)复制到父路由
		if (emptyPathChild) {
			// 使用lodash-es的omit函数，复制除path外的所有属性
			Object.assign(processedRoute, omit(emptyPathChild, ["path"]));
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
}

/**
 * 处理自动路由脏数据
 * @param routes 原始路由配置
 * @returns 处理后的路由配置
 */
export function disposalAutoRouter(routes: RouteRecordRaw[]): RouteRecordRaw[] {
	if (!Array.isArray(routes) || routes.length === 0) {
		return [];
	}

	// 处理所有顶级路由
	return routes.map((route) => processRoute(route));
}
