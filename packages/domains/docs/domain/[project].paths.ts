import { getProjectRoutePaths } from "../.vitepress/project-navigation.ts";

export default {
	/**
	 * 复用共享导航模块的排序结果来生成动态路由参数。
	 * 这样侧边栏与动态页面的顺序来源始终一致。
	 */
	paths() {
		return getProjectRoutePaths();
	},
};
