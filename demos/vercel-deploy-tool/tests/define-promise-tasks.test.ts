import { consola } from "consola";
import { uniqueId } from "lodash-es";

import { definePromiseTasks } from "../src/utils/define-promise-tasks";
import { generateSimpleAsyncTask, wait } from "../src/utils/simple-promise-tools";

function generateArray<T>(params: { length: number; content: T }) {
	return Array(params.length)
		.fill(1)
		.map<T>(() => {
			return params.content;
		});
}

const counter = uniqueId("");

async function link() {
	consola.start(" 开始链接任务 ");
	consola.info(` 这是 ${counter + 1} 个任务`);
	await wait(300);
	consola.success(" 完成链接任务 ");
	console.log("\n");
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
