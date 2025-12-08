import task from "tasuku";

export { task };
export type { TaskFunction } from "tasuku";

/**
 * 并行执行任务组
 * @description
 * 封装 tasuku 的 task.group，提供更简洁的 API
 *
 * @example
 * ```ts
 * await executeParallel("Link 项目", [
 *   { name: "Link target 1", fn: async () => {...} },
 *   { name: "Link target 2", fn: async () => {...} }
 * ]);
 * ```
 */
export async function executeParallel<T>(
	title: string,
	tasks: Array<{ name: string; fn: () => Promise<T> }>,
	options?: { concurrency?: number },
) {
	return await task.group((task) => tasks.map((t) => task(t.name, t.fn)), options);
}

/**
 * 顺序执行任务组
 * @description
 * 逐个执行任务，每个任务完成后再执行下一个
 *
 * @example
 * ```ts
 * await executeSequential("执行构建任务", [
 *   { name: "Task 1", fn: async () => {...} },
 *   { name: "Task 2", fn: async () => {...} }
 * ]);
 * ```
 */
export async function executeSequential<T = any>(
	title: string,
	tasks: Array<{ name: string; fn: () => Promise<T> }>,
): Promise<T[]> {
	const results: T[] = [];
	for (const t of tasks) {
		const result = await task(t.name, t.fn);
		results.push(result.result);
	}
	return results;
}
