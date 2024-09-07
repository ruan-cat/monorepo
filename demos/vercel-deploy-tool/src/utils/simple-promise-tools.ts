/**
 * 以队列串行的形式 运行异步函数
 * @see https://github.com/ascoders/weekly/blob/master/前沿技术/77.精读《用%20Reduce%20实现%20Promise%20串行执行》.md
 */
export function runPromiseByQueue<T>(promises: ((...args: any) => Promise<T>)[]) {
	promises.reduce<(...args: any) => Promise<T>>(
		function (previousPromise, nextPromise) {
			return function () {
				return previousPromise().then((res) => nextPromise(res));
			};
		},
		function () {
			return new Promise<T>(() => {});
		},
	);
}
