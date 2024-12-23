import axios from "axios";

/**
 * 创建axios实例
 */
export function createAxiosInstance() {
	const instance = axios.create({
		baseURL: "https://pcapi-xiaotuxian-front-devtest.itheima.net",

		/** 请求超时时间 */
		timeout: 10000,

		/** 允许跨域 */
		withCredentials: true,
	});

	// 使用qs序列化参数params参数
	instance.defaults.paramsSerializer = function (params) {
		// 有疑惑 formdata 格式和这个有什么关系？
		return qs.stringify(params);
	};

	return instance;
}
