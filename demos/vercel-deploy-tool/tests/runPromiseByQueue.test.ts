import { expect, test } from "vitest";
// FIXME: 处理别名识别失败的错误 无法识别并执行
// import { runPromiseByQueue, wait } from "@/utils/simple-promise-tools";
import { runPromiseByQueue, wait, generateSimpleAsyncTask, testPromises } from "../src/utils/simple-promise-tools";

runPromiseByQueue(testPromises);

test("执行异步函数", () => {
	// expect(runPromiseByQueue(promises));
	runPromiseByQueue(testPromises);
});
