import { consola } from "consola";
import { uniqueId } from "lodash-es";

import { definePromiseTasks, executePromiseTasks } from "../src/utils/define-promise-tasks";
import { generateSimpleAsyncTask, wait, testPromises } from "../src/utils/simple-promise-tools";

function generateArray<T>(params: { length: number; content: T }) {
	return Array(params.length)
		.fill(1)
		.map<T>(() => {
			return params.content;
		});
}

const getCounter = () => uniqueId();

async function preEciProjDir() {
	const taskId = getCounter();
	consola.start(` 开始 ${taskId} 预构建eci任务 `);
	await wait(10);
	consola.success(` 完成 ${taskId} 预构建eci任务 `);
}

async function link() {
	const taskId = getCounter();
	consola.start(` 开始 ${taskId} 链接任务 `);
	await wait(10);
	consola.success(` 完成 ${taskId} 链接任务 `);
}

async function build() {
	const taskId = getCounter();
	consola.start(` 开始 ${taskId} 构建任务 `);
	await wait(10);
	consola.success(` 完成 ${taskId} 构建任务 `);
}

async function buildAll() {
	const taskId = getCounter();
	consola.start(` 开始 ${taskId} turbo集体构建任务 `);
	await wait(10);
	consola.success(` 完成 ${taskId} turbo集体构建任务 `);
}

async function copyDist() {
	const taskId = getCounter();
	consola.start(` 开始 ${taskId} 移动目录任务 `);
	await wait(10);
	consola.success(` 完成 ${taskId} 移动目录任务 `);
}

async function deploy() {
	const taskId = getCounter();
	consola.start(` 开始 ${taskId} 部署任务 `);
	await wait(10);
	consola.success(` 完成 ${taskId} 部署任务 `);
}

const promiseTasksConfig1 = definePromiseTasks({
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

const promiseTasksConfig2 = definePromiseTasks({
	type: "single",
	tasks: {
		type: "queue",

		tasks: [
			// 某个预构建任务
			{
				type: "single",
				tasks: generateSimpleAsyncTask(preEciProjDir),
			},

			// 并发的链接任务
			{
				type: "parallel",
				tasks: generateArray({
					length: 3,
					content: generateSimpleAsyncTask(link),
				}),
			},

			// 并发的构建任务
			{
				type: "parallel",
				tasks: generateArray({
					length: 3,
					content: generateSimpleAsyncTask(build),
				}),
			},

			// 某个集体构建任务
			{
				type: "single",
				tasks: generateSimpleAsyncTask(buildAll),
			},

			// 移动目录任务
			{
				type: "parallel",
				tasks: generateArray({
					length: 3,
					content: generateSimpleAsyncTask(copyDist),
				}),
			},

			// 部署任务
			{
				type: "parallel",
				tasks: generateArray({
					length: 3,
					content: generateSimpleAsyncTask(deploy),
				}),
			},
		],
	},
});

const promiseTasksConfig3 = definePromiseTasks({
	type: "queue",
	tasks: testPromises,
});

executePromiseTasks(promiseTasksConfig3);
