import axios from "axios";
import qs from "qs";

/**
 * 创建axios实例
 * @description
 * 从商城项目内获取得来
 *
 * @see https://apifox.com/apidoc/shared-c05cb8d7-e591-4d9c-aff8-11065a0ec1de/api-67132167
 */
export function createAxiosInstance() {
	const instance = axios.create({
		baseURL: "https://pcapi-xiaotuxian-front-devtest.itheima.net",

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
