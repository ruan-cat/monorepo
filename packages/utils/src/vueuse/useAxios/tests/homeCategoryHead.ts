import { projectRequest, type UseAxiosOptionsWithReturnWrapper } from "./projectRequest.ts";
import { HomeCategoryHeads, HomeCategoryHeadsParams } from "./types/business.ts";

/**
 * 具体的业务接口
 * @see https://apifox.com/apidoc/shared-c05cb8d7-e591-4d9c-aff8-11065a0ec1de/api-67132163
 */
export function homeCategoryHead<T = HomeCategoryHeads[]>(options?: UseAxiosOptionsWithReturnWrapper<T>) {
	/**
	 * 定义接口的dto返回值
	 * 接口传参时使用的字段
	 * 传参时传递的vo对象
	 */
	return projectRequest<"method" | "data", T, HomeCategoryHeadsParams>({
		options,
		url: "/home/category/head",
		config: {
			data: {
				vip: true,
			},
			method: "get",
		},
	});
}
