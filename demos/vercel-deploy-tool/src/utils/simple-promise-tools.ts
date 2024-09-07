export function wait<T extends (...args: any) => unknown>(params: { time: number; cb?: T }) {
	const { cb = () => {} } = params;
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(cb());
		}, params.time);
	});
}

/** 创建简单的异步任务 */
export function generateSimpleAsyncTask<T extends (...args: any) => any>(func: T) {
	return function () {
		return new Promise<ReturnType<T>>((resolve, reject) => {
			resolve(func());
		});
	};
}

/**
 * 以队列串行的形式 运行异步函数
 * @see https://github.com/ascoders/weekly/blob/master/前沿技术/77.精读《用%20Reduce%20实现%20Promise%20串行执行》.md
 */
export function runPromiseByQueue<T>(promises: ((...args: any) => Promise<T>)[]) {
	promises.reduce(function (previousPromise, nextPromise) {
		return previousPromise.then(() => nextPromise());
	}, Promise.resolve() as Promise<any>);
}
