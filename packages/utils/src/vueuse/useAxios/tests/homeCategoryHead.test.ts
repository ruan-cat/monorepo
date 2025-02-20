import { test } from "vitest";

import { homeCategoryHead } from "./homeCategoryHead.ts";

test("使用homeCategoryHead接口", async () => {
	const { execute, data } = homeCategoryHead();
	await execute({
		data: {
			vip: true,
		},
	});
	console.log(` 输出结果？ `, data.value?.result);
});
