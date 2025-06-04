import { isPlainObject, isArray } from "lodash-es";
import { isConditionsSome } from "./conditions";

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
