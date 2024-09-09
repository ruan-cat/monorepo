import { consola } from "consola";
import { uniqueId } from "lodash-es";

import {
	definePromiseTasks,
	executePromiseTasks,
	type BaseTask,
	type ParallelTasks,
	type QueueTasks,
	type Task,
} from "../src/utils/define-promise-tasks";
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

/** 链接任务 */
const linkTask: Task = {
	type: "parallel",
	tasks: generateArray({
		length: 1,
		content: generateSimpleAsyncTask(link),
	}),
};

/** 打包任务 */
const buildTask: Task = {
	type: "parallel",
	tasks: generateArray({
		length: 1,
		content: generateSimpleAsyncTask(async () => {
			console.log(` 开始build `);
			await wait(100);
			console.log(` 完成build `);
		}),
	}),
};

/** 用户任务 */
const userTask: Task = {
	type: "parallel",
	tasks: [
		{
			type: "queue",
			tasks: [
				generateSimpleAsyncTask(() => {
					consola.warn(" 当前目标不属于需要执行一系列用户自定义命令。 ");
				}),
			],
		},

		{
			type: "queue",
			tasks: [
				// 用户命令
				{
					type: "queue",
					tasks: [
						generateSimpleAsyncTask(async () => {
							console.log(` 开始构建 `);
							await wait(1000);
							console.log(` 完成1秒的构建 `);
							return 1;
						}),

						generateSimpleAsyncTask(async () => {
							console.log(` 开始用户命令2 `);
							await wait(100);
							console.log(` 完成用户命令2 `);
							return 2;
						}),
					],
				},

				// 移动任务
				{
					type: "queue",
					tasks: [
						generateSimpleAsyncTask(async () => {
							console.log(` 删除 `);
							await wait(50);
						}),
						generateSimpleAsyncTask(async () => {
							console.log(` 新建 `);
							await wait(50);
						}),
						generateSimpleAsyncTask(async () => {
							console.log(` 移动 `);
							await wait(50);
						}),
						generateSimpleAsyncTask(async () => {
							console.log(` 打印 `);
							await wait(50);
						}),
					],
				},
			],
		},
	],
};

/** 部署任务 */
const depolyTask_1: Task = {
	type: "parallel",
	tasks: Array(1)
		.fill(1)
		.map((item) => {
			return {
				type: "queue",
				tasks: [
					// 部署生成url
					generateSimpleAsyncTask(async () => {
						console.log(` 开始部署 `);
						await wait(1000);
						console.log(` 部署成功 `);
						return "https://notes.ruan-cat.com";
					}),

					generateSimpleAsyncTask(async (vercelUrlFormLast: string) => {
						consola.log(` 准备生成别名任务，检查上一个任务是否传递了生成的URL `, vercelUrlFormLast);

						const aliasTasks = generateArray({
							length: 4,
							content: generateSimpleAsyncTask(async (vercelUrl: string = vercelUrlFormLast) => {
								console.log(` 别名任务得到参数 `, vercelUrl);
								await wait(500);
								console.log(` 链接成功 `);
							}),
						});

						// return {
						// 	type: "parallel",
						// 	tasks: aliasTasks,
						// };
						return await executePromiseTasks({
							type: "parallel",
							tasks: aliasTasks,
						});
					}),
				],
			};
		}),
};

/** 部署任务 */
const depolyTask_2: Task = {
	type: "parallel",
	tasks: Array(3)
		.fill(1)
		.map((item, indx) => {
			return {
				type: "queue",
				tasks: [
					// 部署生成url
					generateSimpleAsyncTask(async () => {
						console.log(` 开始部署 `);
						await wait(1000);
						console.log(` 部署成功 `);
						return `https://notes-${indx + 1}.ruan-cat.com`;
					}),

					generateSimpleAsyncTask(async (vercelUrlFormLast: string) => {
						consola.log(` 准备生成别名任务，检查上一个任务是否传递了生成的URL `, vercelUrlFormLast);

						const aliasTasks = generateArray({
							length: 2,
							content: generateSimpleAsyncTask(async (vercelUrl: string) => {
								console.log(` notes-${indx + 1} 别名任务得到参数 `, vercelUrl);
								await wait(500);
								console.log(` 链接成功 `);
							}),
						});

						// return {
						// 	type: "parallel",
						// 	tasks: aliasTasks,
						// };
						return await executePromiseTasks(
							{
								type: "parallel",
								tasks: aliasTasks,
							},
							vercelUrlFormLast,
						);
					}),
				],
			};
		}),
};

const promiseTasksConfig4 = definePromiseTasks({
	type: "queue",
	tasks: [linkTask, buildTask, userTask, depolyTask_1],
});

const promiseTasksConfig5 = definePromiseTasks({
	type: "queue",
	tasks: [depolyTask_2],
});

await executePromiseTasks(promiseTasksConfig5);
