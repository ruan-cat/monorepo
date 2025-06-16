import axios from "axios";
import qs from "qs";

/**
 * 创建axios实例
 * @description
 * @see https://01s-11.apifox.cn/
 */
function createAxiosInstance() {
	/**  */
	const baseURL = "https://m1.apifoxmock.com/m1/6386631-6083270-default";

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

const axiosInstance = createAxiosInstance();

import type { ParamsQueryKey, UseAxiosOptionsJsonVO, PageDTO } from "../../index.ts";
// @ts-ignore
import { useRequestIn01s } from "../../index.ts";

/**
 * 业委会成员列表数据模型
 */
interface CommitteeMemberListItem {
	/** 住址 */
	address: string;
	/** 届期 */
	appointTime: string;
	/** 任期 */
	curTime: string;
	/** 身份证 */
	idCard: string;
	/** 电话 */
	link: string;
	/** 姓名 */
	name: string;
	/** 编号 */
	ocId: string;
	/** 职位 */
	position: string;
	/** 岗位 */
	post: string;
	/** 性别 */
	sex: string;
	/** 状态 */
	state: string;
}

/**
 * 获取业委会列表参数
 */
interface QueryCommitteeListParams {
	/** 联系电话 */
	link?: string;
	/** 业委会名称 */
	name?: string;
	/** 查询页码 */
	pageIndex: number;
	/** 查询条数 */
	pageSize: number;
	/**
	 * 状态 业委会在职状态
	 * @description
	 * - 在职
	 * - 离职
	 */
	state?: string;
}

/**
 * 获取业委会列表
 * @description 获取业委会列表(条件+分页)
 */
export function queryCommitteeList<T = PageDTO<CommitteeMemberListItem>>(options: UseAxiosOptionsJsonVO<T>) {
	return useRequestIn01s<ParamsQueryKey, T, QueryCommitteeListParams>({
		url: "/j8-housemgt/committee/query-list",
		options,
		instance: axiosInstance,
		httpParamWay: "query",
		config: {
			method: "GET",
			params: {
				pageIndex: 1,
				pageSize: 10,
				state: "1000",
			},
		},
	});
}

// 直接请求？
const { execute } = queryCommitteeList({
	onSuccess: (response) => {
		console.log("请求成功：", response);
	},
	onError: (error) => {
		console.error("请求失败：", error);
	},
});

async function mainTest() {
	await execute({
		params: {
			pageIndex: 1,
			pageSize: 1,
			state: "1000",
		},
	});
	await execute({
		params: {
			pageIndex: 3,
			pageSize: 1,
			state: "1000",
		},
	});
}

mainTest();
