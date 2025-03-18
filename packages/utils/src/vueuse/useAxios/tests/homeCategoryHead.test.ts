import { test } from "vitest";
import { homeCategoryHead } from "@ruan-cat/utils/src/vueuse/useAxios/tests/homeCategoryHead.ts";

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
