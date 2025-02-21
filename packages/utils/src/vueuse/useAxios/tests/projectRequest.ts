import type { PartialPick } from "type-plus";
import { useAxiosWrapper } from "@ruan-cat/utils/vueuse";
import type { UseAxiosOptions, UseAxiosWrapperParams, KeyAxiosRequestConfig, RemoveUrl } from "@ruan-cat/utils/vueuse";

import type { ApifoxModel } from "./types/ApifoxModel.ts";
import { createAxiosInstance } from "./createAxiosInstance.ts";

/**
 * 根据你的业务 二次包装接口请求的传递参数
 * 这里最重要的是使用 ApifoxModel 来约束你的接口返回数据
 * 否则你每次定义接口请求函数时，都要写一次 ApifoxModel 来约束返回值结构，很繁琐。
 */
interface _Params<T = any, K extends KeyAxiosRequestConfig<D> = "url", D = any>
	extends UseAxiosWrapperParams<T, K, UseAxiosOptions<ApifoxModel<T>>, D> {}

/**
 * 建议封装接口请求函数不传递 useAxios 的 instance 和 options 参数。
 */
type Params = PartialPick<_Params, "instance" | "options">;

/**
 * 接口请求时用的请求实例
 */
const projectRequestInstance = createAxiosInstance();

/**
 * 项目内用的接口请求
 * @description
 * 推荐将 options 和 instance 参数提前封装好，不要每次调用接口请求函数时传递
 */
export function projectRequest<T = any, K extends KeyAxiosRequestConfig = "url", D = any>(params: Params) {
	const {
		config,
		options = {
			immediate: false,
		},
		instance = projectRequestInstance,
	} = params;

	return useAxiosWrapper<ApifoxModel<T>, RemoveUrl<K>, D>({ config, instance, options });
}
