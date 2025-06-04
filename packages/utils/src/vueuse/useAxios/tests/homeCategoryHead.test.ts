import { test } from "vitest";
import { homeCategoryHead } from "./homeCategoryHead";
import { printFormat } from "../../../print";

test("使用homeCategoryHead接口", async () => {
	const { execute, data } = homeCategoryHead({
		onSuccess(data) {
			console.warn(` 在 onSuccess 回调内， 输出结果？ `, printFormat(data.result));
		},
	});
	await execute({
		data: {
			vip: true,
		},
	});
	console.warn(` 输出结果？ `, printFormat(data.value?.result));
});
