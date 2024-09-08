import { consola } from "consola";
import { uniqueId } from "lodash-es";

import { definePromiseTasks, executePromiseTasks } from "../src/utils/define-promise-tasks";
import { generateSimpleAsyncTask, wait } from "../src/utils/simple-promise-tools";

function generateArray<T>(params: { length: number; content: T }) {
	return Array(params.length)
		.fill(1)
		.map<T>(() => {
			return params.content;
		});
}

const getCounter = () => uniqueId();

async function link() {
	const taskId = getCounter();

	consola.start(` 开始 ${taskId} 链接任务 `);
	await wait(250);
	consola.success(` 完成 ${taskId} 链接任务 `);

	// console.log("\n");
}

const promiseTasksConfig = definePromiseTasks({
	type: "queue",
	tasks: [
		{
			type: "parallel",
			tasks: generateArray({
				length: 3,
				content: generateSimpleAsyncTask(link),
			}),
		},

		{
			type: "single",
			tasks: generateSimpleAsyncTask(link),
		},

		{
			type: "single",
			tasks: {
				type: "single",
				tasks: generateSimpleAsyncTask(link),
			},
		},

		{
			type: "queue",
			tasks: [
				{
					type: "single",
					tasks: generateSimpleAsyncTask(link),
				},
				{
					type: "single",
					tasks: generateSimpleAsyncTask(link),
				},
				generateSimpleAsyncTask(link),
			],
		},
	],
});

executePromiseTasks(promiseTasksConfig);
