import {
	type SimpleAsyncTask,
	type SimpleAsyncTaskWithType,
	generateSimpleAsyncTask,
	runPromiseByConcurrency,
	runPromiseByQueue,
} from "./simple-promise-tools";

export const taskTypes = <const>["single", "parallel", "queue"];

export type TaskType = (typeof taskTypes)[number];

export interface BaseTask {
	/** 任务类型 */
	type: TaskType;
}

// type Task = SimpleAsyncTaskWithType | TasksConfig;
export type Task = SimpleAsyncTask | TasksConfig;

export interface SingleTasks extends BaseTask {
	type: "single";
	tasks: Task;
}

export interface ParallelTasks extends BaseTask {
	type: "parallel";
	tasks: Task[];
}

export interface QueueTasks extends BaseTask {
	type: "queue";
	tasks: Task[];
}

export type TasksConfig = SingleTasks | ParallelTasks | QueueTasks;

export type PromiseTasksConfig = TasksConfig;

function isSingleTasks(config: TasksConfig): config is SingleTasks {
	return config.type === "single";
}

function isParallelTasks(config: TasksConfig): config is ParallelTasks {
	return config.type === "parallel";
}

function isQueueTasks(config: TasksConfig): config is QueueTasks {
	return config.type === "queue";
}

function isSimpleAsyncTask(config: Task): config is SimpleAsyncTask {
	return typeof config === "function";
}

function isTasksConfig(config: Task): config is TasksConfig {
	return typeof config === "object";
}

/**
 * 定义异步任务对象
 * @description
 * 这个对象是一揽子异步任务的配置
 */
export function definePromiseTasks(config: TasksConfig) {
	return config;
}

/**
 * @private 一个工具函数 用于生成异步函数数组
 * @deprecated 在处理串行任务时 疑似有故障
 */
function getPromises(tasks: Task[]): ((...args: any) => Promise<any>)[] {
	return tasks.map((task) => {
		return async function (...args: any) {
			if (isSimpleAsyncTask(task)) {
				return await task(...args);
			} else {
				return await executePromiseTasks(task);
			}
		};
	});
}

/**
 * 执行异步函数对象
 */
export async function executePromiseTasks(
	config: TasksConfig,
	/**
	 * 上一次递归执行时提供的参数
	 * @description
	 * 考虑到递归函数 这里提供了一个参数 用于传递上一次递归执行的结果
	 */
	lastParams: any = null,
): Promise<any> {
	if (isSingleTasks(config)) {
		if (isSimpleAsyncTask(config.tasks)) {
			// 实际执行的 tasks 往往是无参函数 这里为了保险，故主动传递参数
			return await config.tasks(lastParams);
		}

		return await executePromiseTasks(config.tasks, lastParams);
	}

	if (isParallelTasks(config)) {
		return await Promise.all(
			config.tasks.map((task) => {
				if (isSimpleAsyncTask(task)) {
					// console.log(` 并行任务遇到单独的异步函数 `);
					return task(lastParams);
				}

				// console.log(` 并行任务遇到嵌套结构 `);
				return executePromiseTasks(task, lastParams);
			}),
		);
	}

	if (isQueueTasks(config)) {
		let res: Awaited<any>;
		for await (const task of config.tasks) {
			if (isSimpleAsyncTask(task)) {
				// console.log(` 串行任务遇到单独的异步函数 `);

				res = await task(lastParams);
				lastParams = res;
				console.log(` 串行任务 单独 res `, res);
			} else {
				res = await executePromiseTasks(task, lastParams);
				lastParams = res;
				console.log(` 串行任务 配置 res `, res);
			}
		}

		return res;
	}
}
