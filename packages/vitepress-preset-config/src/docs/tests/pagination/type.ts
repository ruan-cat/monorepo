import type { PaginationProps as ElPaginationProps } from "element-plus";

/** 预设的分页栏属性 */
export type PresetPaginationProps = Partial<ElPaginationProps>;

/** 分页栏属性 */
export interface PaginationProps extends PresetPaginationProps {
	/**
	 * 总页数
	 * @description
	 * 对应的分页接口必须传递总页数
	 */
	total: number;

	/**
	 * 异步请求函数
	 * @description
	 * 分页栏组件会自动监听内部数据变化 同时做出相应的请求
	 */
	asyncFunc: (...args: any[]) => Promise<any>;
}
