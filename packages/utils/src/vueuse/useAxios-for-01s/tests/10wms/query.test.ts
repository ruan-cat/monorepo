import { it } from "vitest";
import { printFormat } from "../../../../print";

// @ts-ignore
import { queryExample } from "./query.example.ts";

it("使用 query 接口", async () => {
	const { execute, data } = queryExample({
		onSuccess(data) {
			console.warn("query onSuccess", printFormat(data));
		},
		onError(error) {},
	});
	// 主动的做接口请求 从回调函数内获取返回值 或者直接使用解构出来的响应式 data 对象
	await execute({
		params: {
			id: "123",
		},
	});
	console.warn("查看简单的 data.value ", printFormat(data.value));
});
