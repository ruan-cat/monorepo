/**
 * 这里是第一版本的工具
 * 已经不再使用
 */
import type { RequiredPick } from "type-plus";
import type { AxiosResponse, AxiosInstance } from "axios";
import type { UseAxiosOptionsBase, UseAxiosOptions } from "@vueuse/integrations/useAxios";
import { useAxios } from "@vueuse/integrations/useAxios";
import type { CreateAxiosRequestConfig, KeyAxiosRequestConfig } from "./index.ts";

/**
 * 包装器的参数
 * @version 1
 * @deprecated
 */
export interface UseAxiosWrapperParamsV1<
	/**
	 * 业务数据类型
	 * @description
	 * 必须先填写业务类型
	 */
	T = any,
	/**
	 * AxiosRequestConfig 默认必填的字段
	 * @description
	 * 用于约束其他类型的字段
	 *
	 * 然后才能填写必传的参数类型
	 *
	 * 默认为 必填url请求地址的 config 请求配置
	 */
	K extends KeyAxiosRequestConfig<D> = "url",
	/**
	 * UseAxiosOptions 的派生类型
	 */
	UseAxiosOptionsLike extends UseAxiosOptions = UseAxiosOptions,
	/**
	 * AxiosRequestConfig 用的类型
	 * @description
	 * 最后才可以传递此类型
	 */
	D = any,
> {
	/**
	 * axios的配置类型
	 * @description
	 * 默认为 必填url请求地址的 config 请求配置
	 */
	config: CreateAxiosRequestConfig<K, D>;

	/**
	 * axios实例
	 * @description
	 * 对于包装器函数而言 必须传递有意义的请求实例
	 */
	instance: AxiosInstance;

	/** useAxios 的选项配置 */
	options: UseAxiosOptionsLike;
}

/**
 * useAxios 的包装函数
 * @description
 * 其本质是对 useAxios 函数的封装，仅仅是包装了参数层
 *
 * 预期设计成一个万能的 通用的请求函数
 * @version 1
 */
export function useAxiosWrapper<T, K extends KeyAxiosRequestConfig, D = any>(params: UseAxiosWrapperParamsV1) {
	const {
		config: { url },
		config,
		instance,
		options,
	} = params;
	// 跳转到 vueuse 内的函数声明
	// return useAxios<T, AxiosResponse<T>, D>(url, config, instance, options);

	// 跳转到我们拓展的函数声明
	return useAxios<T, K, AxiosResponse<T>, D>(url, config, instance, options);
}
