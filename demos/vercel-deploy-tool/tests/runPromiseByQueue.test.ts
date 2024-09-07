import { expect, test } from "vitest";
import { runPromiseByQueue, wait } from "@/utils/simple-promise-tools";

const promises = [
	function () {
		return wait({
			time: 1000,
			cb: () => 1,
		});
	},

	function () {
		return wait({
			time: 2000,
			cb: () => 1,
		});
	},

	function () {
		return wait({
			time: 500,
			cb: () => 1,
		});
	},
];

test("执行异步函数", () => {
	expect(runPromiseByQueue(promises));
});
