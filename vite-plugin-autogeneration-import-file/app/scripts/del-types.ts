// 删除多余的类型

import { deleteAsync } from "del";
import { consola } from "consola";

import { dirname, resolve } from "node:path";

/**
 * 拼接路径
 * @private
 * 不作为公共方法 与特定路径强耦合的
 *
 * @deprecated
 * 不需要 对应的删除函数不需要生成具体的路径
 */
function joinPath(dir: string): string {
	const resPath = resolve("..", "types", dir);
	// console.log(" in joinPath => ", resPath);
	return resPath;
}

/**
 * TODO: 拆分成各个小配置字符串，移植到vite配置内，作为静态常量。
 */
const filenames = <const>[
	//
	// "components-instance.d.ts",
	// "components.d.ts",
	// 填写glob语法 对于 deleteAsync 函数匹配有效。
	"components*.d.ts",
	"typed-router.d.ts",
	"auto-imports.d.ts",
];

type Filename = (typeof filenames)[number];

function createTypeFilePath(filename: Filename) {
	return <const>`./types/${filename}`;
}

filenames.forEach(async (filename) => {
	const typeFilePath = createTypeFilePath(filename);
	try {
		const resDeleteAsync = await deleteAsync(typeFilePath);
		// consola.info(" 查看删除文件的返回值路径： ", resDeleteAsync);
		consola.success(`删除类型文件 ${filename} 成功`);
	} catch (error) {
		consola.error(`删除类型文件 ${filename} 失败`);
	}
});
