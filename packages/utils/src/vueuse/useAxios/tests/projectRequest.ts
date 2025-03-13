import type { PartialPick } from "type-plus";
import { useAxiosWrapper } from "@ruan-cat/utils/vueuse";
import type { UseAxiosOptionsBase, UseAxiosWrapperParams, KeyAxiosRequestConfig } from "@ruan-cat/utils/vueuse";

import type { ApifoxModel } from "./types/ApifoxModel.ts";
import { createAxiosInstance } from "./createAxiosInstance.ts";

/**
 * 提供默认返回值的包装类型
 * @description
 * 预期会在每一个接口的包装函数内使用 用来定义 useAxios 的options参数
 *
 * 该类型应该成为高频使用的工具类型
 *
 * 被设计成一个简单的类型 而不是interface接口
 *
 * 推荐在你的业务内自己二次封装这样的返回值类型
 */
export type UseAxiosOptionsWithReturnWrapper<T = any> = UseAxiosOptionsBase<ApifoxModel<T>>;

/**
 * 根据你的业务 二次包装接口请求的传递参数
 * 这里最重要的是使用 ApifoxModel 来约束你的接口返回数据
 * 否则你每次定义接口请求函数时，都要写一次 ApifoxModel 来约束返回值结构，很繁琐。
 */
interface _Params<K extends KeyAxiosRequestConfig, T = any, D = any>
	extends UseAxiosWrapperParams<K, T, UseAxiosOptionsBase<ApifoxModel<T>>, D> {}

/**
 * 建议封装接口请求函数不传递 useAxios 的 instance 和 options 参数。
 */
type Params<K extends KeyAxiosRequestConfig, T = any, D = any> = PartialPick<_Params<K, T, D>, "instance" | "options">;

/**
 * 接口请求时用的请求实例
 */
const projectRequestInstance = createAxiosInstance();

/**
 * 项目内用的接口请求
 * @description
 * 推荐将 options 和 instance 参数提前封装好，不要每次调用接口请求函数时传递
 */
export function projectRequest<K extends KeyAxiosRequestConfig, T = any, D = any>(params: Params<K, T, D>) {
	const {
		url,
		config,
		options = {
			immediate: false,
		},
		instance = projectRequestInstance,
	} = params;

	return useAxiosWrapper<K, ApifoxModel<T>, UseAxiosOptionsBase<ApifoxModel<T>>, D>({ config, instance, options, url });
}
