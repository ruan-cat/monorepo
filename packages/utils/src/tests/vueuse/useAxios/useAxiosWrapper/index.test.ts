import axios from "axios";
import qs from "qs";
import { test } from "vitest";

import type { PartialPick } from "type-plus";
import { useAxiosWrapper } from "@ruan-cat/utils/vueuse";
import type {
	UseAxiosOptions,
	KeyHelper,
	UseAxiosWrapperParams,
	KeyAxiosRequestConfig,
	RemoveUrl,
} from "@ruan-cat/utils/vueuse";
import type { ApifoxModel, Child, Good, HomeCategoryHeads } from "./types/index";

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

const instance = createAxiosInstance();

interface _Params<T = any, K extends KeyAxiosRequestConfig<D> = "url", D = any>
	extends UseAxiosWrapperParams<T, K, UseAxiosOptions<ApifoxModel<T>>, D> {}

type Params = PartialPick<_Params, "instance" | "options">;

function projectRequest<T = any, K extends KeyAxiosRequestConfig = "url", D = any>(params: Params) {
	const {
		config,
		options = {
			immediate: false,
		},
		instance = createAxiosInstance(),
	} = params;
	return useAxiosWrapper<ApifoxModel<T>, RemoveUrl<K>, D>({ config, instance, options });
}

/** 使用 projectRequest 包装过类型的业务接口 */
function homeCategoryHead_projectRequest() {
	return projectRequest<
		HomeCategoryHeads[],
		KeyHelper<"data">,
		{
			testsP: `testsP_${number}`;
		}
	>({
		config: {
			url: "/home/category/head",
			method: "get",
		},
	});
}

/** 直接使用 useAxiosWrapper 的业务接口 */
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

test("测试接口请求", async () => {
	const homeCategoryHeadObj = homeCategoryHead();
	await homeCategoryHeadObj.execute();
	console.log(` 输出结果？ `, homeCategoryHeadObj.data.value);

	const homeCategoryHead_projectRequestObj = homeCategoryHead_projectRequest();
	// 经过类型测试 这里实际请求的函数可以得到类型约束
	homeCategoryHead_projectRequestObj.execute({
		data: {
			testsP: "testsP_1",
		},
	});
});
