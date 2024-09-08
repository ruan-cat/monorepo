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
type Task = SimpleAsyncTask | TasksConfig;

export interface SingleTasks extends BaseTask {
	type: "single";
	tasks: Task;
}

export interface ParallelTasks extends BaseTask {
	type: "parallel";
	/** 任务列表 */
	tasks: Task[];
}

export interface QueueTasks extends BaseTask {
	type: "queue";
	/** 任务列表 */
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
		await runPromiseByConcurrency(
			config.tasks.map((task) => async () => {
				if (isSimpleAsyncTask(task)) {
					await task();
				} else {
					await executePromiseTasks(task);
				}
			}),
		);
		return;
	}

	if (isQueueTasks(config)) {
		await runPromiseByQueue(
			config.tasks.map((task) => async () => {
				if (isSimpleAsyncTask(task)) {
					await task();
				} else {
					await executePromiseTasks(task);
				}
			}),
		);
		return;
	}
}
