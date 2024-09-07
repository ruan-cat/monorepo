// // import { runPromiseByQueue, wait } from "@/utils/simple-promise-tools";
import { runPromiseByQueue, wait, testPromises } from "../src/utils/simple-promise-tools";

// const promises = [
// 	function () {
// 		return wait({
// 			time: 1000,
// 			cb() {
// 				console.log(" 1 ");
// 				return 1;
// 			},
// 		});
// 	},

// 	function () {
// 		return wait({
// 			time: 2000,
// 			cb() {
// 				console.log(" 2 ");
// 				return 2;
// 			},
// 		});
// 	},

// 	function () {
// 		return wait({
// 			time: 500,
// 			cb() {
// 				console.log(" 3 ");
// 				return 3;
// 			},
// 		});
// 	},
// ];

// runPromiseByQueue(promises);

// const createPromise = (time, id) => () =>
// 	new Promise((solve) =>
// 		setTimeout(() => {
// 			console.log("promise", id);
// 			solve();
// 		}, time),
// 	);

function createPromise(time: number, id: unknown) {
	return function () {
		return new Promise<void>((resolve) => {
			setTimeout(() => {
				console.log("promise", id);
				resolve();
			}, time);
		});
	};
}
// runPromiseByQueue([createPromise(1000, 1), createPromise(500, 2), createPromise(500, 3)]);

// export function wait<T extends (...args: any) => unknown>(params: { time: number; cb?: T }) {
// 	const { cb = () => {} } = params;
// 	return new Promise((resolve) => {
// 		setTimeout(() => {
// 			resolve(cb());
// 		}, params.time);
// 	});
// }
/** 创建简单的异步任务 */
export function generateSimpleAsyncTask<T extends (...args: any) => any>(func: T) {
	return function () {
		return new Promise<ReturnType<T>>((resolve, reject) => {
			resolve(func());
		});
	};
}

runPromiseByQueue(testPromises);
