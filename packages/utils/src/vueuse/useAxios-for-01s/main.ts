import type { KeyAxiosRequestConfig, UseAxiosWrapperParams } from "../useAxios/index";
import { useAxiosWrapper } from "../useAxios/index";

import type { UseAxiosOptionsBase } from "@vueuse/integrations/useAxios";
import type { PartialPick } from "type-plus";
import type { AxiosInstance } from "axios";
import axios from "axios";
import type { JsonVO } from "./types/JsonVO";

import type { AxiosRequestConfigBaseKey, HttpParamWay } from "./tools.ts";
import {
	createDefaultUseAxiosOptions,
	setHeaders,
	UpType,
	setDefaultUseAxiosOptions,
	setDataByHttpParamWay,
} from "./tools";

/**
 * 内部用的 axios 实例
 * @description
 * 主动声明类型 用于约束
 * @private
 */
let innerAxiosInstance: AxiosInstance = axios;

/**
 * 定义具体的 AxiosInstance 实例
 * @description
 * 让外部设置一次内部的默认请求实例
 */
export function defineAxiosInstance(axiosInstance: AxiosInstance) {
	innerAxiosInstance = axiosInstance;
}

export type ParamsPathKey = AxiosRequestConfigBaseKey | "url";
export type ParamsQueryKey = AxiosRequestConfigBaseKey | "params";
export type ParamsBodyKey = AxiosRequestConfigBaseKey | "data";

type UseAxiosWrapperUseKey<T extends HttpParamWay, K extends KeyAxiosRequestConfig> =
	//
	T extends HttpParamWay ? Exclude<K, AxiosRequestConfigBaseKey> : never;

interface _Params<K extends KeyAxiosRequestConfig, T = any, D = any>
	extends UseAxiosWrapperParams<K, T, UseAxiosOptionsBase<JsonVO<T>>, D> {
	httpParamWay: HttpParamWay;
	upType?: UpType;
}

/** 建议封装接口请求函数不传递 useAxios 的 instance 和 options 参数 */
type Params<K extends KeyAxiosRequestConfig, T = any, D = any> = PartialPick<_Params<K, T, D>, "instance" | "options">;

/**
 * 项目内用的接口请求
 * @description
 * 01s项目内常用的接口请求
 * @version 2
 */
export function useRequestIn01s<
	K extends KeyAxiosRequestConfig,
	T = any,
	D = any,
	HttpParamWayTemp extends HttpParamWay = Params<K>["httpParamWay"],
	O extends UseAxiosOptionsBase<JsonVO<T>> = UseAxiosOptionsBase<JsonVO<T>>,
>(
	params: Params<
		//
		UseAxiosWrapperUseKey<HttpParamWayTemp, K>,
		T,
		D
	>,
) {
	const {
		config,
		options = createDefaultUseAxiosOptions(),
		instance = innerAxiosInstance,
		httpParamWay,
		upType,
		url,
	} = params;
	setHeaders(config, upType);
	setDefaultUseAxiosOptions(options);
	setDataByHttpParamWay({
		httpParamWay,
		config,
	});

	// console.log(" 最后请求前，看一下数据？ ", config);
	// console.log(" instance  ?", instance.defaults.baseURL);
	return useAxiosWrapper<
		//
		UseAxiosWrapperUseKey<HttpParamWayTemp, K>,
		JsonVO<T>,
		UseAxiosOptionsBase<JsonVO<T>>,
		D,
		O
	>({ config, instance, options, url });
}
