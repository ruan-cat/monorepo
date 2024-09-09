// This is the entry point of the add-tool project
// Implement the add-tool functionality here

import { vercelNullConfig } from "@ruan-cat/vercel-deploy-tool";

export function add(a: number, b: number): number {
	return a + b;
}

console.log(add(2, 3)); // Output: 5

console.log(` 看看其他依赖子包的对象 `, vercelNullConfig);
