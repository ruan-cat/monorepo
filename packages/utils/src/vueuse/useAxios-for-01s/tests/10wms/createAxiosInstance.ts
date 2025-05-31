import axios from "axios";
import qs from "qs";

/**
 * 创建axios实例
 * @description
 * @see https://01s-10wms-clone.apifox.cn/
 */
export function createAxiosInstance() {
	const baseURL = "https://m1.apifoxmock.com/m1/6142648-5834505-default";

	const instance = axios.create({
		baseURL,

		/** 请求超时时间 */
		timeout: 10000,

		/** 允许跨域 */
		withCredentials: true,

		/**
		 * 在 vitest 内做接口请求时，会使用node环境内的环境变量
		 * 比如 HTTPS_PROXY 变量。这里设置为false，不使用代理。
		 */
		proxy: false,
	});

	// 使用qs序列化参数params参数
	instance.defaults.paramsSerializer = function (params) {
		return qs.stringify(params);
	};

	return instance;
}

/**
 * 接口请求时用的请求实例
 * @description
 * 目前作为专用于 useAxios 的接口请求实例
 */
export const axiosInstance = createAxiosInstance();
