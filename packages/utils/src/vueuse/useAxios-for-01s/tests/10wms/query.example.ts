// @ts-ignore
import type { ParamsQueryKey, UseAxiosOptionsJsonVO } from "./request.ts";
// @ts-ignore
import { useRequest } from "./request.ts";

interface ToDelete {
	/** 分类的唯一编号 */
	id: string;
}

/**
 * 删除分类接口
 * @see https://app.apifox.com/link/project/5901227/apis/api-264076055
 */
export function queryExample<T = string>(options: UseAxiosOptionsJsonVO<T>) {
	return useRequest<ParamsQueryKey, T, ToDelete>({
		url: "/sysmanager/catagory/remove-catagory",
		options,
		httpParamWay: "query",
		config: {
			method: "delete",
			data: {
				id: "",
			},
		},
	});
}
