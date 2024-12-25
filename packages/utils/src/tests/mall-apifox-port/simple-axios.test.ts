import axios from "axios";

/**
 * 创建axios实例
 * @description
 * 从商城项目内获取得来
 *
 * @see https://apifox.com/apidoc/shared-c05cb8d7-e591-4d9c-aff8-11065a0ec1de/api-67132167
 */
function createAxiosInstance() {
	const instance = axios.create({
		baseURL: "https://pcapi-xiaotuxian-front-devtest.itheima.net",

		/** 请求超时时间 */
		timeout: 10000,

		/** 允许跨域 */
		// withCredentials: true,
	});

	// 使用qs序列化参数params参数
	// instance.defaults.paramsSerializer = function (params) {
	// 	return qs.stringify(params);
	// };

	return instance;
}

function main() {
	axios
		.get(
			//
			//
			"https://pcapi-xiaotuxian-front-devtest.itheima.net/home/category/head",
			// "https://pcapi-xiaotuxian-front-devtest.itheima.net/home/hot"
		)
		.then((res) => {
			console.log(" ? ", res);
		});
}

main();
