import {
	type SimpleAsyncTask,
	type SimpleAsyncTaskWithType,
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
export async function executePromiseTasks(config: TasksConfig) {
	if (isSingleTasks(config)) {
		if (isSimpleAsyncTask(config.tasks)) {
			await config.tasks();
			return;
		}
		await executePromiseTasks(config.tasks);
		return;
	}

	if (isParallelTasks(config)) {
		await runPromiseByConcurrency(getPromises(config.tasks));
		return;
	}

	if (isQueueTasks(config)) {
		await runPromiseByQueue(getPromises(config.tasks));
		return;
	}
}
