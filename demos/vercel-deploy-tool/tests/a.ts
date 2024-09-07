// // import { runPromiseByQueue, wait } from "@/utils/simple-promise-tools";
// import { runPromiseByQueue, wait } from "../src/utils/simple-promise-tools";

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

type PromiseCreator<T> = () => Promise<T>;
function runPromiseByQueue<T>(myPromises: PromiseCreator<T>[]) {
	myPromises.reduce((previousPromise, nextPromise) => previousPromise.then(() => nextPromise()), Promise.resolve());
}

const createPromise = (time, id) => () =>
	new Promise((solve) =>
		setTimeout(() => {
			console.log("promise", id);
			solve();
		}, time),
	);

runPromiseByQueue([createPromise(1000, 1), createPromise(500, 2), createPromise(500, 3)]);
