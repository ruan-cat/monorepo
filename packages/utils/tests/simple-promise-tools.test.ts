import { consola } from "consola";
import { sleep } from "@antfu/utils";

import { generateSimpleAsyncTask, runPromiseByQueue } from "../src/simple-promise-tools.ts";

// 没必要自己写了
// function wait(time: number) {
// 	return new Promise<void>((resolve) => {
// 		setTimeout(() => {
// 			resolve();
// 		}, time);
// 	});
// }

const testPromises = [
	generateSimpleAsyncTask(async function (params) {
		await sleep(400);
		consola.log(" 这里是 1 号函数 ");
		consola.log(" 查看上一个函数返回过来的参数： ", params);
		return 1;
	}),

	generateSimpleAsyncTask(async function (params) {
		await sleep(500);
		consola.log(" 这里是 2 号函数 ");
		consola.log(" 查看上一个函数返回过来的参数： ", params);
		return 2;
	}),

	generateSimpleAsyncTask(async function (params) {
		await sleep(500);
		consola.log(" 这里是 3 号函数 ");
		consola.log(" 查看上一个函数返回过来的参数： ", params);
		return 3;
	}),
];

// 测试队列函数的传参能力 发现这里是可以实现传参的
runPromiseByQueue(testPromises);
