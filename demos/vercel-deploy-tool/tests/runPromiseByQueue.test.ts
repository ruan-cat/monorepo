import { expect, test } from "vitest";
import {
	runPromiseByQueue,
	wait,
	generateSimpleAsyncTask,
	testPromises,
} from "@ruan-cat/vercel-deploy-tool/src/utils/simple-promise-tools.ts";

runPromiseByQueue(testPromises);

test("执行异步函数", () => {
	// expect(runPromiseByQueue(promises));
	runPromiseByQueue(testPromises);
});
