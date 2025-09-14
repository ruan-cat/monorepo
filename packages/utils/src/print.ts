import { isPlainObject, isArray } from "lodash-es";
import { isConditionsSome } from "./conditions";
import consola from "consola";

/**
 * 一个简单的格式化函数
 * @description
 * 用于将复杂对象变成纯文本 打印出来
 *
 * 主要用于测试框架打印完整的内容
 */
export function printFormat(params: any) {
	const boolRes = isConditionsSome([
		// 是不是纯对象？
		() => isPlainObject(params),
		// 或者是不是单纯的数组？
		() => isArray(params),
	]);

	// 如果是纯对象或者数组，则使用 JSON.stringify 格式化输出 否则原样返回
	const res = boolRes ? JSON.stringify(params, null, 2) : params;

	return res;
}

export interface PrintListParams {
	/** 标题，可以是字符串或根据列表生成标题的函数 */
	title: ((stringList: string[]) => string) | string;
	/** 要显示的字符串列表 */
	stringList: string[];
}

/**
 * 输出字符串列表
 * @description
 * 1. 生成编号列表文本
 * 2. 生成标题文本
 * 3. 输出标题和列表
 */
export function printList({ title, stringList }: PrintListParams): void {
	// 生成编号列表文本
	const listText = stringList.map((item, index) => `${index + 1}. ${item}`).join("\n");

	// 生成标题文本
	const titleText = typeof title === "function" ? title(stringList) : title;

	// 输出标题和列表
	consola.info(titleText);
	consola.box(listText);
}
