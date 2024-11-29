import { consola } from "consola";
import { sleep } from "@antfu/utils";

import { definePromiseTasks, executePromiseTasks } from "../src/define-promise-tasks.ts";
import { generateSimpleAsyncTask } from "@/simple-promise-tools.ts";

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
