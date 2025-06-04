import { it } from "vitest";
import { printFormat } from "../../../../print";

// @ts-ignore
import { bodyExample } from "./body.example.ts";

it("使用 body 接口", async () => {
	const { execute, data } = bodyExample({
		onSuccess(data) {
			console.warn("body onSuccess", printFormat(data));
		},
		onError(error) {},
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
	console.warn("查看简单的 data.value ", printFormat(data.value));
});
