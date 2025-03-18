import { test } from "vitest";
import { homeCategoryHead } from "./homeCategoryHead";

test("使用homeCategoryHead接口", async () => {
	const { execute, data } = homeCategoryHead({
		onSuccess(data) {
			console.log(` 在 onSuccess 回调内， 输出结果？ `, data.result);
		},
	});
	await execute({
		data: {
			vip: true,
		},
	});
	console.log(` 输出结果？ `, data.value?.result);
});
