import { projectRequest } from "./projectRequest.ts";
import { HomeCategoryHeads, HomeCategoryHeadsParams } from "./types/business.ts";
import type { KeyHelper } from "@ruan-cat/utils/vueuse";

/**
 * 具体的业务接口
 * @see https://apifox.com/apidoc/shared-c05cb8d7-e591-4d9c-aff8-11065a0ec1de/api-67132163
 */
export function homeCategoryHead<T>() {
	/**
	 * 定义接口的dto返回值
	 * 接口传参时使用的字段
	 * 传参时传递的vo对象
	 */
	return projectRequest<"method" | "url" | "data", HomeCategoryHeads[], HomeCategoryHeadsParams>({
		config: {
			url: "/home/category/head",
			method: "get",
		},
	});
}
