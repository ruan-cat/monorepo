import { type SimpleAsyncTask, type SimpleAsyncTaskWithType } from "./simple-promise-tools";

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

/**
 * 定义异步任务对象
 * @description
 * 这个对象是一揽子异步任务的配置
 */
export function definePromiseTasks(config: TasksConfig) {
	return config;
}
