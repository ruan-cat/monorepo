// // import { runPromiseByQueue, wait } from "@/utils/simple-promise-tools";
import { runPromiseByQueue, wait, testPromises } from "@ruan-cat/vercel-deploy-tool/src/utils/simple-promise-tools.ts";

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

runPromiseByQueue(testPromises);
