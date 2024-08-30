// 学习一下如何使用 https://github.com/sindresorhus/execa/blob/main/readme.md
import { execa } from "execa";

const pkgNames = <const>["pnpm", "turbopack", "vite", "vue", "koishi", "lodash", "axios"];

export function add(a: number, b: number): number {
	return a + b;
}

// console.log(add(2, 3)); // Output: 5

// 查询多个包的版本
const response = await Promise.all(
	pkgNames.map((name) => {
		return execa`pnpm v ${name}`;
	}),
);
response.forEach((res) => {
	console.log(" res.stdout ", res.stdout);
});
