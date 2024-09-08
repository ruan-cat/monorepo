import { consola } from "consola";

export function wait(time: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
}

/** 创建简单的异步任务 */
export function generateSimpleAsyncTask<T extends (...args: any) => any>(func: T) {
	return function (...args: any) {
		consola.start(" 这里是新创建的异步函数 检查参数： ", ...args);

		return new Promise<ReturnType<T>>((resolve, reject) => {
			consola.start(" 内部promise 检查参数： ", ...args);
			resolve(func(...args));
		});
	};
}

export const initFlag = <const>"initFlag";

/**
 * 以队列串行的形式 运行异步函数
 * @see https://github.com/ascoders/weekly/blob/master/前沿技术/77.精读《用%20Reduce%20实现%20Promise%20串行执行》.md
 */
export function runPromiseByQueue<T>(promises: ((...args: any) => Promise<T>)[]) {
	promises.reduce(
		async function (previousPromise, nextPromise, currentIndex) {
			const response = await previousPromise;
			consola.log("\n");
			consola.log(` reduce串行函数 currentIndex= ${currentIndex} res =`, response);
			return await nextPromise(response);
		},
		Promise.resolve(initFlag) as Promise<any>,
	);
}

export const testPromises = [
	generateSimpleAsyncTask(async function (params) {
		await wait(400);
		consola.log(" 这里是 1 号函数 ");
		consola.log(" 查看上一个函数返回过来的参数： ", params);
		return 1;
	}),

	generateSimpleAsyncTask(async function (params) {
		await wait(500);
		consola.log(" 这里是 2 号函数 ");
		consola.log(" 查看上一个函数返回过来的参数： ", params);
		return 2;
	}),

	generateSimpleAsyncTask(async function (params) {
		await wait(500);
		consola.log(" 这里是 3 号函数 ");
		consola.log(" 查看上一个函数返回过来的参数： ", params);
		return 3;
	}),
];
