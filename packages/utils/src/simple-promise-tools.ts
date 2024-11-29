// import { uniqueId } from "lodash-es";
// const getCounter = () => uniqueId();

/** 创建简单的异步任务 */
export function generateSimpleAsyncTask<T extends (...args: any) => any>(func: T) {
	// const taskId = getCounter();

	return function (...args: any) {
		// consola.info(` 这是第 ${taskId} 个异步任务 `);
		// consola.start(" 这里是新创建的异步函数 检查参数： ", ...args);

		return new Promise<ReturnType<T>>((resolve, reject) => {
			// consola.start(" 内部promise 检查参数： ", ...args);
			resolve(func(...args));
		});
	};
}

export type SimpleAsyncTask = ReturnType<typeof generateSimpleAsyncTask>;

export const initFlag = <const>"initFlag";

/**
 * 以队列串行的形式 串行运行异步函数
 * @see https://github.com/ascoders/weekly/blob/master/前沿技术/77.精读《用%20Reduce%20实现%20Promise%20串行执行》.md
 * @version 1
 */
async function runPromiseByQueueV1<T>(promises: ((...args: any) => Promise<T>)[]) {
	promises.reduce(
		async function (previousPromise, nextPromise, currentIndex) {
			const response = await previousPromise;
			// consola.log(` reduce串行函数 currentIndex= ${currentIndex} res =`, response);
			return await nextPromise(response);
		},
		Promise.resolve(initFlag) as Promise<any>,
	);
}

/**
 * 以队列串行的形式 串行运行异步函数
 * @version 2
 */
export async function runPromiseByQueue<T>(promises: ((...args: any) => Promise<T>)[]) {
	let response: typeof initFlag | Awaited<T> = initFlag;
	for await (const promise of promises) {
		response = await promise(response);
	}
}

/**
 * 以并行的形式 并发运行异步函数
 */
export async function runPromiseByConcurrency<T>(promises: ((...args: any) => Promise<T>)[]) {
	await Promise.all(promises.map((promise) => promise()));
}
