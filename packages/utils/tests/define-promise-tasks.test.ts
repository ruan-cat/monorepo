import { expect, test } from "vitest";
import { consola } from "consola";
import { sleep } from "@antfu/utils";

import { definePromiseTasks, executePromiseTasks } from "../src/define-promise-tasks.ts";
import { generateSimpleAsyncTask } from "../src/simple-promise-tools.ts";

test("定义并运行异步任务对象", () => {
	executePromiseTasks(
		definePromiseTasks({
			type: "queue",
			tasks: [
				{
					type: "parallel",
					tasks: new Array(5).fill(0).map(() =>
						generateSimpleAsyncTask(async () => {
							return sleep(1000, () => {
								consola.info("这是第一个任务");
							});
						}),
					),
				},
			],
		}),
	);
});
