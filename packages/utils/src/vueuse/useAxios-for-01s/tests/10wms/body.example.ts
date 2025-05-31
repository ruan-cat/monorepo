// @ts-ignore
import type { ParamsBodyKey, UseAxiosOptionsJsonVO } from "./request.ts";
// @ts-ignore
import { useRequest } from "./request.ts";

/**
 * 分类对象例子
 * @description
 * 新增 编辑 表格数据
 * @see https://app.apifox.com/link/project/5901227/apis/api-264076051
 */
export interface CatagoryExample {
	/**
	 * 图标的唯一编号
	 */
	iconId?: string;
	/**
	 * 分类的唯一编号
	 */
	id?: string;
	/**
	 * 分类名称
	 */
	name?: string;
	/**
	 * 上级id
	 */
	parentId?: string;
}

/**
 * 新增分类接口
 * @see https://app.apifox.com/link/project/5901227/apis/api-264076051
 */
export function bodyExample<T = string>(options: UseAxiosOptionsJsonVO<T>) {
	return useRequest<ParamsBodyKey, T, CatagoryExample>({
		httpParamWay: "body",
		options,
		url: "/sysmanager/catagory/add-catagory",
		config: {
			data: {},
			method: "POST",
		},
	});
}
