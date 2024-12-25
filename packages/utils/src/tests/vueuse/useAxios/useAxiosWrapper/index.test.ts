import axios from "axios";
import qs from "qs";
import { test } from "vitest";

import { useAxiosWrapper } from "@ruan-cat/utils";
import type { KeyHelper } from "@ruan-cat/utils";
import type {
	ApifoxModel,
	Child,
	Good,
	HomeCategoryHeads,
} from "@utils/tests/vueuse/useAxios/useAxiosWrapper/types/index";

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
	instance.defaults.paramsSerializer = function (params) {
		return qs.stringify(params);
	};

	return instance;
}

const instance = createAxiosInstance();

function homeCategoryHead() {
	return useAxiosWrapper<ApifoxModel<HomeCategoryHeads[]>, KeyHelper<"url">>({
		config: {
			url: "/home/category/head",
			method: "get",
		},
		instance,
		options: {
			immediate: false,
		},
	});
}

async function main() {
	// const { execute, data } = homeCategoryHead();
	// await execute();
	// console.log(" ？  ", data.value);

	// const res = await instance.get("/home/category/head");
	const res = await instance.get("/home/hot");
	console.log(" ?  ", res);
}

main();

// test("测试接口请求", async () => {
// 	await main();
// });
