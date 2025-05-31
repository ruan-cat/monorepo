import { it } from "vitest";

// @ts-ignore
import { pathExample } from "./path.example.ts";

/** 要被删除项的id 需要自己准备好 */
const id = "wgwegherth";

it("使用 path 接口", async () => {
	const { execute, data, isLoading, isFinished } = pathExample({
		onSuccess(data) {
			console.log("path onSuccess", data);
		},
		onError(error) {},
		onFinish() {},
	});
	// 主动的做接口请求 从回调函数内获取返回值 或者直接使用解构出来的响应式 data 对象
	await execute({
		url: `/sysmanager/typegroup/remove/${id}`,
	});
	console.log("查看简单的 data.value ", data.value);
});
