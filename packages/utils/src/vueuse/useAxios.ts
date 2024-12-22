import type { RequiredPick } from "type-plus";
import type { AxiosRequestConfig, AxiosResponse, AxiosInstance } from "axios";
import type { UseAxiosOptions, UseAxiosReturn } from "@vueuse/integrations/useAxios";

/** 拓展的类型参数 用于约束必填的字段 */
export type KeyAxiosRequestConfig<D = any> = keyof AxiosRequestConfig<D>;

/** 填写key值的帮助类型 */
export type KeyHelper<K extends KeyAxiosRequestConfig> = K;

/**
 * 创建 AxiosRequestConfig 的各种变种类型
 * @description
 * 目前需要给 AxiosRequestConfig 添加必填属性
 *
 * 故需要本工具创建各种变种类型
 *
 * @example CreateAxiosRequestConfig<"url", D>
 */
export type CreateAxiosRequestConfig<K extends keyof Target, D = any, Target = AxiosRequestConfig<D>> = RequiredPick<
	Target,
	K
>;

/** 拓展K泛型后的类型 */
export interface StrictUseAxiosReturn<
	T,
	/**
	 * 拓展的类型参数 用于约束必填的字段
	 * @description
	 * 这里不需要提供默认的取值
	 */
	K extends KeyAxiosRequestConfig<D>,
	R,
	D,
> extends UseAxiosReturn<T, R, D> {
	/**
	 * Manually call the axios request
	 */
	execute: (
		url?: string | CreateAxiosRequestConfig<K, D>,
		config?: CreateAxiosRequestConfig<K, D>,
	) => Promise<StrictUseAxiosReturn<T, K, R, D>>;
}

/**
 * 拓展类型参数后的 useAxios 函数
 * @description
 * 在我们的封装中 使用本类型
 */
export declare function useAxios<
	T = any,
	/** 拓展的类型参数 用于约束必填的字段 */
	K extends KeyAxiosRequestConfig<D> = "url",
	R = AxiosResponse<T>,
	D = any,
>(
	url: string,
	config: AxiosRequestConfig<D>,
	instance: AxiosInstance,
	options?: UseAxiosOptions,
): StrictUseAxiosReturn<T, K, R, D> & Promise<StrictUseAxiosReturn<T, K, R, D>>;

/** 包装器的参数 */
export interface UseAxiosWrapperParams<
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
 */
export function useAxiosWrapper<T, K extends KeyAxiosRequestConfig, D = any>(params: UseAxiosWrapperParams) {
	const {
		config: { url },
		config,
		instance,
		options,
	} = params;
	return useAxios<T, K, AxiosResponse<T>, D>(url, config, instance, options);
}
