import { test, expect } from "vitest";

import { toNumber } from "lodash-es";

interface TestItem {
	input: number[];
	expected: number;
}

const testItems: TestItem[] = [
	{
		input: [3, 4, 5, 1, 2],
		expected: 1,
	},
	{
		input: [5, 5, 5, 6, 4, 5],
		expected: 4,
	},
];

function minNumberInRotateArray(array: number[]): number {
	let left = 0;
	let right = array.length - 1;
	while (left < right) {
		let mid = toNumber((left + right) / 2);
		// 最小的数字在mid右边
		if (array[mid] > array[right]) left = mid + 1;
		// 最小数字要么是mid要么在mid左边
		else right = mid;
	}
	return array[left];
}

test("01星球-202502-第十次大项目-题目", () => {
	for (const item of testItems) {
		expect(minNumberInRotateArray(item.input)).toBe(item.expected);
	}
});
