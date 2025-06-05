import type { UseAxiosOptionsBase } from "@vueuse/integrations/useAxios";
import type { AxiosRequestConfig } from "axios";

import { isNil, merge } from "lodash-es";
import qs from "qs";

import type { JsonVO } from "./types/JsonVO";
import { isConditionsSome } from "../../index";

/**
 * http的接口传参方式
 * @description
 * 用于控制接口请求时的参数传递方式
 * @see https://www.cnblogs.com/jinyuanya/p/13934722.html
 */
export type HttpParamWay =
	// 路径传参
	| "path"
	// query传参
	| "query"
	// body传参
	| "body";

/**
 * 基础的 axios.config 必填项字段
 * @description
 * 用于说明axios配置必须传递method字段
 * @version 2
 */
export type AxiosRequestConfigBaseKey = "method";

/**
 * 数据上传数据类型
 * @description
 * 一个标记工具，用来控制上传数据的格式
 *
 * 目前没有发现axios有类似的上传类型声明
 */
export enum UpType {
	/** 表单类型 */
	form = 0,

	/** json类型 */
	json = 1,

	/** 文件类型 */
	file = 3,

	/** 文件流类型 */
	stream = 4,
}

/**
 * HTTP状态码
 * @description
 * 待优化 未来可以直接复用axios内提供的值 不需要额外地封装工具
 */
export enum HttpCode {
	/** 暂未登录或TOKEN已经过期 */
	UNAUTHORIZED = 401,
	/** 没有相关权限 */
	FORBIDDEN = 403,
	/** 访问页面未找到 */
	NOT_FOUND = 404,
	/** 服务器错误 */
	SERVER_ERROR = 9994,
	/** 上传参数异常 */
	PARAMS_INVALID = 9995,
	/** ContentType错误 */
	CONTENT_TYPE_ERR = 9996,
	/** 功能尚未实现 */
	API_UN_IMPL = 9997,
	/** 服务器繁忙 */
	SERVER_BUSY = 9998,
	/** 操作失败 */
	FAIL = 9999,
	/** 操作成功 */
	SUCCESS = 10000,
}

/**
 * 请求结果分类
 * @description
 * 成功 失败 错误
 */
export type HttpStatus = "success" | "fail" | "error";

/** 接口请求状态是否是成功的？ */
export function isHttpStatusSuccess(status: HttpStatus): status is "success" {
	return status === "success";
}

/**
 * http码的映射存储值
 * @description
 * 根据业务类型存储不同的值
 */
export interface HttpCodeMessageMapValue {
	/** 接口提示文本 */
	message: string;
	/** 接口请求状态 */
	type: HttpStatus;
}

/** 请求码与请求响应文本的映射表 */
export const HttpCodeMessageMap: Record<HttpCode, HttpCodeMessageMapValue> = {
	[HttpCode.UNAUTHORIZED]: { message: "未登录或登录已过期，请重新登录", type: "error" },
	[HttpCode.FORBIDDEN]: { message: "没有相关权限", type: "error" },
	[HttpCode.NOT_FOUND]: { message: "访问页面未找到", type: "error" },
	[HttpCode.SERVER_ERROR]: { message: "服务器错误", type: "error" },
	[HttpCode.PARAMS_INVALID]: { message: "上传参数异常", type: "error" },
	[HttpCode.CONTENT_TYPE_ERR]: { message: "ContentType错误", type: "error" },
	[HttpCode.API_UN_IMPL]: { message: "功能尚未实现", type: "error" },
	[HttpCode.SERVER_BUSY]: { message: "服务器繁忙", type: "error" },
	[HttpCode.FAIL]: { message: "操作失败", type: "fail" },
	[HttpCode.SUCCESS]: { message: "操作成功", type: "success" },
};

/**
 * 上传类型-请求体类型 枚举
 * @description
 * 待优化 未来可以直接复用axios内提供的值 不需要额外地封装工具
 */
export enum MapContentTypeUpType {
	"application/json;charset=UTF-8" = UpType.json,
	"multipart/form-data" = UpType.file,
	"application/octet-stream" = UpType.stream,
	"application/x-www-form-urlencoded;charset=UTF-8" = UpType.form,
}

/** @private */
type ContentType = keyof typeof MapContentTypeUpType;

/**
 * 根据数据上传类型 重设请求头类型
 * @description
 * 不同的数据上传数据类型 要使用不同的接口请求方式
 *
 * 不再有返回值
 * @version 2
 */
export function setHeaders(config: AxiosRequestConfig, upType: UpType = UpType.json) {
	const contentType = MapContentTypeUpType[upType] as ContentType;
	if (contentType) {
		config = merge<AxiosRequestConfig, AxiosRequestConfig>(config, {
			headers: {
				"Content-Type": contentType,
			},
		});
	}
	if (!isNil(config.data) && upType === UpType.form) {
		config.data = qs.stringify(config.data, { arrayFormat: "repeat" });
	}
	if (!isNil(config.data) && upType === UpType.file) {
		const formData = new FormData();
		for (const key in config.data) {
			formData.append(key, config.data[key]);
		}
		config.data = formData;
	}
}

/**
 * 提供默认返回值的包装类型
 * @description
 * 预期会在每一个接口的包装函数内使用 用来定义 useAxios 的options参数
 *
 * 该类型应该成为高频使用的工具类型
 *
 * 被设计成一个简单的类型 而不是interface接口
 * @version 2
 */
export type UseAxiosOptionsJsonVO<T = any> = UseAxiosOptionsBase<JsonVO<T>>;

/** useAxios的选项配置 且默认带有immediate属性 不立刻执行 */
export interface UseAxiosOptionsImmediate<T = any> extends UseAxiosOptionsJsonVO<T> {
	/**
	 * @default false
	 * @description
	 * 默认为 false 不立刻执行
	 */
	immediate: boolean;
}

/** 生成默认的选项配置 */
export function createDefaultUseAxiosOptions<T = any>(): UseAxiosOptionsImmediate<T> {
	return {
		immediate: false,
	};
}

/**
 * 设置默认的 useAxiosOptions 参数值
 * @description
 * 设置 immediate 的值
 *
 * 如果外部没有传递 immediate 属性，那么就使用默认的值
 *
 * 每个业务接口都会传递 options 值，本函数用来完成默认的参数补全。
 */
export function setDefaultUseAxiosOptions<T>(options: UseAxiosOptionsBase<T>) {
	const _options = createDefaultUseAxiosOptions();
	options.immediate = options?.immediate ?? _options.immediate;
}

/** @private */
interface SetDataByHttpParamWayParams {
	httpParamWay: HttpParamWay;
	config: AxiosRequestConfig;
}
export function setDataByHttpParamWay(params: SetDataByHttpParamWayParams) {
	const { httpParamWay, config } = params;
	if (
		isConditionsSome([
			//
			() => config.method === "GET",
			() => config.method === "get",
			() => httpParamWay === "query",
		])
	) {
		config.params = config.data;
	}
}
