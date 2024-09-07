import { expect, test } from "vitest";
// FIXME: 处理别名识别失败的错误 无法识别并执行
// import { runPromiseByQueue, wait } from "@/utils/simple-promise-tools";
import { runPromiseByQueue, wait, generateSimpleAsyncTask, testPromises } from "../src/utils/simple-promise-tools";

const promises = [
	generateSimpleAsyncTask(() =>
		wait({
			time: 500,
			cb() {
				console.log(" 1 ");
				return 1;
			},
		}),
	),
	generateSimpleAsyncTask(() =>
		wait({
			time: 500,
			cb() {
				console.log(" 2 ");
				return 1;
			},
		}),
	),
	generateSimpleAsyncTask(() =>
		wait({
			time: 500,
			cb() {
				console.log(" 3 ");
				return 1;
			},
		}),
	),
];

runPromiseByQueue(testPromises);

test("执行异步函数", () => {
	// expect(runPromiseByQueue(promises));
	runPromiseByQueue(testPromises);
});
