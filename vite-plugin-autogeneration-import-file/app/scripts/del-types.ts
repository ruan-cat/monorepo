// 删除多余的类型

import { deleteAsync } from "del";
import { consola } from "consola";

import { dirname, resolve } from "node:path";

const filenames = <const>[
	// 填写glob语法 对于 deleteAsync 函数匹配有效。
	"generate-types*.d.ts",
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
