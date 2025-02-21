import { type Options } from "unplugin-vue-router";

type GetRouteName = NonNullable<Options["getRouteName"]>;

/**
 * 自主生成路由名称
 * @description
 * 对插件自动生成的路由名称，很不满意，不好看，容易引起阅读歧义。
 *
 * 故自定义。
 *
 * unplugin-vue-router 插件的 getRouteName 配置项
 *
 * FIXME: https://github.com/vitejs/vite/issues/5370
 *
 * 该函数设计出来是为了解决这个问题
 *
 * 在vite符号链接未解决时，应该直接使用js文件，如下：
 * (作废)
 * import { getRouteName } from "@ruan-cat/utils/dist/index.js";
 *
 * 若已经彻底解决，请直接试图用来自符号链接的ts文件，如下：
 * import { getRouteName } from "@ruan-cat/utils/unplugin-vue-router";
 */
export const getRouteName: GetRouteName = function _getRouteName(node): ReturnType<GetRouteName> {
	// 如果是根节点 那么没有对应的文件夹名称 返回空字符串
	if (!node.parent) {
		return "";
	}

	/** 上一次递归产生的字符串 */
	const last = _getRouteName(node.parent);

	/**
	 * 路由名称链接符
	 * @description
	 * 如果上一次递归产生的字符串为空，则不需要链接符
	 */
	const connector = last === "" ? "" : "-";

	/** 当前节点的路由名称 */
	const current = node.value.rawSegment === "index" ? "" : `${connector}${node.value.rawSegment}`;

	// 返回上一次递归产生的字符串和当前节点的路由名称的拼接
	// 从后面逐步拼接
	return last + current;
};
