import type { RequiredPick } from "type-plus";
import type { AxiosRequestConfig, AxiosResponse, AxiosInstance } from "axios";
import type { UseAxiosOptions, UseAxiosOptionsBase, UseAxiosReturn } from "@vueuse/integrations/useAxios";
import { useAxios } from "@vueuse/integrations/useAxios";

/** 在封装函数时 需要使用该类型 */
export { UseAxiosOptions, UseAxiosOptionsBase };

/** 拓展的类型参数 用于约束必填的字段 */
export type KeyAxiosRequestConfig<D = any> = keyof AxiosRequestConfig<D>;

/** 填写key值的帮助类型 */
export type KeyHelper<K extends KeyAxiosRequestConfig> = K;

/** @deprecated 在v2版本中，我们不使用该工具来约束删减类型 */
export type RemoveUrl<T extends KeyAxiosRequestConfig> = Exclude<T, "url">;

/** @deprecated 在v2版本中，我们不使用该工具来约束删减类型 */
export type RemoveUrlMethod<T extends KeyAxiosRequestConfig> = Exclude<T, "url" | "method">;

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

declare module "@vueuse/integrations/useAxios" {
	/**
	 * 拓展类型参数后的 useAxios 函数
	 * @description
	 * 在我们的封装中 使用本类型
	 */
	function useAxios<
		T = any,
		/** 拓展的类型参数 用于约束必填的字段 */
		K extends KeyAxiosRequestConfig<D> = "url",
		R = AxiosResponse<T>,
		D = any,
	>(
		url: string,
		config: AxiosRequestConfig<D>,
		instance: AxiosInstance,
		options?: UseAxiosOptionsBase,
	): StrictUseAxiosReturn<T, K, R, D> & Promise<StrictUseAxiosReturn<T, K, R, D>>;
}

/** 包装器的参数 @version 2 */
export interface UseAxiosWrapperParams<
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
>(params: UseAxiosWrapperParams<K, T, UseAxiosOptionsLike, D>) {
	const { config = {}, instance, options = {} } = params;
	const url = params.url || "";
	return useAxios<T, K, AxiosResponse<T>, D>(url, config, instance, options);
}

export * from "./v2.ts";
