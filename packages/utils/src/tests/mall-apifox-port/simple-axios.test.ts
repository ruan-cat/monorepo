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

// 该测试真实请求外部第三方教学接口（黑马商城 devtest 环境），其前置阿里云 WAF 会拦截 GitHub Actions 美国 runner 的首次请求（405 挑战）。
// 属于不可控的「外部世界健康检查」，默认 skip，不进确定性 CI 门禁；本地显式设置 RUN_EXTERNAL_API=1 才真实请求。
test.skipIf(!process.env.RUN_EXTERNAL_API)(`测试axios在node环境内的请求`, async () => {
	const res = await main();
	console.log(res.data);
});
