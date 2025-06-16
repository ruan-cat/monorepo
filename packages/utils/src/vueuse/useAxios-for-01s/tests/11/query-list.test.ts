import { it, expect } from "vitest";
import { printFormat } from "../../../../print";

import { queryCommitteeList } from "./query-list.example";

it("使用 query 查询列表页接口", async () => {
	const { execute, data } = queryCommitteeList({
		onSuccess(data) {
			console.warn("query onSuccess", printFormat(data));
		},
		onError(error) {},
	});
	// 主动的做接口请求 从回调函数内获取返回值 或者直接使用解构出来的响应式 data 对象
	await execute({
		params: {
			pageIndex: 1,
			pageSize: 10,
		},
	});
	console.warn("查看简单的 pageIndex=1 ", printFormat(data.value));
	expect(data.value?.message).toBe("页码1 页数10");

	await execute({
		params: {
			pageIndex: 1,
			pageSize: 1,
		},
	});
	console.warn("查看简单的 pageIndex=1 pageSize=1 ", printFormat(data.value));
	expect(data.value?.message).toBe("页码1 页数1");

	await execute({
		params: {
			pageIndex: 3,
			pageSize: 1,
		},
	});
	console.warn("查看简单的 pageIndex=3 pageSize=1 ", printFormat(data.value));
	expect(data.value?.message).toBe("页码3 页数1");
});
