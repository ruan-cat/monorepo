/**
 * 这里是第二版本的工具 目前属于测试阶段
 * 等待完善后，会正式地替代原来的设计。
 */
import type { AxiosResponse, AxiosInstance } from "axios";
import type { UseAxiosOptionsBase } from "@vueuse/integrations/useAxios";
import { useAxios } from "@vueuse/integrations/useAxios";
import type { CreateAxiosRequestConfig, KeyAxiosRequestConfig } from "./index.ts";

/** 包装器的参数 @version 2 */
export interface UseAxiosWrapperParams2<
	/**
	 * AxiosRequestConfig 默认必填的字段
	 * @description
	 * key是首先必填的字段 必须要约束axios请求配置的可选项值
	 *
	 * 该key值不再默认要求url是必填项 不做严格约束
	 */
	K extends KeyAxiosRequestConfig,
	/**
	 * 业务数据类型
	 * @description
	 * axios的返回值类型 二版本不再默认提供any类型
	 *
	 * 下游工具必须主动传递类型
	 */
	T,
	/** UseAxiosOptionsBase 的派生类型 */
	UseAxiosOptionsLike extends UseAxiosOptionsBase = UseAxiosOptionsBase<T>,
	/**
	 * AxiosRequestConfig 用的类型
	 * @description
	 * 通常是 axios 的输入值
	 */
	D = any,
> {
	/**
	 * 接口的url
	 * @description
	 * 接口必须要有url地址，该url迁移到此处专门设置
	 *
	 * 不要求在 axios 配置内必传url了。
	 * @version 2
	 */
	url: string;
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
 * 正在尝试重构的2 url不是非必填 多了独立的url参数 */

/**
 * useAxios 的包装函数
 * @description
 * 其本质是对 useAxios 函数的封装，仅仅是包装了参数层
 *
 * 预期设计成一个万能的 通用的请求函数
 *
 * 类型必传key T UseAxiosOptionsLike
 * @version 2
 */
export function useAxiosWrapper2<
	K extends KeyAxiosRequestConfig,
	T,
	UseAxiosOptionsLike extends UseAxiosOptionsBase,
	D = any,
>(params: UseAxiosWrapperParams2<K, T, UseAxiosOptionsLike, D>) {
	const { config = {}, instance, options = {} } = params;
	const url = params.url || "";
	return useAxios<T, K, AxiosResponse<T>, D>(url, config, instance, options);
}
