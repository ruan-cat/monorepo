/**
 * 页面排序配置
 * 预期设计为一个常量 用于给一些固定的，杂项的页面做侧边栏排序
 *
 * 数字越大，排序越靠后
 */
export const pageOrderConfig = {
	/** 提示词页面排序 */
	prompts: {
		order: 8000,
	},

	/** 变更日志页面排序 */
	changelog: {
		order: 9000,
	},
};
