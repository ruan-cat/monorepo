export function wait<T extends (...args: any) => unknown>(params: { time: number; cb?: T }) {
	const { cb = (...args) => {} } = params;
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(cb());
		}, params.time);
	});
}

/** 创建简单的异步任务 */
export function generateSimpleAsyncTask<T extends (...args: any) => any>(func: T) {
	return function (...args: any) {
		console.log(" 这里是新创建的异步函数 检查参数： ", args);

		return new Promise<ReturnType<T>>((resolve, reject) => {
			console.log(" 内部promise 检查参数： ", args);
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
		function (previousPromise, nextPromise, currentIndex) {
			return previousPromise.then((response) => {
				console.log(` reduce串行函数 currentIndex= ${currentIndex} res =`, response);
				return nextPromise(response);
			});
		},
		Promise.resolve(initFlag) as Promise<any>,
	);
}

export const testPromises = [
	generateSimpleAsyncTask(() =>
		wait({
			time: 500,
			cb(params) {
				console.log(" 这里是 1 号函数 ");
				console.log(" 查看上一个函数返回过来的参数： ", params);
				return 1;
			},
		}),
	),

	generateSimpleAsyncTask(() =>
		wait({
			time: 500,
			cb(params) {
				console.log(" 这里是 2 号函数 ");
				console.log(" 查看上一个函数返回过来的参数： ", params);
				return 2;
			},
		}),
	),

	generateSimpleAsyncTask(() =>
		wait({
			time: 500,
			cb(params) {
				console.log(" 这里是 3 号函数 ");
				console.log(" 查看上一个函数返回过来的参数： ", params);
				return 3;
			},
		}),
	),
];
