import { it } from "vitest";

import { bodyExample } from "./body.example";

it("使用 body 接口", async () => {
	const { execute, data, isLoading, isFinished } = bodyExample({
		onSuccess(data) {
			console.log("body onSuccess", data);
		},
		onError(error) {},
		onFinish() {},
	});
	// 主动的做接口请求 从回调函数内获取返回值 或者直接使用解构出来的响应式 data 对象
	await execute({
		data: {
			id: "123",
			iconId: "456",
			name: "分类名称",
			parentId: "上级id",
		},
	});
	console.log("查看简单的 data.value ", data.value);
});
