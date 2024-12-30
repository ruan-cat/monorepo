import { test } from "vitest";
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

		/**
		 * 在node内运行axios，需要屏蔽掉代理，避免请求失败。
		 * @see https://github.com/axios/axios/issues/925
		 * @see https://stackoverflow.com/questions/77258713/400-the-plain-http-request-was-sent-to-https-port-in-node-js
		 */
		proxy: false,
	});
	return instance;
}

async function main() {
	const instance = createAxiosInstance();
	return instance.get("/home/category/head");
}

test(`测试axios在node环境内的请求`, async () => {
	const res = await main();
	console.log(res.data);
});
