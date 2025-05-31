import { it } from "vitest";

import { queryExample } from "./query.example";

it("使用 query 接口", async () => {
	const { execute, data, isLoading, isFinished } = queryExample({
		onSuccess(data) {
			console.log("query onSuccess", data);
		},
		onError(error) {},
		onFinish() {},
	});
	// 主动的做接口请求 从回调函数内获取返回值 或者直接使用解构出来的响应式 data 对象
	await execute({
		data: {
			id: "123",
		},
	});
	console.log("查看简单的 data.value ", data.value);
});
